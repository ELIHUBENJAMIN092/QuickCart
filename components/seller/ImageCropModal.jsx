"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crop, Loader2, RotateCcw, X } from "lucide-react";
import { cropImageToFile, formatAspect } from "@/lib/imageCrop";

const STEP = 0.06;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function ImageCropModal({
  file,
  aspect = 16 / 9,
  title = "Encuadrar imagen",
  description = "Arrastra la imagen o usa las flechas para colocarla dentro del marco discontinuo.",
  onApply,
  onClose,
}) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [applying, setApplying] = useState(false);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!file) return undefined;
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const element = new window.Image();
    element.onload = () => {
      if (cancelled) { URL.revokeObjectURL(url); return; }
      setImage({ url, width: element.naturalWidth, height: element.naturalHeight });
      setPosition({ x: 0.5, y: 0.5 });
      setError("");
    };
    element.onerror = () => {
      if (cancelled) return;
      setError("No se pudo leer la imagen. Prueba con otro archivo.");
      URL.revokeObjectURL(url);
    };
    element.src = url;
    return () => { cancelled = true; URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    if (!image) return undefined;
    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const maxWidth = container.clientWidth;
      const maxHeight = Math.min(window.innerHeight * 0.5, 480);
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      setBox({
        width: Math.max(1, Math.round(image.width * scale)),
        height: Math.max(1, Math.round(image.height * scale)),
      });
    };
    update();
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [image]);

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  const crop = useMemo(() => {
    if (!box.width || !box.height) return { width: 0, height: 0, x: 0, y: 0, maxX: 0, maxY: 0 };
    const boxAspect = box.width / box.height;
    let width;
    let height;
    if (boxAspect > aspect) {
      height = box.height;
      width = height * aspect;
    } else {
      width = box.width;
      height = width / aspect;
    }
    const maxX = Math.max(0, box.width - width);
    const maxY = Math.max(0, box.height - height);
    return { width, height, x: maxX * position.x, y: maxY * position.y, maxX, maxY };
  }, [box, aspect, position]);

  const move = useCallback((dx, dy) => {
    setPosition((current) => ({
      x: clamp(current.x + dx, 0, 1),
      y: clamp(current.y + dy, 0, 1),
    }));
  }, []);

  const startDrag = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!crop.maxX && !crop.maxY) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: position };
  };

  const onDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = crop.maxX ? (event.clientX - drag.startX) / crop.maxX : 0;
    const dy = crop.maxY ? (event.clientY - drag.startY) / crop.maxY : 0;
    setPosition({
      x: clamp(drag.origin.x + dx, 0, 1),
      y: clamp(drag.origin.y + dy, 0, 1),
    });
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const apply = async () => {
    if (!image || !box.width) return;
    setApplying(true);
    try {
      const scaleX = image.width / box.width;
      const scaleY = image.height / box.height;
      const cropped = await cropImageToFile(file, {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      });
      await onApply(cropped);
    } finally {
      setApplying(false);
    }
  };

  const ratioLabel = formatAspect(aspect);
  const needsCrop = image ? Math.abs(image.width / image.height - aspect) / aspect > 0.02 : false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-brand-line px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">Encuadre · {ratioLabel}</p>
            <h2 id="image-crop-title" className="mt-0.5 truncate text-sm font-semibold text-brand-ink sm:text-base">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-muted transition hover:bg-brand-sand hover:text-brand-ink"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error ? (
            <p className="rounded-xl border border-brand-line bg-brand-sand px-4 py-6 text-center text-sm text-brand-muted">{error}</p>
          ) : !image ? (
            <div className="grid h-56 place-items-center text-brand-muted"><Loader2 size={22} className="animate-spin" /></div>
          ) : (
            <>
              <div ref={containerRef} className="flex w-full justify-center">
                <div
                  className={`relative touch-none select-none overflow-hidden rounded-xl bg-brand-ink ${crop.maxX || crop.maxY ? "cursor-move" : "cursor-default"}`}
                  style={{ width: box.width, height: box.height }}
                  onPointerDown={startDrag}
                  onPointerMove={onDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    unoptimized
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="pointer-events-none object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_1px_rgba(15,23,42,0.45),0_0_0_9999px_rgba(15,23,42,0.55)]"
                    style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
                  >
                    <span className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <span key={index} className="border border-white/15" />
                      ))}
                    </span>
                    <span className="absolute left-2 top-2 rounded bg-brand-ink/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">{ratioLabel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <span />
                  <button type="button" onClick={() => move(0, -STEP)} aria-label="Mover arriba" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-brand-ink transition hover:bg-brand-sand active:bg-brand-accent-soft">
                    <ArrowUp size={16} />
                  </button>
                  <span />
                  <button type="button" onClick={() => move(-STEP, 0)} aria-label="Mover a la izquierda" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-brand-ink transition hover:bg-brand-sand active:bg-brand-accent-soft">
                    <ArrowLeft size={16} />
                  </button>
                  <button type="button" onClick={() => setPosition({ x: 0.5, y: 0.5 })} aria-label="Centrar imagen" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-brand-muted transition hover:bg-brand-sand hover:text-brand-ink">
                    <RotateCcw size={15} />
                  </button>
                  <button type="button" onClick={() => move(STEP, 0)} aria-label="Mover a la derecha" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-brand-ink transition hover:bg-brand-sand active:bg-brand-accent-soft">
                    <ArrowRight size={16} />
                  </button>
                  <span />
                  <button type="button" onClick={() => move(0, STEP)} aria-label="Mover abajo" className="grid h-10 w-10 place-items-center rounded-lg border border-brand-line text-brand-ink transition hover:bg-brand-sand active:bg-brand-accent-soft">
                    <ArrowDown size={16} />
                  </button>
                  <span />
                </div>
                <p className="max-w-md text-center text-[11px] leading-4 text-brand-muted">{description}</p>
                <p className="text-center text-[11px] text-brand-muted">
                  Imagen original: <span className="font-medium text-brand-charcoal">{image.width} × {image.height} px</span>
                  {needsCrop ? ` · se ajustará a ${ratioLabel}` : " · ya tiene el formato esperado"}
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-brand-line px-4 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-5 py-2.5 text-sm font-medium text-brand-charcoal transition hover:bg-brand-sand"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={applying || !image || !box.width}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            {applying ? <Loader2 size={16} className="animate-spin" /> : <Crop size={16} />}
            {applying ? "Aplicando..." : "Aplicar encuadre"}
          </button>
        </footer>
      </div>
    </div>
  );
}
