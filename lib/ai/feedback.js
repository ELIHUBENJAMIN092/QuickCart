/**
 * Valida la opinión del usuario sobre una respuesta del asistente.
 */
export function validateFeedback(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "La opinión no es válida." };
  }

  const rating = body.rating === "up" ? "up" : body.rating === "down" ? "down" : "";
  if (!rating) return { error: "Indica si la respuesta te resultó útil." };

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";
  const messageExcerpt =
    typeof body.messageExcerpt === "string" ? body.messageExcerpt.trim().slice(0, 500) : "";

  return {
    feedback: {
      rating,
      comment: comment || null,
      messageExcerpt: messageExcerpt || null,
    },
  };
}
