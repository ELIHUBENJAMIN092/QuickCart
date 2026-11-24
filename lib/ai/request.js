import { getClientIp } from "@/lib/visits";

/**
 * Clave estable para rate limiting: usuario autenticado o IP de origen.
 */
export function getClientKey(request, user) {
  if (user?.id) return `user:${user.id}`;
  return `ip:${getClientIp(request) || "unknown"}`;
}
