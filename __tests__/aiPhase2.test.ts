import { normalizeCart, buildCartSummary } from "../lib/ai/cart";
import { buildHandoffSummary, buildWhatsAppHandoffUrl } from "../lib/ai/handoff";
import { validateLead } from "../lib/ai/lead";
import { validateFeedback } from "../lib/ai/feedback";
import { validateEvent, EVENT_TYPES } from "../lib/ai/events";
import { validateChatBody } from "../lib/ai/validation";
import { isValidSessionId } from "../lib/ai/session";
import { FAQS, findFaq, formatKnowledge } from "../lib/ai/knowledge";
import { toPromptProduct, toPublicProduct } from "../lib/ai/productVisibility";

const catalog = [
  {
    id: "printer-1",
    name: "Impresora Zebra ZD220",
    price: 320,
    inStock: true,
    categoryName: "Código de barras",
  },
  {
    id: "card-1",
    name: "Tarjetas PVC",
    price: 0.75,
    inStock: false,
    categoryName: "Identificación PVC",
  },
];

describe("cart normalization and summary", () => {
  test("acepta el mapa del carrito y descarta cantidades inválidas", () => {
    expect(normalizeCart({ "printer-1": 2, "card-1": 0, bad: -3 })).toEqual([
      { id: "printer-1", quantity: 2 },
    ]);
  });

  test("acepta el formato de lista y fusiona duplicados", () => {
    expect(
      normalizeCart({
        items: [
          { id: "printer-1", quantity: 1 },
          { id: "printer-1", quantity: 2 },
          { id: "", quantity: 4 },
        ],
      })
    ).toEqual([{ id: "printer-1", quantity: 3 }]);
  });

  test("limita la cantidad máxima por producto", () => {
    expect(normalizeCart({ "printer-1": 500 })).toEqual([
      { id: "printer-1", quantity: 99 },
    ]);
  });

  test("calcula totales con IVA cuando el comercio es visible", () => {
    const summary = buildCartSummary({ "printer-1": 2 }, catalog, true);
    expect(summary.count).toBe(2);
    expect(summary.subtotal).toBe(640);
    expect(summary.tax).toBe(96);
    expect(summary.total).toBe(736);
    expect(summary.priceHidden).toBe(false);
  });

  test("oculta precios y totales sin sesión o comercio inactivo", () => {
    const summary = buildCartSummary({ "printer-1": 2 }, catalog, false);
    expect(summary.subtotal).toBeNull();
    expect(summary.tax).toBeNull();
    expect(summary.total).toBeNull();
    expect(summary.priceHidden).toBe(true);
    expect(summary.items[0].unitPrice).toBeNull();
    expect(summary.items[0].available).toBeNull();
  });

  test("marca productos fuera del catálogo como no disponibles", () => {
    const summary = buildCartSummary({ missing: 1 }, catalog, true);
    expect(summary.items[0]).toMatchObject({
      id: "missing",
      name: "Producto no disponible",
      available: false,
      lineTotal: null,
    });
  });
});

describe("handoff", () => {
  test("resume los últimos mensajes e incluye nombres de productos", () => {
    const messages = [
      { role: "user", content: "Hola" },
      { role: "assistant", content: "¿Qué buscas?" },
      { role: "user", content: "Una Zebra" },
      { role: "assistant", content: "Te recomiendo la ZD220" },
    ];
    const summary = buildHandoffSummary(messages, [{ name: "Impresora Zebra ZD220" }], {
      maxMessages: 2,
    });

    expect(summary).toContain("Cliente: Una Zebra");
    expect(summary).toContain("Asistente: Te recomiendo la ZD220");
    expect(summary).not.toContain("Hola");
    expect(summary).toContain("Productos de interés: Impresora Zebra ZD220");
  });

  test("no incluye precios en el resumen", () => {
    const summary = buildHandoffSummary(
      [{ role: "user", content: "¿Cuánto cuesta? $320" }],
      [{ name: "Impresora", price: 320 }]
    );
    expect(summary).not.toContain("price");
    expect(summary).toContain("Impresora");
  });

  test("genera una URL de WhatsApp codificada", () => {
    const url = buildWhatsAppHandoffUrl("Cliente: hola");
    expect(url.startsWith("https://wa.me/593984617873?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Cliente: hola");
  });

  test("genera una URL válida sin resumen", () => {
    const url = buildWhatsAppHandoffUrl("");
    expect(url).toContain("https://wa.me/593984617873?text=");
    expect(decodeURIComponent(url.split("text=")[1])).toContain("asesor");
  });
});

describe("lead validation", () => {
  const base = { name: "Ana", email: "ana@empresa.com", consent: true };

  test("acepta una solicitud válida", () => {
    const result = validateLead(base);
    expect(result.error).toBeUndefined();
    expect(result.lead).toMatchObject({
      name: "Ana",
      email: "ana@empresa.com",
      consent: true,
    });
  });

  test("exige nombre, contacto y consentimiento", () => {
    expect(validateLead({ ...base, name: "" }).error).toBeDefined();
    expect(validateLead({ name: "Ana", consent: true }).error).toMatch(/correo o un teléfono/);
    expect(validateLead({ ...base, consent: false }).error).toMatch(/aceptar/);
  });

  test("valida el formato del correo y del teléfono", () => {
    expect(validateLead({ ...base, email: "no-es-correo" }).error).toMatch(/correo/);
    expect(validateLead({ name: "Ana", phone: "abc", consent: true }).error).toMatch(/teléfono/);
  });

  test("rechaza el honeypot", () => {
    expect(validateLead({ ...base, website: "http://spam" }).error).toBeDefined();
  });

  test("recorta longitudes y normaliza el correo", () => {
    const result = validateLead({
      ...base,
      email: "  ANA@EMPRESA.COM ",
      name: "  Ana  María ",
      message: "x".repeat(2000),
    });
    expect(result.lead.email).toBe("ana@empresa.com");
    expect(result.lead.name).toBe("Ana María");
    expect(result.lead.message.length).toBe(1000);
  });
});

describe("feedback validation", () => {
  test("acepta up/down y recorta el comentario", () => {
    const result = validateFeedback({ rating: "up", comment: "  útil  " });
    expect(result.feedback).toEqual({
      rating: "up",
      comment: "útil",
      messageExcerpt: null,
    });
  });

  test("rechaza ratings desconocidos", () => {
    expect(validateFeedback({ rating: "meh" }).error).toBeDefined();
    expect(validateFeedback(null).error).toBeDefined();
  });
});

describe("analytics events", () => {
  test("acepta un evento permitido", () => {
    const result = validateEvent({ type: "chat_open", metadata: { source: "widget" } });
    expect(result.event).toEqual({ type: "chat_open", metadata: { source: "widget" } });
  });

  test("rechaza tipos fuera de la lista", () => {
    expect(validateEvent({ type: "drop_table" }).error).toBeDefined();
    expect(EVENT_TYPES).toContain("handoff");
  });

  test("rechaza metadata excesiva", () => {
    expect(validateEvent({ type: "chat_open", metadata: { text: "x".repeat(3000) } }).error).toBeDefined();
  });
});

describe("chat body phase 2 fields", () => {
  test("normaliza sessionId, consent y carrito", () => {
    const result = validateChatBody({
      messages: [{ role: "user", content: "Hola" }],
      sessionId: "abc12345-xyz",
      consent: true,
      cart: { "printer-1": 2 },
    });

    expect(result.sessionId).toBe("abc12345-xyz");
    expect(result.consent).toBe(true);
    expect(result.cart).toEqual([{ id: "printer-1", quantity: 2 }]);
  });

  test("descarta sesiones inválidas y consentimiento no booleano", () => {
    const result = validateChatBody({
      messages: [{ role: "user", content: "Hola" }],
      sessionId: "bad id!",
      consent: "true",
    });
    expect(result.sessionId).toBe("");
    expect(result.consent).toBe(false);
  });
});

describe("session ids", () => {
  test("acepta ids alfanuméricos de 8 a 64 caracteres", () => {
    expect(isValidSessionId("abc12345")).toBe(true);
    expect(isValidSessionId("a".repeat(64))).toBe(true);
  });

  test("rechaza ids cortos o con caracteres inválidos", () => {
    expect(isValidSessionId("short")).toBe(false);
    expect(isValidSessionId("bad id!!")).toBe(false);
    expect(isValidSessionId(null)).toBe(false);
  });
});

describe("knowledge base", () => {
  test("formatea las preguntas frecuentes", () => {
    const text = formatKnowledge();
    expect(text).toContain("Envíos y entregas");
    expect(text).toContain("Formas de pago");
  });

  test("encuentra preguntas por palabra clave", () => {
    expect(findFaq("¿cómo funciona la garantía?").map((faq) => faq.id)).toContain("garantia");
    expect(findFaq("horario").map((faq) => faq.id)).toContain("horario");
    expect(findFaq("¿Cuánto cuesta y tienen disponibilidad?").map((faq) => faq.id)).toContain("cuenta");
    expect(findFaq("¿Cómo llega el producto a mi ciudad?").map((faq) => faq.id)).toContain("envios");
  });

  test("devuelve una lista vacía para consultas vacías", () => {
    expect(findFaq("")).toEqual([]);
    expect(FAQS.length).toBeGreaterThan(5);
  });
});

describe("catalog visibility", () => {
  const product = {
    id: "printer-1",
    name: "Impresora Zebra ZD220",
    categoryName: "Código de barras",
    price: 320,
    regularPrice: 350,
    stock: 4,
    inStock: true,
    searchText: "internal search text",
  };

  test("oculta precio y disponibilidad del producto para visitantes", () => {
    const publicProduct = toPublicProduct(product, false);
    expect(publicProduct).toMatchObject({
      price: null,
      regularPrice: null,
      stock: null,
      inStock: null,
      priceHidden: true,
    });
    expect(publicProduct).not.toHaveProperty("searchText");
    expect(toPromptProduct(publicProduct)).toMatchObject({
      precio: null,
      precio_regular: null,
      stock: null,
      disponible: null,
    });
  });

  test("mantiene datos comerciales para usuarios autorizados", () => {
    const publicProduct = toPublicProduct(product, true);
    expect(publicProduct).toMatchObject({ price: 320, stock: 4, inStock: true, priceHidden: false });
    expect(toPromptProduct(publicProduct)).toMatchObject({ precio: 320, stock: 4, disponible: true });
  });
});
