"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { clampVolume, popupImage } from "@/lib/popup";

const STORAGE_KEY = "quickcart_popup_dismissed";

function PopupButton({ href, className, children }) {
  if (!href) return null;
  return href.startsWith("/")
    ? <Link href={href} className={className}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

export default function PopupModal({ popup }) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef(null);

  const hasAudio = Boolean(popup?.audio_url);
  const audioEnabled = Boolean(popup?.audio_enabled);

  const close = () => {
    setOpen(false);
    try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* sin almacenamiento */ }
  };

  // Abre la ventana. En escritorio lo hace con un pequeño retraso; en móvil
  // espera el primer gesto del usuario para poder reproducir el audio (los
  // navegadores móviles bloquean el sonido sin interacción previa).
  useEffect(() => {
    if (!popup?.enabled) return undefined;
    if (window.sessionStorage.getItem(STORAGE_KEY)) return undefined;

    const isTouch =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const openPopup = () => {
      setOpen(true);
      const audio = audioRef.current;
      if (audio && audioEnabled) {
        audio.volume = clampVolume(popup?.audio_volume) / 100;
        audio.currentTime = 0;
        audio.play().catch(() => { /* no disponible */ });
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", openPopup);
      window.removeEventListener("touchstart", openPopup);
      window.removeEventListener("keydown", openPopup);
      window.removeEventListener("scroll", openPopup);
    };

    if (isTouch) {
      window.addEventListener("pointerdown", openPopup);
      window.addEventListener("touchstart", openPopup);
      window.addEventListener("scroll", openPopup);
      return cleanup;
    }

    queueMicrotask(() => setOpen(true));
    return undefined;
  }, [popup?.enabled, popup?.updated_at, audioEnabled, popup?.audio_volume]);

  // Bloquea el scroll de la página mientras la ventana está abierta.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Reproduce o silencia la música de fondo según el estado de la ventana.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = clampVolume(popup?.audio_volume) / 100;

    if (open && audioEnabled) {
      if (audio.paused) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => { /* autoplay bloqueado, se reintenta abajo */ });
        }
      }
    } else {
      audio.pause();
    }

    return () => audio.pause();
  }, [open, audioEnabled, popup?.audio_url, popup?.audio_volume]);

  // Si el navegador bloqueó el autoplay, reanuda con la primera interacción.
  useEffect(() => {
    if (!open || !audioEnabled || !hasAudio) return undefined;
    const audio = audioRef.current;
    if (!audio || !audio.paused) return undefined;

    const resume = () => {
      const current = audioRef.current;
      if (current && current.paused) current.play().catch(() => {});
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("touchstart", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    window.addEventListener("touchstart", resume);
    return cleanup;
  }, [open, audioEnabled, hasAudio]);

  const image = popupImage(popup);
  const hasText = Boolean(popup.title || popup.message);

  return (
    <>
      {hasAudio && (
        <audio ref={audioRef} src={popup.audio_url} loop preload="auto" />
      )}

      {open && popup?.enabled && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={popup.title || "Promoción"}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="animate-fade-in absolute inset-0 bg-brand-ink/70 backdrop-blur-sm"
          />

          <div className="animate-pop-in relative w-full max-w-4xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[1.75rem] bg-white shadow-2xl">
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar ventana"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-brand-ink shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-brand-ink hover:text-white sm:h-10 sm:w-10"
            >
              <X size={18} />
            </button>

            {image && (
              <div className="relative aspect-[4/3] w-full sm:aspect-video">
                <Image
                  src={image}
                  alt={popup.title || "Promoción"}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover"
                />
              </div>
            )}

            {hasText && (
              <div className="px-6 py-6 sm:px-10 sm:py-8">
                {popup.title && <h2 className="font-display text-2xl leading-tight text-brand-ink sm:text-3xl">{popup.title}</h2>}
                {popup.message && <p className="mt-2 text-sm leading-6 text-brand-muted sm:text-base">{popup.message}</p>}
                {popup.button_label && (
                  <PopupButton
                    href={popup.button_url}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover sm:w-auto"
                  >
                    {popup.button_label}
                  </PopupButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
