// Consentimiento de cookies de COMPEL.
//
// Las preferencias se guardan en localStorage (no en una cookie) para no
// enviar datos al servidor y poder leerlas antes de cargar cualquier script
// de analítica o marketing. La versión permite invalidar el consentimiento
// cuando cambie la política o las categorías.

export const COOKIE_CONSENT_STORAGE_KEY = "compel-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1;

// Evento que abre el panel de preferencias desde cualquier parte del sitio
// (por ejemplo, el enlace "Configurar cookies" del pie de página).
export const COOKIE_CONSENT_OPEN_EVENT = "compel:cookie-consent-open";

// Evento que se emite al guardar preferencias, para que los scripts de
// terceros se activen o desactiven sin recargar la página.
export const COOKIE_CONSENT_CHANGE_EVENT = "compel:cookie-consent-change";

export const COOKIE_CATEGORIES = [
  {
    id: "necessary",
    name: "Necesarias",
    required: true,
    description:
      "Permiten el funcionamiento de la tienda: inicio de sesión, carrito de compras, seguridad y preferencias básicas. No pueden desactivarse.",
  },
  {
    id: "analytics",
    name: "Analíticas",
    required: false,
    description:
      "Nos ayudan a medir visitas, páginas consultadas y comportamiento de navegación para mejorar la tienda. Incluyen Google Analytics y Google Tag Manager.",
  },
  {
    id: "marketing",
    name: "Marketing",
    required: false,
    description:
      "Permiten mostrar publicidad personalizada y medir campañas en plataformas publicitarias. Si las rechazas, no se usarán para ese fin.",
  },
];

export function defaultConsent() {
  return { necessary: true, analytics: false, marketing: false };
}

export function normalizeConsent(value) {
  return {
    necessary: true,
    analytics: value?.analytics === true,
    marketing: value?.marketing === true,
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Navegadores con almacenamiento bloqueado (modo privado estricto).
    return null;
  }
}

export function readConsent(storage) {
  const store = resolveStorage(storage);
  if (!store) return null;

  try {
    const raw = store.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      ...normalizeConsent(parsed),
      version: Number.isInteger(parsed.version) ? parsed.version : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return null;
  }
}

export function saveConsent(consent, storage, now = new Date()) {
  const value = {
    ...normalizeConsent(consent),
    version: COOKIE_CONSENT_VERSION,
    updatedAt: now.toISOString(),
  };

  const store = resolveStorage(storage);
  if (store) {
    try {
      store.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Si el almacenamiento está lleno o bloqueado, la elección sigue
      // aplicándose durante esta visita, pero no se recordará.
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGE_EVENT));
  }

  return value;
}

export function hasConsent(category, storage) {
  if (category === "necessary") return true;
  return readConsent(storage)?.[category] === true;
}
