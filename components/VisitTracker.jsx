"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Registra cada cambio de ruta en el backend. El servidor obtiene la IP real
// desde las cabeceras del proxy y decide si la dirección está bloqueada.
export default function VisitTracker() {
  const pathname = usePathname();
  const tracked = useRef(false);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/seller") || pathname.startsWith("/api")) return;

    // Solo la primera página conserva el referrer externo; las navegaciones
    // internas se registran como visita directa.
    const referrer = tracked.current ? "" : document.referrer || "";
    tracked.current = true;

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    }).catch(() => {
      // El monitoreo nunca debe afectar la navegación del visitante.
    });
  }, [pathname]);

  return null;
}
