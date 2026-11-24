import { isValidIp } from "./visits";

const CACHE_TTL_SECONDS = 30;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const MAX_MEMORY_ENTRIES = 5000;

// Solo se usa en desarrollo; en producción la caché es Redis compartida.
const memoryCache = new Map();

const cacheKey = (ip) => `compel:blocked-ip:${ip}`;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisRequest(url, token, path) {
  const response = await fetch(`${url}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash respondió ${response.status}`);
  return response.json();
}

async function readRedisCache(config, key) {
  const data = await redisRequest(config.url, config.token, `/get/${encodeURIComponent(key)}`);
  const value = data?.result;
  return value === "1" ? true : value === "0" ? false : null;
}

async function writeRedisCache(config, key, blocked) {
  await redisRequest(
    config.url,
    config.token,
    `/set/${encodeURIComponent(key)}/${blocked ? "1" : "0"}/EX/${CACHE_TTL_SECONDS}`
  );
}

async function deleteRedisCache(config, key) {
  await redisRequest(config.url, config.token, `/del/${encodeURIComponent(key)}`);
}

function readMemoryCache(ip) {
  const cached = memoryCache.get(ip);
  if (!cached) return null;
  if (Date.now() - cached.at >= CACHE_TTL_MS) {
    memoryCache.delete(ip);
    return null;
  }
  return cached.blocked;
}

function writeMemoryCache(ip, blocked) {
  if (memoryCache.size > MAX_MEMORY_ENTRIES) memoryCache.clear();
  memoryCache.set(ip, { blocked, at: Date.now() });
}

async function querySupabase(ip) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/is_ip_blocked`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_ip: ip }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    return (await response.json()) === true;
  } catch {
    // Fail-open deliberado: si no se puede consultar, no se bloquea a nadie.
    return false;
  }
}

/**
 * Comprueba si una IP está bloqueada. La caché es Redis compartida para que
 * un bloqueo/desbloqueo se aplique a todas las instancias en menos de 30 s.
 */
export async function isIpBlocked(ip) {
  if (!ip || !isValidIp(ip)) return false;
  const config = redisConfig();

  if (config) {
    try {
      const cached = await readRedisCache(config, cacheKey(ip));
      if (cached !== null) return cached;
      const blocked = await querySupabase(ip);
      try {
        await writeRedisCache(config, cacheKey(ip), blocked);
      } catch {
        // La respuesta es igual de válida aunque no se pueda cachear.
      }
      return blocked;
    } catch {
      return querySupabase(ip);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const cached = readMemoryCache(ip);
    if (cached !== null) return cached;
    const blocked = await querySupabase(ip);
    writeMemoryCache(ip, blocked);
    return blocked;
  }

  // Sin Redis en producción, consultar siempre: evita cachés obsoletas por instancia.
  return querySupabase(ip);
}

/** Invalida la caché al bloquear o desbloquear una IP desde el panel. */
export async function invalidateBlockedIpCache(ip) {
  if (!ip) return;
  memoryCache.delete(ip);
  const config = redisConfig();
  if (!config) return;
  try {
    await deleteRedisCache(config, cacheKey(ip));
  } catch {
    // La entry caduca sola en 30 s.
  }
}
