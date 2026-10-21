"use client";

import { FileText } from "lucide-react";
import { isLabelPrinterSubcategory, printerTypes } from "@/lib/categories";

const inputClass =
  "w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent";

export const MAX_CATALOG_SIZE = 25 * 1024 * 1024;

export function validateCatalogFile(file) {
  return !file || (file.type === "application/pdf" && file.size <= MAX_CATALOG_SIZE);
}

export default function ProductExtraFields({
  category,
  subcategory,
  printerType,
  onPrinterType,
  model3dUrl,
  onModel3dUrl,
  catalogFile,
  onCatalogFile,
  currentCatalog = "",
  removeCatalog = false,
  onRemoveCatalog,
  specsText = "",
  onSpecsText,
}) {
  const showPrinterType = isLabelPrinterSubcategory(category, subcategory);

  return (
    <section className="space-y-5 border-t border-brand-line pt-6">
      <h2 className="text-sm font-semibold text-brand-ink">Catálogo y vista 3D</h2>

      {showPrinterType && (
        <label className="block max-w-sm space-y-2 text-xs font-medium text-brand-charcoal">
          Tipo de impresora
          <select required value={printerType} onChange={(event) => onPrinterType(event.target.value)} className={inputClass}>
            <option value="">Selecciona un tipo</option>
            {printerTypes.map((type) => <option key={type.slug} value={type.slug}>{type.name}</option>)}
          </select>
        </label>
      )}

      <label className="block space-y-2 text-xs font-medium text-brand-charcoal">
        <span>Características principales <span className="font-normal text-brand-muted">(una por línea, formato «Nombre: valor»)</span></span>
        <textarea rows={8} value={specsText} onChange={(event) => onSpecsText?.(event.target.value)} placeholder={"Tipo de impresión: Térmica directa\nAncho de impresión: 104 mm\nVelocidad: 152 mm/s\nPeso: 0,7 kg"} className={inputClass} />
      </label>

      <div className="space-y-2 text-xs font-medium text-brand-charcoal">
        <p>Catálogo del producto <span className="font-normal text-brand-muted">(PDF, opcional, máximo 25 MB)</span></p>
        {currentCatalog && !removeCatalog && (
          <p className="flex flex-wrap items-center gap-3 font-normal">
            <a href={currentCatalog} target="_blank" rel="noopener noreferrer" className="text-brand-accent underline">Ver catálogo actual</a>
            <button type="button" onClick={() => onRemoveCatalog?.(true)} className="text-brand-sale hover:underline">Quitar</button>
          </p>
        )}
        {removeCatalog && <button type="button" onClick={() => onRemoveCatalog?.(false)} className="font-normal text-brand-accent hover:underline">Deshacer quitar catálogo</button>}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-line p-4 text-sm font-normal text-brand-muted transition hover:border-brand-accent">
          <FileText size={20} className="text-brand-accent" />
          <span>{catalogFile ? catalogFile.name : currentCatalog ? "Reemplazar PDF" : "Seleccionar PDF"}</span>
          <input type="file" accept="application/pdf" className="sr-only" onChange={(event) => onCatalogFile(event.target.files?.[0] || null)} />
        </label>
      </div>

      <label className="block space-y-2 text-xs font-medium text-brand-charcoal">
        Enlace de vista 3D <span className="font-normal text-brand-muted">(opcional)</span>
        <input type="url" maxLength={500} placeholder="https://gecmedia.zebra.com/zq521/index.html" value={model3dUrl} onChange={(event) => onModel3dUrl(event.target.value)} className={inputClass} />
      </label>
    </section>
  );
}

export function ProductBadgeFields({ isOffer, isNew, onIsOffer, onIsNew }) {
  return (
    <section className="border-t border-brand-line pt-6">
      <h2 className="mb-3 text-sm font-semibold text-brand-ink">Etiquetas de la tarjeta</h2>
      <div className="flex flex-wrap gap-6 text-sm text-brand-charcoal">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={isOffer} onChange={(event) => onIsOffer(event.target.checked)} className="h-4 w-4 accent-[#1A3A5B]" />
          Marcar oferta
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={isNew} onChange={(event) => onIsNew(event.target.checked)} className="h-4 w-4 accent-[#1A3A5B]" />
          Marcar nuevo
        </label>
      </div>
    </section>
  );
}
