"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_OPEN_EVENT,
  defaultConsent,
  readConsent,
  saveConsent,
} from "@/lib/cookieConsent";

const SHORT_DESCRIPTIONS = {
  necessary: "Inicio de sesión, carrito y seguridad.",
  analytics: "Medición de visitas y uso de la tienda.",
  marketing: "Publicidad personalizada y campañas.",
};

function ConsentSwitch({ label, checked, disabled = false, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition ${
        checked ? "border-brand-accent bg-brand-accent" : "border-brand-line bg-brand-sand"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("notice");
  const [hasDecision, setHasDecision] = useState(false);
  const [draft, setDraft] = useState(defaultConsent);
  const headingRef = useRef(null);

  useEffect(() => {
    const stored = readConsent();
    setDraft(stored ? { necessary: true, analytics: stored.analytics, marketing: stored.marketing } : defaultConsent());
    setHasDecision(Boolean(stored));
    setIsOpen(!stored);
    setReady(true);
  }, []);

  const openPreferences = useCallback(() => {
    const stored = readConsent();
    setDraft(stored ? { necessary: true, analytics: stored.analytics, marketing: stored.marketing } : defaultConsent());
    setHasDecision(Boolean(stored));
    setView("preferences");
    setIsOpen(true);
    // Espera al render para mover el foco al panel recién abierto.
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }, []);

  useEffect(() => {
    const handler = () => openPreferences();
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handler);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handler);
  }, [openPreferences]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (!hasDecision) {
        // En la primera visita se debe elegir una opción; Escape solo vuelve
        // del panel de preferencias al aviso principal.
        if (view === "preferences") setView("notice");
        return;
      }

      setIsOpen(false);
      setView("notice");
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, view, hasDecision]);

  const decide = (consent) => {
    saveConsent(consent);
    setDraft(consent);
    setHasDecision(true);
    setIsOpen(false);
    setView("notice");
  };

  if (!ready || !isOpen) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[90] px-2 pb-2 sm:px-4 sm:pb-4"
    >
      <div className="relative mx-auto max-h-[calc(100dvh-1rem)] max-w-[1100px] overflow-y-auto border border-brand-line bg-white shadow-[0_10px_35px_rgba(11,13,18,0.16)]">
        {hasDecision && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setView("notice");
            }}
            aria-label="Cerrar preferencias de cookies"
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center border border-brand-line bg-white text-lg leading-none text-brand-muted transition hover:border-brand-ink hover:text-brand-ink"
          >
            ×
          </button>
        )}

        {view === "notice" ? (
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="max-w-2xl text-xs leading-5 text-brand-charcoal">
              Usamos cookies para el funcionamiento de la tienda, analítica y marketing. Las necesarias siempre
              están activas.{" "}
              <Link
                href="/politica-de-cookies"
                className="font-semibold text-brand-accent underline underline-offset-2 hover:text-brand-ink"
              >
                Política de cookies
              </Link>
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setView("preferences")}
                className="px-1 py-2 text-[11px] font-semibold text-brand-muted underline underline-offset-2 transition hover:text-brand-ink"
              >
                Personalizar
              </button>
              <button
                type="button"
                onClick={() => decide(defaultConsent())}
                className="border border-brand-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink transition hover:border-brand-ink"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => decide({ necessary: true, analytics: true, marketing: true })}
                className="bg-brand-accent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-brand-ink"
              >
                Aceptar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
              Preferencias de cookies
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-display text-xl text-brand-ink outline-none"
            >
              Elige qué cookies aceptas
            </h2>

            <ul className="mt-4 divide-y divide-brand-line border-y border-brand-line">
              {COOKIE_CATEGORIES.map((category) => {
                const checked = category.required || draft[category.id] === true;
                return (
                  <li key={category.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-ink">{category.name}</h3>
                      <p className="mt-0.5 text-[11px] leading-5 text-brand-muted">{SHORT_DESCRIPTIONS[category.id]}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted sm:inline">
                        {checked ? "Activas" : "Inactivas"}
                      </span>
                      <ConsentSwitch
                        label={`Cookies ${category.name.toLowerCase()}`}
                        checked={checked}
                        disabled={category.required}
                        onChange={(next) => setDraft((current) => ({ ...current, [category.id]: next }))}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setView("notice")}
                className="mr-auto px-1 py-2 text-[11px] font-semibold text-brand-muted underline underline-offset-2 transition hover:text-brand-ink"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => decide(defaultConsent())}
                className="border border-brand-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink transition hover:border-brand-ink"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => decide(draft)}
                className="border border-brand-ink px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink transition hover:bg-brand-sand"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => decide({ necessary: true, analytics: true, marketing: true })}
                className="bg-brand-accent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-brand-ink"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
