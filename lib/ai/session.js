export const SESSION_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidSessionId(value) {
  return typeof value === "string" && SESSION_PATTERN.test(value);
}
