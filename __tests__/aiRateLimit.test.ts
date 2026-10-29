import { checkRateLimit, resetRateLimit } from "../lib/ai/rateLimit";

describe("chat rate limit", () => {
  beforeEach(() => resetRateLimit());

  test("permite 20 mensajes y bloquea el 21 en la misma ventana", async () => {
    for (let index = 0; index < 20; index += 1) {
      const result = await checkRateLimit("test-user");
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkRateLimit("test-user");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test("cada usuario tiene su propio límite", async () => {
    for (let index = 0; index < 20; index += 1) {
      await checkRateLimit("first-user");
    }

    const otherUser = await checkRateLimit("second-user");
    expect(otherUser.allowed).toBe(true);
  });

  test("falla de forma cerrada en producción si falta el rate limit compartido", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    try {
      await expect(checkRateLimit("production-user")).resolves.toMatchObject({
        allowed: false,
        unavailable: true,
      });
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      errorSpy.mockRestore();
    }
  });
});
