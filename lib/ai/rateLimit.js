const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const MEMORY_LIMIT = 2000;

const buckets = new Map();

function checkMemory(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > MEMORY_LIMIT) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt, limit };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    limit,
  };
}

async function checkUpstash(key, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(Math.ceil(windowMs / 1000)), "NX"],
    ]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash respondió ${response.status}`);
  const data = await response.json();
  const count = Number(data?.[0]?.result || 1);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + windowMs,
    limit,
  };
}

/**
 * Límite por clave (usuario/IP) con ventana configurable.
 * Usa Upstash si está configurado; si no, memoria por instancia.
 */
export async function checkRateLimit(
  key,
  { limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS, prefix = "chat" } = {}
) {
  const bucketKey = `compel:${prefix}:${key || "anon"}`;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await checkUpstash(bucketKey, limit, windowMs);
    } catch (error) {
      console.error("Rate limit Upstash no disponible:", error.message);
      if (process.env.NODE_ENV === "production") {
        return { allowed: false, unavailable: true, resetAt: Date.now() + windowMs, limit };
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("Rate limit compartido no configurado en producción.");
    return { allowed: false, unavailable: true, resetAt: Date.now() + windowMs, limit };
  }

  return checkMemory(bucketKey, limit, windowMs);
}

export function resetRateLimit() {
  buckets.clear();
}
