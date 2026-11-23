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

  // Abre la ventana apenas carga la página, sin retraso, en todos los
  // dispositivos. En móvil la música se activa con el primer toque (los
  // navegadores bloquean el autoplay de audio sin interacción).
  useEffect(() => {
    if (!popup?.enabled) return undefined;
    if (window.sessionStorage.getItem(STORAGE_KEY)) return undefined;
    queueMicrotask(() => setOpen(true));
    return undefined;
  }, [popup?.enabled, popup?.updated_at]);

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

  // Intenta reproducir con sonido apenas se abre la ventana. Si el navegador
  // bloquea el autoplay, el audio arranca en silencio y el primer toque en la
  // página activa el volumen (los navegadores no permiten sonido sin gesto).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = clampVolume(popup?.audio_volume) / 100;

    if (open && audioEnabled) {
      if (audio.paused) {
        audio.currentTime = 0;
        audio.muted = false;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            // Autoplay con sonido bloqueado: arranca en silencio para que el
            // primer toque solo tenga que activar el volumen.
            audio.muted = true;
            audio.play().catch(() => {});
          });
        }
      }
    } else {
      audio.pause();
    }

    return () => audio.pause();
  }, [open, audioEnabled, popup?.audio_url, popup?.audio_volume]);

  // Activa el sonido con el primer toque cuando el navegador bloqueó el
  // autoplay. Escucha todos los gestos habituales mientras la ventana siga
  // abierta, para reintentar si el primero no fue válido.
  useEffect(() => {
    if (!open || !audioEnabled || !hasAudio) return undefined;

    const enableSound = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.muted) {
        audio.muted = false;
        audio.currentTime = 0;
      }
      if (audio.paused) audio.play().catch(() => {});
    };

    const events = ["pointerdown", "keydown", "touchstart", "touchend", "click"];
    events.forEach((event) => window.addEventListener(event, enableSound, true));
    return () => {
      events.forEach((event) => window.removeEventListener(event, enableSound, true));
    };
  }, [open, audioEnabled, hasAudio]);

  const image = popupImage(popup);
  const hasText = Boolean(popup.title || popup.message);

  return (
    <>
      {open && popup?.enabled && hasAudio && (
        <audio ref={audioRef} src={popup.audio_url} loop autoPlay preload="auto" />
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
