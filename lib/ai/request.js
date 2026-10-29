/**
 * Clave estable para rate limiting: usuario autenticado o IP de origen.
 */
export function getClientKey(request, user) {
  if (user?.id) return `user:${user.id}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `ip:${ip}`;
}
