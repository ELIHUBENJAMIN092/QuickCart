"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";

// Miniatura del inventario. La app sirve las imágenes directamente desde
// Supabase (ver `images.unoptimized` en next.config.mjs) para no depender del
// optimizador de Next, que falla en algunos hostings. Si la URL no responde,
// se muestra un icono en lugar de una imagen rota.
export default function ProductThumb({ src, sizes = "48px", className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="grid h-full w-full place-items-center text-brand-muted" aria-hidden="true">
        <Package size={18} strokeWidth={1.6} />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
