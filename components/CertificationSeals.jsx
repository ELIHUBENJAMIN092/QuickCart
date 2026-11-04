"use client";

import Image from "next/image";

// Los sellos viven sobre la primera diapositiva del hero. Se desvanecen al cambiar de página.
// En móvil se renderizan dentro del contenido para que no tapen los botones.
export default function CertificationSeals({ certifications = [], visible = true, inline = false, className = "" }) {
  if (!certifications.length) return null;

  const layout = inline
    ? "flex flex-nowrap items-end gap-x-3 gap-y-2"
    : "pointer-events-none absolute bottom-20 right-4 z-10 flex max-w-[70%] flex-wrap items-end justify-end gap-x-3 gap-y-2 transition-all duration-700 md:bottom-24 md:right-12 md:max-w-[560px] md:gap-x-6";
  const visibility = inline ? "" : visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0";

  return (
    <div className={`${layout} ${visibility} ${className}`} aria-hidden={!visible}>
      {certifications.map((certification) => {
        const height = Number(certification.height) || 104;
        return (
          <Image
            key={certification.id}
            src={certification.image_url}
            alt={certification.name}
            width={160}
            height={126}
            style={{ "--seal-height": `${height}px` }}
            className="certification-seal w-auto max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
          />
        );
      })}
    </div>
  );
}
