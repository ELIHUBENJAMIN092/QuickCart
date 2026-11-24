const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|monitoring|uptime|curl|wget|python-requests|go-http-client|node-fetch|axios/i;

function normalizeIp(value) {
  const ip = String(value || "")
    .split(",")[0]
    .trim()
    .replace(/^::ffff:/, "")
    .slice(0, 45);
  return isValidIp(ip) ? ip : "";
}

/**
 * Obtiene la IP real del visitante.
 *
 * Se prefieren las cabeceras que sobrescribe la plataforma (definidas por
 * IP_SOURCE_HEADER o por el entorno) antes que `x-forwarded-for`, que un
 * cliente puede enviar por su cuenta para evadir bloqueos y rate limits.
 */
export function getClientIp(request) {
  const headers = request.headers;

  const configured = process.env.IP_SOURCE_HEADER;
  if (configured) {
    const ip = normalizeIp(headers.get(configured));
    if (ip) return ip;
  }

  if (process.env.VERCEL) {
    const vercelIp = normalizeIp(headers.get("x-vercel-forwarded-for"));
    if (vercelIp) return vercelIp;
  }

  const cloudflareIp = normalizeIp(headers.get("cf-connecting-ip"));
  if (cloudflareIp) return cloudflareIp;

  const realIp = normalizeIp(headers.get("x-real-ip"));
  if (realIp) return realIp;

  const forwardedIp = normalizeIp(headers.get("x-forwarded-for"));
  if (forwardedIp) return forwardedIp;

  // En desarrollo local no siempre hay cabeceras de proxy.
  if (process.env.NODE_ENV === "development") return "127.0.0.1";

  return "";
}

export function isLikelyBot(userAgent) {
  return BOT_PATTERN.test(String(userAgent || ""));
}

export function isValidIp(value) {
  const ip = String(value || "").trim();
  if (!ip || ip.length > 45) return false;

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split(".").every((part) => {
      const number = Number(part);
      return Number.isInteger(number) && number >= 0 && number <= 255;
    });
  }

  // IPv6 (incluye IPv4 mapeada, por eso se permiten puntos).
  return ip.includes(":") && /^[0-9a-fA-F:.]+$/.test(ip);
}

const BROWSERS = [
  ["Edg/", "Edge"],
  ["OPR/", "Opera"],
  ["Chrome/", "Chrome"],
  ["Firefox/", "Firefox"],
  ["Safari/", "Safari"],
];

const SYSTEMS = [
  ["Windows", "Windows"],
  ["Android", "Android"],
  ["iPhone", "iOS"],
  ["iPad", "iPadOS"],
  ["Mac OS X", "macOS"],
  ["Linux", "Linux"],
];

// Resumen legible del user-agent para mostrarlo en el panel.
export function describeUserAgent(userAgent) {
  const ua = String(userAgent || "");
  if (!ua) return "Desconocido";
  const browser = BROWSERS.find(([token]) => ua.includes(token))?.[1] || "Otro";
  const system = SYSTEMS.find(([token]) => ua.includes(token))?.[1] || "Otro";
  return `${browser} · ${system}`;
}

// Host del referrer, o "Directo" cuando no viene de un enlace.
export function describeReferrer(referrer) {
  const value = String(referrer || "").trim();
  if (!value) return "Directo";
  try {
    return new URL(value).hostname.replace(/^www\./, "") || "Directo";
  } catch {
    return value.slice(0, 80);
  }
}
