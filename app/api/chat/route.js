import { NextResponse } from "next/server";
import {
  createSupabasePublicClient,
  getAuthenticatedSupabase,
} from "@/lib/supabase/server";
import { getCommerceEnabled } from "@/lib/commerce";
import { validateChatBody } from "@/lib/ai/validation";
import {
  getCatalog,
  loadCatalogCategories,
  toPromptProduct,
  toPublicProduct,
} from "@/lib/ai/catalog";
import { dedupeProducts, detectCategory, searchProducts, tokenize } from "@/lib/ai/search";
import { buildSystemInstruction } from "@/lib/ai/prompt";
import { findFaq } from "@/lib/ai/knowledge";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { CHAT_LIMITS, RATE_LIMITS, getGenAI } from "@/lib/ai/config";
import { runAssistantStream } from "@/lib/ai/agent";
import { buildCartSummary } from "@/lib/ai/cart";
import { getClientKey } from "@/lib/ai/request";
import { persistChatTurn } from "@/lib/ai/persistence";
import { getProviderError } from "@/lib/ai/providerError";
import { buildHandoffSummary, buildWhatsAppHandoffUrl } from "@/lib/ai/handoff";

function buildQuotaFallbackText(hasProducts) {
  return hasProducts
    ? "En este momento el asistente de IA está saturado, pero encontré estos productos relacionados con tu consulta. Para una atención personalizada, continúa con un asesor por WhatsApp."
    : "En este momento el asistente de IA está saturado y no puedo responder tu consulta. Un asesor puede atenderte por WhatsApp o puedes solicitar asesoría desde el chat.";
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message, status, code, extra = {}) {
  return NextResponse.json(
    { success: false, code, message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("La solicitud no contiene JSON válido.", 400, "INVALID_JSON");
  }

  const {
    messages,
    sessionId,
    consent,
    cart,
    error: validationError,
    code: validationCode,
  } = validateChatBody(body);
  if (validationError) {
    return jsonError(validationError, 400, validationCode);
  }

  let auth = { supabase: null, user: null };
  try {
    auth = await getAuthenticatedSupabase(request);
  } catch (error) {
    console.error("No se pudo validar la sesión del chat:", error.message);
  }

  let commerceEnabled = false;
  try {
    commerceEnabled = await getCommerceEnabled();
  } catch (error) {
    console.error("No se pudo leer la configuración del comercio:", error.message);
  }
  const canViewCommerce = Boolean(auth.user && commerceEnabled);

  const rateLimit = await checkRateLimit(getClientKey(request, auth.user), RATE_LIMITS.chat);
  if (rateLimit.unavailable) {
    return jsonError(
      "El servicio de chat está temporalmente indisponible. Intenta de nuevo más tarde.",
      503,
      "RATE_LIMIT_UNAVAILABLE"
    );
  }
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMITED",
        message: "Has enviado muchos mensajes. Espera un momento e intenta de nuevo.",
      },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    );
  }

  try {
    getGenAI();
  } catch (error) {
    console.error("Asistente sin configurar:", error.message);
    return jsonError(
      "El asistente no está disponible en este momento. Escríbenos por WhatsApp.",
      503,
      "AI_UNAVAILABLE"
    );
  }

  let catalog = [];
  try {
    catalog = await getCatalog();
  } catch (error) {
    console.error("No se pudo cargar el catálogo para el chat:", error.message);
  }

  const catalogCategories = await loadCatalogCategories();
  const lastUserMessage = messages[messages.length - 1].content;
  const isGreeting = tokenize(lastUserMessage).length === 0;
  const detectedCategory = detectCategory(lastUserMessage, catalogCategories);
  const relevantProducts = isGreeting
    ? []
    : searchProducts(lastUserMessage, catalog, {
        limit: CHAT_LIMITS.maxProducts,
        detectedCategory,
      });
  const publicProducts = relevantProducts.map((product) => toPublicProduct(product, canViewCommerce));
  const cartSummary = buildCartSummary(cart, catalog, canViewCommerce);

  const systemInstruction = buildSystemInstruction({
    categories: catalogCategories,
    faqs: findFaq(lastUserMessage),
    products: publicProducts.map(toPromptProduct),
    canViewCommerce,
    isAuthenticated: Boolean(auth.user),
    cart: cartSummary,
    currency: process.env.NEXT_PUBLIC_CURRENCY || "$",
  });

  const encoder = new TextEncoder();
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), CHAT_LIMITS.requestTimeoutMs);
  const signal =
    typeof AbortSignal.any === "function"
      ? AbortSignal.any([request.signal, timeoutController.signal])
      : timeoutController.signal;

  let closed = false;
  let assistantText = "";
  let assistantProducts = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      try {
        send({ type: "start" });

        for await (const event of runAssistantStream({
          messages,
          systemInstruction,
          catalog,
          canViewCommerce,
          initialProducts: relevantProducts,
          auth,
          signal,
        })) {
          if (event.type === "delta" && event.text) assistantText += event.text;
          if (event.type === "products" && Array.isArray(event.products)) {
            assistantProducts = event.products;
          }
          send(event);
        }

        if (sessionId && consent) {
          let persistenceClient = auth.supabase;
          if (!persistenceClient) {
            try {
              persistenceClient = createSupabasePublicClient();
            } catch (error) {
              console.error("No se pudo inicializar el cliente de persistencia:", error.message);
            }
          }
          await persistChatTurn({
            supabase: persistenceClient,
            sessionId,
            user: auth.user,
            userMessage: lastUserMessage,
            assistantMessage: assistantText,
            products: assistantProducts,
          });
        }

        send({ type: "done" });
      } catch (error) {
        if (!closed) {
          const providerError = getProviderError(error);
          console.error("Error generando respuesta del chat:", {
            code: providerError.code,
            status: error?.status || error?.code || null,
          });

          if (providerError.code === "AI_QUOTA_EXCEEDED" && !assistantText) {
            const products = dedupeProducts(
              relevantProducts.map((product) => toPublicProduct(product, canViewCommerce)),
              4
            );
            send({ type: "delta", text: buildQuotaFallbackText(products.length > 0) });
            if (products.length) send({ type: "products", products });
            send({ type: "handoff", url: buildWhatsAppHandoffUrl(buildHandoffSummary(messages, products)) });
            send({ type: "quickReplies", replies: ["Solicitar asesoría", "Hablar con un asesor"] });
            send({ type: "done" });
          } else {
            send({ type: "error", ...providerError });
          }
        }
      } finally {
        clearTimeout(timeout);
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
      clearTimeout(timeout);
      timeoutController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
