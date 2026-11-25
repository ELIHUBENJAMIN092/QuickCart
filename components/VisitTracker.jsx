"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_CHANGE_EVENT, readConsent } from "@/lib/cookieConsent";

// Registra cada cambio de ruta en el backend. El servidor obtiene la IP real
// desde las cabeceras del proxy y decide si la dirección está bloqueada.
// Solo se ejecuta si el visitante aceptó las cookies analíticas.
export default function VisitTracker() {
  const pathname = usePathname();
  const tracked = useRef(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const apply = () => setAnalyticsAllowed(readConsent()?.analytics === true);
    apply();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, apply);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, apply);
  }, []);

  useEffect(() => {
    if (!analyticsAllowed) return;
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
  }, [pathname, analyticsAllowed]);

  return null;
}
