"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { categories } from "@/lib/categories";
import { newSlide, slideImage } from "@/lib/carousel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

function SlideEditor({ slide, isNew = false, reordering, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onSaved, onCancel }) {
  const { getToken, user } = useAppContext();
  const [form, setForm] = useState(slide);
  const [file, setFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(isNew);
  const category = categories.find((item) => item.slug === form.category);
  const preview = file ? URL.createObjectURL(file) : resetImage ? slideImage({ ...slide, image_url: "" }) : slideImage(form);
  const formId = `slide-form-${isNew ? "new" : slide.position}`;

  useEffect(() => {
    if (!file) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [file, preview]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    if (file && !file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const optimized = file ? await optimizeImage(file, { maxSide: 2400 }) : null;
      if (optimized && optimized.size > 8 * 1024 * 1024) {
        toast.error("La imagen sigue pesando más de 8 MB después de optimizarla. Usa una más pequeña.");
        return;
      }
      const imagePath = optimized ? await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "carousel") : "";
      const payload = { ...form, imagePath, resetImage };
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = isNew
        ? await axios.post("/api/carousel", payload, { headers })
        : await axios.put(`/api/carousel/${slide.position}`, payload, { headers });
      if (!data.success) throw new Error(data.message);
      toast.success(isNew ? "Diapositiva creada." : `Diapositiva ${slide.position} guardada.`);
      setFile(null);
      setResetImage(false);
      setOpen(false);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
      <div className="flex items-stretch gap-1 p-2 pl-3 sm:p-3 sm:pl-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={formId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-brand-sand/30"
        >
          <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-line bg-brand-sand">
            <Image src={preview} alt="" fill unoptimized={Boolean(file)} sizes="80px" className="object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="shrink-0 rounded-full bg-brand-accent-soft px-2 py-0.5 text-[10px] font-semibold text-brand-accent">
                {isNew ? "Nueva" : `#${slide.position}`}
              </span>
              <span className="truncate text-sm font-semibold text-brand-ink">{form.title || "Sin título"}</span>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-brand-muted">
              <span className="truncate">{category?.name || "Sin categoría"}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{form.eyebrow || "Sin etiqueta"}</span>
            </span>
          </span>
          <ChevronDown size={18} className={`shrink-0 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {!isNew && (
          <div className="flex shrink-0 flex-col justify-center gap-1 border-l border-brand-line pl-1 sm:flex-row sm:items-center sm:pl-2">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp || reordering}
              aria-label="Subir diapositiva"
              className="grid h-9 w-9 place-items-center rounded-lg border border-brand-line text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown || reordering}
              aria-label="Bajar diapositiva"
              className="grid h-9 w-9 place-items-center rounded-lg border border-brand-line text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              <ArrowDown size={15} />
            </button>
          </div>
        )}
      </div>

      <form id={formId} onSubmit={save} className={`grid gap-5 border-t border-brand-line p-4 sm:p-5 lg:grid-cols-[300px_1fr] lg:gap-6 ${open ? "" : "hidden"}`}>
        <div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-brand-line bg-brand-sand">
            <Image src={preview} alt="" fill unoptimized={Boolean(file)} sizes="(max-width: 1024px) 100vw, 300px" className="object-cover" />
          </div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line bg-brand-sand/30 px-3 py-2.5 text-xs font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent-soft/40">
            <ImagePlus size={16} /> <span className="min-w-0 truncate">{file ? file.name : "Cambiar imagen"}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setResetImage(false); }} />
          </label>
          <p className="mt-2 text-[11px] leading-4 text-brand-muted">Se optimiza sola antes de subirla. Máximo 8 MB.</p>
          {(form.image_url || file) && (
            <button type="button" onClick={() => { setFile(null); setResetImage(true); }} className="mt-1 block w-full text-center text-xs text-brand-accent hover:underline sm:text-left">Restaurar imagen original</button>
          )}
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="block text-xs font-medium text-brand-charcoal md:col-span-2">Categoría del botón principal
            <select value={form.category} onChange={update("category")} className={inputClass}>
              {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Texto 1 (etiqueta superior)
            <input required maxLength={80} value={form.eyebrow} onChange={update("eyebrow")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Texto 2 (título)
            <input required maxLength={140} value={form.title} onChange={update("title")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal md:col-span-2">Texto 3 (descripción)
            <textarea required rows={3} maxLength={300} value={form.description} onChange={update("description")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Botón principal <span className="font-normal text-brand-muted">(lleva a {category?.name})</span>
            <input required maxLength={40} value={form.primary_label} onChange={update("primary_label")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Botón secundario <span className="font-normal text-brand-muted">(lleva a Contacto)</span>
            <input required maxLength={40} value={form.secondary_label} onChange={update("secondary_label")} className={inputClass} />
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-brand-line pt-4 md:col-span-2 sm:flex-row sm:items-center sm:justify-end">
            {isNew && (
              <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-5 py-2.5 text-sm font-medium text-brand-charcoal transition hover:bg-brand-sand">
                Cancelar
              </button>
            )}
            <button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60">
              {saving ? "Guardando..." : isNew ? "Crear diapositiva" : "Guardar diapositiva"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CarouselAdmin() {
  const { getToken } = useAppContext();
  const [slides, setSlides] = useState(null);
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    const { data } = await axios.get("/api/carousel");
    setSlides(data.slides);
  }, []);

  useEffect(() => { load().catch(() => toast.error("No se pudo cargar el carrusel.")); }, [load]);

  const reload = async () => {
    await load();
    setAdding(false);
  };

  const move = async (index, step) => {
    const target = index + step;
    if (!slides || target < 0 || target >= slides.length) return;

    const order = slides.map((slide) => slide.position);
    [order[index], order[target]] = [order[target], order[index]];

    setReordering(true);
    try {
      const token = await getToken();
      const { data } = await axios.patch("/api/carousel", { order }, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo reordenar.");
    } finally {
      setReordering(false);
    }
  };

  const nextPosition = slides?.length ? Math.max(...slides.map((slide) => slide.position)) + 1 : 1;

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Carrusel de inicio"
          description="Edita la imagen, los textos y los botones de cada diapositiva. Puedes agregar nuevas y cambiar su orden con las flechas."
          actions={!adding ? (
            <button onClick={() => setAdding(true)} disabled={!slides} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              <Plus size={16} /> Nueva diapositiva
            </button>
          ) : null}
        />

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
              {slides ? `${slides.length} ${slides.length === 1 ? "diapositiva" : "diapositivas"}` : "Cargando"}
            </p>
            <p className="text-[11px] text-brand-muted">Toca una tarjeta para editar sus textos.</p>
          </div>

          <div className="mt-3 space-y-4">
            {adding && (
              <SlideEditor
                isNew
                slide={newSlide(nextPosition, categories[0]?.slug)}
                onSaved={reload}
                onCancel={() => setAdding(false)}
              />
            )}
            {slides ? slides.map((slide, index) => (
              <SlideEditor
                key={`${slide.position}-${slide.updated_at || ""}`}
                slide={slide}
                reordering={reordering}
                canMoveUp={index > 0}
                canMoveDown={index < slides.length - 1}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onSaved={load}
              />
            )) : <p className="rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted shadow-sm">Cargando diapositivas...</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
