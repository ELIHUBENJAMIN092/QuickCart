const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|monitoring|uptime|curl|wget|python-requests|go-http-client|node-fetch|axios/i;

// Obtiene la IP real del visitante detrás de Vercel, Cloudflare o un proxy.
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    (forwarded ? forwarded.split(",")[0] : "") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    "";

  // En desarrollo local no siempre hay cabeceras de proxy.
  if (!candidate && process.env.NODE_ENV === "development") return "127.0.0.1";

  return candidate.trim().replace(/^::ffff:/, "").slice(0, 45);
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
