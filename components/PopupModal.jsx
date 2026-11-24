"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import { clampVolume, popupImage } from "@/lib/popup";

const STORAGE_KEY = "quickcart_popup_dismissed";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function PopupButton({ href, className, children }) {
  if (!href) return null;
  return href.startsWith("/")
    ? <Link href={href} className={className}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

export default function PopupModal({ popup }) {
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const hasAudio = Boolean(popup?.audio_url);
  const audioEnabled = Boolean(popup?.audio_enabled);

  const close = useCallback(() => {
    setOpen(false);
    try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* sin almacenamiento */ }
  }, []);

  // Se muestra en cuanto carga la página. Si ya fue descartado en esta sesión,
  // no vuelve a aparecer al navegar entre páginas.
  useEffect(() => {
    if (!popup?.enabled) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch { /* sin almacenamiento */ }
    setOpen(true);
  }, [popup?.enabled, popup?.updated_at]);

  // Respeta prefers-reduced-motion, también si cambia mientras la página está abierta.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  // Bloquea el scroll, guarda/devuelve el foco y atrapa Tab dentro del modal.
  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const getFocusable = () =>
      Array.from(dialog?.querySelectorAll(FOCUSABLE) || []).filter(
        (element) => element.getAttribute("aria-hidden") !== "true"
      );

    const frame = window.requestAnimationFrame(() => {
      const target = getFocusable()[0] || dialog;
      target?.focus();
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const items = getFocusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const previous = previousFocusRef.current;
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, close]);

  // Ajusta el volumen sin iniciar ninguna reproducción.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.volume = clampVolume(popup?.audio_volume) / 100;
    return () => audio.pause();
  }, [popup?.audio_url, popup?.audio_volume]);

  // Si el usuario prefiere movimiento reducido, detenemos el audio en curso.
  useEffect(() => {
    if (!reducedMotion) return undefined;
    const audio = audioRef.current;
    if (audio) audio.pause();
    setSoundOn(false);
    return undefined;
  }, [reducedMotion]);

  // Mantiene el icono sincronizado con el estado real del reproductor.
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

  // Único punto donde se reproduce audio: clic explícito en el botón del modal.
  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio || reducedMotion) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    audio.muted = false;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => setSoundOn(false));
    }
  };

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
            className={`absolute inset-0 bg-brand-ink/70 backdrop-blur-sm ${reducedMotion ? "" : "animate-fade-in"}`}
          />

          <div
            ref={dialogRef}
            tabIndex={-1}
            className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[1.75rem] bg-white shadow-2xl outline-none ${reducedMotion ? "" : "animate-pop-in"}`}
          >
            {audioEnabled && hasAudio && !reducedMotion && (
              <button
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
                {soundOn ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
              </button>
            )}

            <button
              type="button"
              onClick={close}
              aria-label="Cerrar ventana"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-brand-ink shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-brand-ink hover:text-white sm:h-10 sm:w-10"
            >
              <X size={18} aria-hidden="true" />
            </button>

            {image && (
              <div className="relative aspect-[4/3] w-full sm:aspect-video">
                <Image
                  src={image}
                  alt={popup.title || "Promoción"}
                  fill
                  loading="lazy"
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
