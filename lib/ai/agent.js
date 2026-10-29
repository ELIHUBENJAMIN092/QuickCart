import { CHAT_LIMITS, CHAT_MODELS, getGenAI } from "./config";
import { getProviderError } from "./providerError";
import { dedupeProducts, findMentionedProducts, getQuickReplies, searchProducts } from "./search";
import { toPromptProduct, toPublicProduct } from "./catalog";
import { buildHandoffSummary, buildWhatsAppHandoffUrl } from "./handoff";

const functionDeclarations = [
  {
    name: "search_products",
    description:
      "Busca productos reales del catálogo COMPEL. Úsala cuando necesites confirmar opciones, precios, stock o categorías antes de recomendar.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Términos de búsqueda, por ejemplo: impresora de etiquetas Zebra, lector RFID, tarjetas PVC.",
        },
        category: {
          type: "string",
          description:
            "Slug opcional de categoría: codigo-de-barras, computo-movil, rfid, identificacion-pvc o kioscos-y-pos.",
        },
        maxPrice: {
          type: "number",
          description: "Precio máximo en USD, solo si el usuario lo indica.",
        },
        inStock: {
          type: "boolean",
          description: "Si es true, devuelve solo productos con stock disponible.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description: "Obtiene la ficha de un producto del catálogo usando su id.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Id del producto que aparece en los resultados de búsqueda." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_my_orders",
    description:
      "Consulta los pedidos del usuario autenticado. Úsala solo para preguntas sobre estado, pago o contenido de pedidos.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Cantidad máxima de pedidos a devolver (1 a 10). Por defecto 5.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "request_human_handoff",
    description:
      "Solicita continuar la conversación con un asesor humano por WhatsApp. Úsala cuando el usuario pida una persona, una cotización formal o un caso que requiera negociación.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Motivo breve por el que el usuario necesita un asesor.",
        },
      },
      required: ["reason"],
      additionalProperties: false,
    },
  },
];

function toToolProduct(product, canViewCommerce) {
  return toPromptProduct(toPublicProduct(product, canViewCommerce));
}

function formatOrders(orders) {
  return (orders || []).map((order) => ({
    numero: String(order.id || "").slice(0, 8).toUpperCase(),
    fecha: order.created_at,
    total: Number(order.amount || 0),
    pago: order.is_paid ? "confirmado" : "pendiente",
    estado: order.is_paid ? "pago confirmado" : "pago pendiente",
    productos: (order.order_items || [])
      .map((item) => `${item.product_name} x${item.quantity}`)
      .join(", "),
  }));
}

async function executeTool(call, context) {
  const name = call?.name;
  const args = call?.args || {};
  const { catalog, canViewCommerce, auth, messages, products } = context;

  try {
    if (name === "search_products") {
      const found = searchProducts(String(args.query || ""), catalog, {
        limit: 5,
        category: typeof args.category === "string" ? args.category : "",
        maxPrice: canViewCommerce ? args.maxPrice : null,
        inStock: canViewCommerce && args.inStock === true,
      });
      return {
        response: {
          productos: found.map((product) => toToolProduct(product, canViewCommerce)),
          total: found.length,
        },
      };
    }

    if (name === "get_product") {
      const found = catalog.find((product) => product.id === String(args.id || ""));
      if (!found) return { response: { error: "Producto no encontrado en el catálogo." } };
      return { response: { producto: toToolProduct(found, canViewCommerce) } };
    }

    if (name === "get_my_orders") {
      if (!auth?.user || !auth?.supabase) {
        return {
          response: {
            error: "El usuario no ha iniciado sesión. Pídele que inicie sesión para consultar sus pedidos.",
          },
        };
      }

      const limit = Math.min(10, Math.max(1, Number(args.limit) || 5));
      const { data, error } = await auth.supabase
        .from("orders")
        .select("id, amount, is_paid, created_at, order_items(product_name, quantity)")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("No se pudieron consultar los pedidos para el chat:", error.message);
        return { response: { error: "No se pudieron consultar los pedidos en este momento." } };
      }

      const orders = formatOrders(data);
      return {
        response: {
          pedidos: orders,
          total: orders.length,
          mensaje: orders.length ? undefined : "El usuario no tiene pedidos registrados.",
        },
      };
    }

    if (name === "request_human_handoff") {
      const summary = buildHandoffSummary(messages, products);
      return {
        response: {
          ok: true,
          mensaje: "Se mostrará un botón de WhatsApp para continuar con un asesor.",
          motivo: typeof args.reason === "string" ? args.reason.slice(0, 200) : "",
        },
        handoff: {
          url: buildWhatsAppHandoffUrl(summary),
          summary,
        },
      };
    }
  } catch (error) {
    console.error(`Error ejecutando la herramienta ${name}:`, error.message);
    return { response: { error: "La herramienta no está disponible en este momento." } };
  }

  return { response: { error: "Herramienta no disponible." } };
}

/**
 * Ejecuta el asistente con tool calling y streaming.
 * Emite eventos: delta, products, handoff, quickReplies.
 */
export async function* runAssistantStream({
  messages,
  systemInstruction,
  catalog,
  canViewCommerce,
  initialProducts = [],
  auth = null,
  signal,
}) {
  const ai = getGenAI();
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const suggested = [...initialProducts];
  let rounds = 0;
  let fullText = "";
  let handoff = null;

  while (true) {
    const canUseTools = rounds < CHAT_LIMITS.maxToolRounds;
    let modelParts = [];
    let calls = [];

    for (let modelIndex = 0; modelIndex < CHAT_MODELS.length; modelIndex += 1) {
      modelParts = [];
      calls = [];
      let emitted = false;
      try {
        const stream = await ai.models.generateContentStream({
          model: CHAT_MODELS[modelIndex],
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: CHAT_LIMITS.maxOutputTokens,
            thinkingConfig: { thinkingBudget: 0 },
            ...(canUseTools
              ? {
                  tools: [{ functionDeclarations }],
                  toolConfig: { functionCallingConfig: { mode: "AUTO" } },
                }
              : {}),
            abortSignal: signal,
          },
        });

        for await (const chunk of stream) {
          for (const part of chunk.candidates?.[0]?.content?.parts || []) {
            modelParts.push(part);
          }
          const chunkCalls = chunk.functionCalls || [];
          if (chunkCalls.length) calls.push(...chunkCalls);
          if (!chunkCalls.length && chunk.text) {
            emitted = true;
            fullText += chunk.text;
            yield { type: "delta", text: chunk.text };
          }
        }
        break;
      } catch (error) {
        const hasFallback = modelIndex < CHAT_MODELS.length - 1;
        if (emitted || !hasFallback || getProviderError(error).code !== "AI_QUOTA_EXCEEDED") {
          throw error;
        }
        console.error(`Cuota agotada en ${CHAT_MODELS[modelIndex]}, usando ${CHAT_MODELS[modelIndex + 1]}.`);
      }
    }

    if (!calls.length || !canUseTools) break;
    rounds += 1;

    const responses = [];
    for (const call of calls) {
      const { response, handoff: toolHandoff } = await executeTool(call, {
        catalog,
        canViewCommerce,
        auth,
        messages,
        products: suggested,
      });
      if (toolHandoff) handoff = toolHandoff;

      for (const item of response.productos || []) {
        const fullProduct = catalog.find((product) => product.id === item.id);
        if (fullProduct) suggested.push(fullProduct);
      }
      if (response.producto?.id) {
        const fullProduct = catalog.find((product) => product.id === response.producto.id);
        if (fullProduct) suggested.push(fullProduct);
      }

      responses.push({
        functionResponse: {
          name: call.name,
          id: call.id,
          response,
        },
      });
    }

    contents.push({ role: "model", parts: modelParts });
    contents.push({ role: "user", parts: responses });
  }

  const mentionedProducts = findMentionedProducts(fullText, catalog, 4);
  const products = dedupeProducts(
    (mentionedProducts.length ? mentionedProducts : suggested).map((product) =>
      toPublicProduct(product, canViewCommerce)
    ),
    4
  );

  if (products.length) {
    yield { type: "products", products };
  }
  if (handoff) {
    yield { type: "handoff", url: handoff.url, summary: handoff.summary };
  }
  yield { type: "quickReplies", replies: getQuickReplies({ products, canViewCommerce }) };
}
