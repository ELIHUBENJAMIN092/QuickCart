"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { categories } from "@/lib/categories";
import { newSlide, slideImage } from "@/lib/carousel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

function SlideEditor({ slide, isNew = false, reordering, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onSaved, onCancel }) {
  const { getToken, user } = useAppContext();
  const [form, setForm] = useState(slide);
  const [file, setFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const category = categories.find((item) => item.slug === form.category);
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
      const payload = { ...form, imagePath, resetImage };
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = isNew
        ? await axios.post("/api/carousel", payload, { headers })
        : await axios.put(`/api/carousel/${slide.position}`, payload, { headers });
      if (!data.success) throw new Error(data.message);
      toast.success(isNew ? "Diapositiva creada." : `Diapositiva ${slide.position} guardada.`);
      setFile(null);
      setResetImage(false);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-6 rounded-xl border border-brand-line bg-white p-5 shadow-sm lg:grid-cols-[320px_1fr]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
            {isNew ? "Nueva diapositiva" : `Diapositiva ${slide.position}`} · {category?.name}
          </p>
          {!isNew && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={onMoveUp} disabled={!canMoveUp || reordering} aria-label="Subir diapositiva" className="rounded-lg border border-brand-line p-1.5 text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={onMoveDown} disabled={!canMoveDown || reordering} aria-label="Bajar diapositiva" className="rounded-lg border border-brand-line p-1.5 text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowDown size={15} />
              </button>
            </div>
          )}
        </div>
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
        <label className="text-sm text-brand-charcoal">Categoría del botón principal
          <select value={form.category} onChange={update("category")} className={inputClass}>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-brand-charcoal">Texto 1 (etiqueta superior)<input required maxLength={80} value={form.eyebrow} onChange={update("eyebrow")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal md:col-span-2">Texto 2 (título)<input required maxLength={140} value={form.title} onChange={update("title")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal md:col-span-2">Texto 3 (descripción)<textarea required rows={3} maxLength={300} value={form.description} onChange={update("description")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Botón principal (lleva a {category?.name})<input required maxLength={40} value={form.primary_label} onChange={update("primary_label")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Botón secundario (lleva a Contacto)<input required maxLength={40} value={form.secondary_label} onChange={update("secondary_label")} className={inputClass} /></label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button disabled={saving} className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">
            {saving ? "Guardando..." : isNew ? "Crear diapositiva" : "Guardar diapositiva"}
          </button>
          {isNew && (
            <button type="button" onClick={onCancel} className="rounded-full border border-brand-line px-6 py-3 text-sm text-brand-charcoal hover:bg-brand-cream">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
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
      <PageHeader
        eyebrow="Administración · Contenido"
        title="Carrusel de inicio"
        description="Edita la imagen, los textos y los botones de cada diapositiva. Puedes agregar nuevas y cambiar su orden con las flechas."
        actions={!adding ? (
          <button onClick={() => setAdding(true)} disabled={!slides} className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60">
            <Plus size={16} /> Agregar nueva diapositiva
          </button>
        ) : null}
      />
      <div className="mt-6 space-y-6">
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
        )) : <p className="text-sm text-brand-muted">Cargando...</p>}
      </div>
    </main>
  );
}
