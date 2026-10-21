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
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {danger ? <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5M14 11v5" /> : <path d="M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />}
              </svg>
            </div>
            <h2 id="confirm-title" className="mt-4 font-display text-xl text-brand-ink">{dialog.title || "¿Confirmar acción?"}</h2>
            {dialog.message && <p className="mt-2 text-sm text-brand-muted">{dialog.message}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" autoFocus onClick={() => close(false)} className="rounded-lg border border-brand-line px-5 py-2.5 text-sm font-medium text-brand-ink transition hover:bg-gray-50">
                {dialog.cancelText || "Cancelar"}
              </button>
              <button type="button" onClick={() => close(true)} className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-ink hover:opacity-90"}`}>
                {dialog.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
