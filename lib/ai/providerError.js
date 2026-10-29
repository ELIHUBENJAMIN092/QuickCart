export function getProviderError(error) {
  const status = Number(error?.status || error?.code);
  const message = String(error?.message || "");
  const quotaExceeded =
    status === 429 ||
    /RESOURCE_EXHAUSTED|quota exceeded|too many requests/i.test(message);

  if (quotaExceeded) {
    return {
      code: "AI_QUOTA_EXCEEDED",
      message:
        "El asistente alcanzó temporalmente el límite de consultas de IA. Intenta más tarde o continúa por WhatsApp.",
    };
  }

  if (error?.name === "AbortError") {
    return {
      code: "TIMEOUT",
      message: "La respuesta tardó demasiado. Intenta de nuevo.",
    };
  }

  return {
    code: "AI_ERROR",
    message: "No pude completar la respuesta. Intenta de nuevo.",
  };
}
