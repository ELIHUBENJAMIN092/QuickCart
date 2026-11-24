/** Validaciones compartidas entre rutas API. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID.test(value);
}

export function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

/** Ecuador: celulares 09 + 8 dígitos. */
export function isEcuadorPhone(value) {
  return typeof value === "string" && /^09\d{8}$/.test(value);
}

/** Cédula (10) o RUC (13) ecuatoriano. */
export function isIdNumber(value) {
  return typeof value === "string" && (/^\d{10}$/.test(value) || /^\d{13}$/.test(value));
}

export function isBoundedText(value, maxLength, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength && value.length <= maxLength;
}

export function isSafeIdempotencyKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);
}
