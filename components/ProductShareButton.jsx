"use client";

import { useState } from "react";
import { Copy, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { buildProductShareText } from "@/lib/productShare";
import { siteUrl } from "@/lib/seo";

const MAX_IMAGE_SIDE = 1400;

function imageFileName(name) {
  const base = String(name || "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);

  return `${base || "producto"}.png`;
}

async function imageUrlToPngBlob(url) {
  const response = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-cache" });
  if (!response.ok) throw new Error("No se pudo descargar la imagen.");

  const blob = await response.blob();
  if (blob.type === "image/png" && blob.size <= 8_000_000) return blob;

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la imagen.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("No se pudo convertir la imagen."))),
      "image/png",
    );
  });
}

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error("No se pudo descargar la imagen.");

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return "downloaded";
  } catch {
    // Si el navegador bloquea la descarga directa, se abre la imagen original
    // para que el usuario pueda guardarla y adjuntarla.
    try {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return "opened";
    } catch {
      return "failed";
    }
  }
}

function copyTextFallback(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Se intenta el método clásico más abajo.
    }
  }
  return copyTextFallback(text);
}

function getShareUrl(product) {
  if (!product?._id) return "";
  // Usa la URL pública de producción (dominio canónico del sitio) en lugar de
  // window.location.origin, para que el enlace copiado siempre apunte al sitio
  // publicado y no a localhost durante el desarrollo.
  return `${siteUrl}/product/${product._id}`;
}

export default function ProductShareButton({ product, imageUrl = "", canShop = false, currency = "$", category = "" }) {
  const [busy, setBusy] = useState(false);

  const buildText = () =>
    buildProductShareText(product, {
      canShop,
      currency,
      category,
      url: getShareUrl(product),
    });

  // Copia solo el texto (nombre, categoría, descripción, características y
  // enlace). La imagen la maneja el botón de foto, para no descargarla aquí.
  const handleCopy = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const textCopied = await copyText(buildText());
      if (!textCopied) {
        toast.error("No se pudo copiar el texto. Revisa los permisos del navegador.");
        return;
      }

      toast.success("Descripción copiada. Pégala en WhatsApp.");
    } catch {
      toast.error("No se pudo copiar la descripción.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyImage = async () => {
    if (busy || !imageUrl) return;
    setBusy(true);

    try {
      const blob = await imageUrlToPngBlob(imageUrl);
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Portapapeles de imágenes no disponible.");
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Imagen copiada. Pégala en WhatsApp.");
    } catch {
      const result = await downloadImage(imageUrl, imageFileName(product?.name));
      if (result === "downloaded") {
        toast.success("Imagen descargada. Adjúntala en WhatsApp.");
      } else if (result === "opened") {
        toast.success("Abre o descarga la imagen para adjuntarla.");
      } else {
        toast.error("No se pudo copiar ni descargar la imagen.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={busy}
        className="inline-flex min-h-10 items-center justify-center gap-2 border border-brand-ink bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink transition hover:bg-brand-ink hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
        {busy ? "Copiando…" : "Descripción"}
      </button>

      {imageUrl && (
        <button
          type="button"
          onClick={handleCopyImage}
          disabled={busy}
          aria-label="Copiar solo imagen"
          title="Copiar solo imagen"
          className="grid h-10 w-10 place-items-center border border-brand-line text-brand-ink transition hover:border-brand-ink disabled:cursor-wait disabled:opacity-60"
        >
          <ImageIcon size={16} />
        </button>
      )}

      <span className="text-[11px] leading-5 text-brand-muted">
        Descripción y foto para pegar en WhatsApp.
      </span>
    </div>
  );
}
