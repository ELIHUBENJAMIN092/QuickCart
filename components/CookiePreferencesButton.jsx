"use client";

import { COOKIE_CONSENT_OPEN_EVENT } from "@/lib/cookieConsent";

export default function CookiePreferencesButton({ className = "", children }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))}
      className={className}
    >
      {children || "Configurar cookies"}
    </button>
  );
}
