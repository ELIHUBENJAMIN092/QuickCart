/**
 * Base de conocimiento de atención al cliente.
 * Solo incluye información verificable de la tienda; las condiciones
 * particulares se confirman siempre con un asesor.
 */
export const FAQS = [
  {
    id: "envios",
    question: "Envíos y entregas",
    answer:
      "Coordinamos entregas a todo el Ecuador. El costo y el tiempo se confirman con un asesor según la ciudad y el producto.",
  },
  {
    id: "pagos",
    question: "Formas de pago",
    answer:
      "El pago es contra entrega con confirmación manual. Las condiciones se confirman con el equipo antes del despacho.",
  },
  {
    id: "garantia",
    question: "Garantía",
    answer:
      "Trabajamos con productos originales con respaldo y garantía. La cobertura y las condiciones dependen del fabricante; confírmalas con un asesor.",
  },
  {
    id: "devoluciones",
    question: "Devoluciones y soporte",
    answer:
      "Si tienes un inconveniente con un pedido, escríbenos a soporte@compelecuador.com o por WhatsApp para revisar el caso.",
  },
  {
    id: "horario",
    question: "Horario de atención",
    answer:
      "Para confirmar el horario de atención actual, escríbenos por WhatsApp o al correo de soporte.",
  },
  {
    id: "facturacion",
    question: "Facturación",
    answer:
      "Al confirmar tu pedido, comparte los datos de facturación con el equipo para que te indiquen el proceso.",
  },
  {
    id: "cuenta",
    question: "Precios y stock",
    answer:
      "Los precios y el stock se muestran al iniciar sesión, cuando el comercio está habilitado.",
  },
  {
    id: "pedidos",
    question: "Estado de un pedido",
    answer:
      "Puedes revisar tus pedidos en Mis órdenes. Si necesitas ayuda con uno, comparte el número de orden con un asesor.",
  },
  {
    id: "b2b",
    question: "Asesoría para empresas",
    answer:
      "Cuéntanos tu caso de uso, el volumen estimado y la urgencia; te conectamos con un especialista.",
  },
  {
    id: "contacto",
    question: "Contacto",
    answer:
      "WhatsApp +593 98 461 7873 · soporte@compelecuador.com · 02 2548-701 / 02 2902-384.",
  },
];

export function formatKnowledge(faqs = FAQS) {
  return faqs.map((faq) => `- ${faq.question}: ${faq.answer}`).join("\n");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FAQ_KEYWORDS = {
  envios: ["envio", "envios", "entrega", "despacho", "flete", "courier", "ciudad", "provincia"],
  pagos: ["pago", "pagos", "pagar", "cancelar", "transferencia", "tarjeta", "contra entrega"],
  garantia: ["garantia", "respaldo", "fabricante"],
  devoluciones: ["devolucion", "devoluciones", "devolver", "cambio", "soporte", "reclamo", "inconveniente"],
  horario: ["horario", "atencion", "abierto", "hora"],
  facturacion: ["factura", "facturacion", "ruc", "comprobante"],
  cuenta: ["precio", "precios", "costo", "costos", "stock", "disponibilidad", "sesion"],
  pedidos: ["pedido", "pedidos", "orden", "ordenes", "estado de un pedido"],
  b2b: ["empresa", "asesoria", "mayoreo", "volumen", "cotizacion", "negocio", "institucional"],
  contacto: ["contacto", "whatsapp", "correo", "telefono"],
};

export function findFaq(query, faqs = FAQS) {
  const text = normalize(query);
  if (!text) return [];

  const scored = faqs
    .map((faq, index) => {
      const keywords = FAQ_KEYWORDS[faq.id] || [];
      const score = keywords.reduce(
        (total, keyword) => total + (text.includes(normalize(keyword)) ? 1 : 0),
        0
      );
      return { faq, index, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scored.slice(0, 3).map(({ faq }) => faq);
}
