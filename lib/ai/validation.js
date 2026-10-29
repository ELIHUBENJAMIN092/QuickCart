import { CHAT_LIMITS } from "./limits";
import { normalizeCart } from "./cart";
import { isValidSessionId } from "./session";

/**
 * Valida y normaliza el cuerpo de /api/chat.
 * Devuelve { messages, sessionId, consent, cart } o { error, code }.
 */
export function validateChatBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "La solicitud no es válida.", code: "INVALID_BODY" };
  }

  const rawMessages = body.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { error: "Debes enviar al menos un mensaje.", code: "INVALID_MESSAGES" };
  }
  if (rawMessages.length > CHAT_LIMITS.maxMessages) {
    return {
      error: `La conversación admite máximo ${CHAT_LIMITS.maxMessages} mensajes.`,
      code: "TOO_MANY_MESSAGES",
    };
  }

  const messages = [];
  let totalChars = 0;

  for (const item of rawMessages) {
    const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
    if (!role) {
      return { error: "Cada mensaje debe tener un rol válido.", code: "INVALID_ROLE" };
    }

    const content = typeof item?.content === "string" ? item.content.trim() : "";
    if (!content) {
      return { error: "Los mensajes no pueden estar vacíos.", code: "EMPTY_MESSAGE" };
    }
    if (content.length > CHAT_LIMITS.maxMessageChars) {
      return {
        error: `Cada mensaje admite máximo ${CHAT_LIMITS.maxMessageChars} caracteres.`,
        code: "MESSAGE_TOO_LONG",
      };
    }

    totalChars += content.length;
    if (totalChars > CHAT_LIMITS.maxTotalChars) {
      return { error: "La conversación es demasiado larga.", code: "CONVERSATION_TOO_LONG" };
    }

    messages.push({ role, content });
  }

  if (messages[messages.length - 1].role !== "user") {
    return { error: "El último mensaje debe ser del usuario.", code: "INVALID_LAST_MESSAGE" };
  }

  return {
    messages,
    sessionId: isValidSessionId(body.sessionId) ? body.sessionId : "",
    consent: body.consent === true,
    cart: normalizeCart(body.cart),
  };
}
