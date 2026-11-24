import {
  isBoundedText,
  isEmail,
  isEcuadorPhone,
  isIdNumber,
  isSafeIdempotencyKey,
  isUuid,
} from "../lib/validation";

describe("API validation", () => {
  test("accepts only well formed UUIDs", () => {
    expect(isUuid("c62a5272-da79-4558-95ca-12c832c25204")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  test("validates checkout address formats", () => {
    expect(isBoundedText("Juan Pérez", 160)).toBe(true);
    expect(isBoundedText("   ", 160)).toBe(false);
    expect(isBoundedText("a".repeat(161), 160)).toBe(false);
    expect(isEmail("cliente@ejemplo.com")).toBe(true);
    expect(isEmail("cliente@ejemplo")).toBe(false);
    expect(isEcuadorPhone("0987654321")).toBe(true);
    expect(isEcuadorPhone("593987654321")).toBe(false);
    expect(isIdNumber("1712345678")).toBe(true);
    expect(isIdNumber("1712345678001")).toBe(true);
    expect(isIdNumber("171234567")).toBe(false);
  });

  test("validates idempotency keys", () => {
    expect(isSafeIdempotencyKey("c62a5272-da79-4558-95ca-12c832c25204")).toBe(true);
    expect(isSafeIdempotencyKey("short")).toBe(false);
    expect(isSafeIdempotencyKey("clave con espacios")).toBe(false);
    expect(isSafeIdempotencyKey("a".repeat(65))).toBe(false);
  });
});
