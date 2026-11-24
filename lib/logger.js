/**
 * Logger mínimo para logs del servidor y del cliente.
 * Nunca registra cuerpos de respuesta ni objetos completos: pueden contener
 * correos, teléfonos, cédulas, tokens o detalles internos de Supabase.
 */

const SENSITIVE_KEY = /authorization|token|secret|password|api[_-]?key|email|phone|idnumber|address|cart/i;

export function redact(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.slice(0, 300);
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redactado]" : redact(entry),
    ])
  );
}

function errorDetails(error) {
  if (!error) return "";
  if (typeof error === "string") return error.slice(0, 300);
  return {
    message: String(error.message || "").slice(0, 300),
    code: error.code || error.status || null,
  };
}

export function logError(context, error, meta = {}) {
  console.error(context, redact(meta), errorDetails(error));
}

export function logWarn(context, meta = {}) {
  console.warn(context, redact(meta));
}
