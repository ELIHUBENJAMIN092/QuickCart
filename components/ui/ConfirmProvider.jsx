"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve;
    setDialog(options);
  }), []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (event) => { if (event.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, close]);

  const danger = dialog?.tone !== "default";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => close(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md border border-brand-line bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className={`flex h-12 w-12 items-center justify-center ${danger ? "bg-red-100 text-red-600" : "bg-brand-accent-soft text-brand-accent"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {danger ? <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5M14 11v5" /> : <path d="M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />}
              </svg>
            </div>
            <h2 id="confirm-title" className="mt-4 font-display text-xl text-brand-ink">{dialog.title || "¿Confirmar acción?"}</h2>
            {dialog.message && <p className="mt-2 text-sm text-brand-muted">{dialog.message}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" autoFocus onClick={() => close(false)} className="border border-brand-line px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink transition hover:bg-brand-sand">
                {dialog.cancelText || "Cancelar"}
              </button>
              <button type="button" onClick={() => close(true)} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition ${danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-ink hover:bg-brand-accent"}`}>
                {dialog.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
