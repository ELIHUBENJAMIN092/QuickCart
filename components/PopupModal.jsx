"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
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
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);
  const soundToggleRef = useRef(null);
  const manuallyMutedRef = useRef(false);

  const hasAudio = Boolean(popup?.audio_url);
  const audioEnabled = Boolean(popup?.audio_enabled);

  const close = () => {
    setOpen(false);
    try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* sin almacenamiento */ }
  };

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.muted && !audio.paused) {
      manuallyMutedRef.current = true;
      audio.pause();
      return;
    }

    manuallyMutedRef.current = false;
    audio.muted = false;
    audio.play().catch(() => {});
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

  // Inicia la música automáticamente en cuanto el navegador está libre, sin
  // competir con la carga de la imagen principal. Si el autoplay con sonido
  // está bloqueado, arranca en silencio y el primer toque activa el volumen.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = clampVolume(popup?.audio_volume) / 100;

    if (!open || !audioEnabled) {
      audio.pause();
      return () => audio.pause();
    }

    let cancelled = false;
    let idleId;
    let timeoutId;

    const start = () => {
      if (cancelled || !audioRef.current || !audio.paused) return;
      audio.currentTime = 0;
      audio.muted = false;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (cancelled) return;
          audio.muted = true;
          audio.play().catch(() => {});
        });
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(start, 600);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      audio.pause();
    };
  }, [open, audioEnabled, popup?.audio_url, popup?.audio_volume]);

  // Mantiene el icono de audio sincronizado con el estado real del reproductor.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const sync = () => setSoundOn(!audio.muted && !audio.paused);
    audio.addEventListener("playing", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("volumechange", sync);
    return () => {
      audio.removeEventListener("playing", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("volumechange", sync);
    };
  }, [open, hasAudio]);

  // Activa el sonido con el primer toque cuando el navegador bloqueó el
  // autoplay. Escucha todos los gestos habituales mientras la ventana siga
  // abierta, para reintentar si el primero no fue válido.
  useEffect(() => {
    if (!open || !audioEnabled || !hasAudio) return undefined;

    const enableSound = (event) => {
      if (manuallyMutedRef.current) return;
      if (soundToggleRef.current?.contains(event?.target)) return;
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
        <audio ref={audioRef} src={popup.audio_url} loop preload="none" />
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
            {audioEnabled && hasAudio && (
              <button
                ref={soundToggleRef}
                type="button"
                onClick={toggleSound}
                aria-label={soundOn ? "Silenciar música" : "Activar música"}
                aria-pressed={soundOn}
                title={soundOn ? "Silenciar música" : "Activar música"}
                className={`absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full shadow-lg ring-1 ring-black/5 backdrop-blur transition sm:left-4 sm:top-4 sm:h-10 sm:w-10 ${
                  soundOn
                    ? "bg-white/85 text-brand-ink hover:bg-brand-ink hover:text-white"
                    : "bg-brand-accent text-white hover:bg-brand-ink"
                }`}
              >
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            )}

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
                  loading="eager"
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
