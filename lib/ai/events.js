export const EVENT_TYPES = [
  "chat_open",
  "chat_close",
  "message_sent",
  "product_impression",
  "product_click",
  "add_to_cart",
  "handoff",
  "lead_submitted",
  "feedback_submitted",
  "chat_error",
];

const EVENT_SET = new Set(EVENT_TYPES);

/**
 * Valida un evento de analítica del widget.
 * El metadata debe ser un objeto plano y pequeño; no se aceptan mensajes completos.
 */
export function validateEvent(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "El evento no es válido." };
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (!EVENT_SET.has(type)) return { error: "Tipo de evento no permitido." };

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

  let serialized = "";
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    return { error: "Los datos del evento no son válidos." };
  }
  if (serialized.length > 2000) return { error: "Los datos del evento son demasiado grandes." };

  return { event: { type, metadata } };
}
