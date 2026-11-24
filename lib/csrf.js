/**
 * Defensa ligera contra CSRF para rutas mutantes públicas.
 *
 * - Con header `Origin`: se compara hostname y puerto contra la URL de la
 *   petición (solo se admiten esquemas http/https).
 * - Sin `Origin` pero con `Sec-Fetch-Site: cross-site`: se rechaza.
 * - Sin ambos headers: se permite para no romper clientes no navegador
 *   (curl, scripts de servidor, webhooks, etc.).
 *
 * La función nunca lanza excepciones: ante datos de cabecera mal formados
 * devuelve `false` (fail closed).
 */
export function hasTrustedOrigin(request) {
  try {
    const headers = request?.headers;
    if (!headers || typeof headers.get !== "function") return false;

    const origin = headers.get("origin");
    if (origin) {
      let originUrl;
      let requestUrl;
      try {
        originUrl = new URL(origin);
        requestUrl = new URL(request.url);
      } catch {
        return false;
      }

      if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") return false;
      if (originUrl.hostname.toLowerCase() !== requestUrl.hostname.toLowerCase()) return false;
      return originUrl.port === requestUrl.port;
    }

    const fetchSite = headers.get("sec-fetch-site");
    if (fetchSite) return String(fetchSite).toLowerCase() !== "cross-site";

    return true;
  } catch {
    return false;
  }
}
