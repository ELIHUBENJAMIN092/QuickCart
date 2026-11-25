import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  defaultConsent,
  hasConsent,
  normalizeConsent,
  readConsent,
  saveConsent,
} from "@/lib/cookieConsent";

function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

describe("cookieConsent", () => {
  it("solo acepta las cookies necesarias por defecto", () => {
    expect(defaultConsent()).toEqual({ necessary: true, analytics: false, marketing: false });
  });

  it("normaliza valores no booleanos y fuerza las necesarias", () => {
    expect(normalizeConsent({ necessary: false, analytics: "true", marketing: 1 })).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  });

  it("devuelve null cuando no hay preferencias guardadas", () => {
    expect(readConsent(createStorage())).toBeNull();
  });

  it("devuelve null si el contenido guardado no es válido", () => {
    const storage = createStorage();
    storage.setItem(COOKIE_CONSENT_STORAGE_KEY, "{no-json");
    expect(readConsent(storage)).toBeNull();
  });

  it("guarda y recupera la decisión del visitante con versión y fecha", () => {
    const storage = createStorage();
    const saved = saveConsent({ necessary: true, analytics: true, marketing: false }, storage, new Date("2026-11-25T10:00:00.000Z"));

    expect(saved).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: false,
      version: COOKIE_CONSENT_VERSION,
      updatedAt: "2026-11-25T10:00:00.000Z",
    });
    expect(readConsent(storage)).toMatchObject(saved);
  });

  it("hasConsent respeta las categorías necesarias y opcionales", () => {
    const storage = createStorage();
    saveConsent({ analytics: false, marketing: true }, storage);

    expect(hasConsent("necessary", storage)).toBe(true);
    expect(hasConsent("analytics", storage)).toBe(false);
    expect(hasConsent("marketing", storage)).toBe(true);
  });

  it("no falla si el almacenamiento lanza errores", () => {
    const storage = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };

    expect(readConsent(storage)).toBeNull();
    expect(() => saveConsent(defaultConsent(), storage)).not.toThrow();
  });
});
