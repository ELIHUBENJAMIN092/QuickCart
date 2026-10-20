"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import { categories } from "@/lib/categories";
import { slideImage } from "@/lib/carousel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

function SlideEditor({ slide, onSaved }) {
  const { getToken, user } = useAppContext();
  const [form, setForm] = useState(slide);
  const [file, setFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const category = categories.find((item) => item.slug === slide.category);
  const preview = file ? URL.createObjectURL(file) : resetImage ? slideImage({ ...slide, image_url: "" }) : slideImage(form);

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
      const { data } = await axios.put(
        `/api/carousel/${slide.position}`,
        { ...form, imagePath, resetImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message);
      toast.success(`Diapositiva ${slide.position} guardada.`);
      setFile(null);
      setResetImage(false);
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-6 rounded-xl border border-brand-line bg-white p-5 shadow-sm lg:grid-cols-[320px_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">Diapositiva {slide.position} · {category?.name}</p>
        <div className="relative mt-3 aspect-video overflow-hidden rounded-lg bg-brand-sand">
          <Image src={preview} alt="" fill unoptimized={Boolean(file)} sizes="320px" className="object-cover" />
        </div>
        <label className="mt-3 block text-sm text-brand-charcoal">
          Imagen (se optimiza sola antes de subirla)
          <input type="file" accept="image/*" onChange={(event) => { setFile(event.target.files?.[0] || null); setResetImage(false); }} className="mt-2 block w-full text-xs" />
        </label>
        {(form.image_url || file) && (
          <button type="button" onClick={() => { setFile(null); setResetImage(true); }} className="mt-2 text-xs text-brand-accent hover:underline">Restaurar imagen original</button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-brand-charcoal">Texto 1 (etiqueta superior)<input required maxLength={80} value={form.eyebrow} onChange={update("eyebrow")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Texto 2 (título)<input required maxLength={140} value={form.title} onChange={update("title")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal md:col-span-2">Texto 3 (descripción)<textarea required rows={3} maxLength={300} value={form.description} onChange={update("description")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Botón principal (lleva a {category?.name})<input required maxLength={40} value={form.primary_label} onChange={update("primary_label")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Botón secundario (lleva a Contacto)<input required maxLength={40} value={form.secondary_label} onChange={update("secondary_label")} className={inputClass} /></label>
        <div className="md:col-span-2">
          <button disabled={saving} className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar diapositiva"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function CarouselAdmin() {
  const [slides, setSlides] = useState(null);

  const load = useCallback(async () => {
    const { data } = await axios.get("/api/carousel");
    setSlides(data.slides);
  }, []);

  useEffect(() => { load().catch(() => toast.error("No se pudo cargar el carrusel.")); }, [load]);

  return (
    <div className="w-full flex-1 bg-brand-sand/40 p-5 md:p-8">
      <h1 className="font-display text-3xl text-brand-ink">Carrusel de inicio</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-muted">
        Cuatro diapositivas, una por categoría principal y en el mismo orden del catálogo. Edita la imagen, los tres textos y los botones.
      </p>
      <div className="mt-6 space-y-6">
        {slides ? slides.map((slide) => <SlideEditor key={`${slide.position}-${slide.updated_at}`} slide={slide} onSaved={load} />) : <p className="text-sm text-brand-muted">Cargando...</p>}
      </div>
    </div>
  );
}
