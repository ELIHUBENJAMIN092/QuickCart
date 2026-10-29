import { COMPANY_INFO } from "./company";

const MAX_SUMMARY_CHARS = 1200;
const MAX_MESSAGE_CHARS = 240;

/**
 * Construye un resumen breve y sin datos sensibles para entregar a un asesor.
 * Solo incluye los últimos mensajes y nombres de productos; nunca precios.
 */
export function buildHandoffSummary(messages = [], products = [], { maxMessages = 6 } = {}) {
  const recent = messages
    .filter((message) => typeof message?.content === "string" && message.content.trim())
    .slice(-maxMessages);

  const lines = recent.map((message) => {
    const author = message.role === "user" ? "Cliente" : "Asistente";
    const content = message.content.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_CHARS);
    return `${author}: ${content}`;
  });

  const names = [...new Set((products || []).map((product) => product?.name).filter(Boolean))].slice(0, 4);
  if (names.length) lines.push(`Productos de interés: ${names.join(", ")}`);

  const summary = lines.join("\n");
  return summary.length > MAX_SUMMARY_CHARS
    ? `${summary.slice(0, MAX_SUMMARY_CHARS - 1)}…`
    : summary;
}

export function buildWhatsAppHandoffUrl(summary = "") {
  const clean = String(summary || "").trim();
  const text = clean
    ? `Hola, vengo del asistente virtual de COMPEL. Este es el contexto de mi consulta:\n\n${clean}`
    : "Hola, vengo del asistente virtual de COMPEL y quiero hablar con un asesor.";
  return `${COMPANY_INFO.whatsapp_url}?text=${encodeURIComponent(text)}`;
}
