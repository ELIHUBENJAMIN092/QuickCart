import { validateChatBody } from "../lib/ai/validation";
import { getProviderError } from "../lib/ai/providerError";

describe("chat request validation", () => {
  test("acepta una conversación válida", () => {
    const result = validateChatBody({
      messages: [
        { role: "assistant", content: "Hola" },
        { role: "user", content: "Busco una impresora" },
      ],
    });

    expect(result.error).toBeUndefined();
    expect(result.messages).toEqual([
      { role: "assistant", content: "Hola" },
      { role: "user", content: "Busco una impresora" },
    ]);
  });

  test("rechaza un cuerpo sin mensajes", () => {
    expect(validateChatBody({}).code).toBe("INVALID_MESSAGES");
    expect(validateChatBody({ messages: [] }).code).toBe("INVALID_MESSAGES");
  });

  test("rechaza roles desconocidos y mensajes vacíos", () => {
    expect(validateChatBody({ messages: [{ role: "system", content: "x" }] }).code).toBe("INVALID_ROLE");
    expect(validateChatBody({ messages: [{ role: "user", content: "   " }] }).code).toBe("EMPTY_MESSAGE");
  });

  test("exige que el último mensaje sea del usuario", () => {
    expect(
      validateChatBody({
        messages: [
          { role: "user", content: "Hola" },
          { role: "assistant", content: "¿En qué te ayudo?" },
        ],
      }).code
    ).toBe("INVALID_LAST_MESSAGE");
  });

  test("limita la longitud de cada mensaje", () => {
    const result = validateChatBody({
      messages: [{ role: "user", content: "a".repeat(2001) }],
    });
    expect(result.code).toBe("MESSAGE_TOO_LONG");
  });
});

describe("AI provider errors", () => {
  test("identifies quota exhaustion and returns a useful retry message", () => {
    expect(
      getProviderError({
        status: 429,
        message: "RESOURCE_EXHAUSTED: Generate content requests per day limit exceeded",
      })
    ).toMatchObject({
      code: "AI_QUOTA_EXCEEDED",
      message: expect.stringContaining("límite de consultas de IA"),
    });
  });

  test("keeps timeout handling distinct from provider quota", () => {
    expect(getProviderError({ name: "AbortError" })).toMatchObject({ code: "TIMEOUT" });
    expect(getProviderError({ status: 500 })).toMatchObject({ code: "AI_ERROR" });
  });
});
