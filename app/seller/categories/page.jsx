"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowRight, Film, Image as ImageIcon, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import PageHeader from "@/components/seller/PageHeader";
import { categories, parseSubcategories, subcategoriesToText } from "@/lib/categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

function CategoryEditor({ category, position, isNew = false, onSaved, onCancel }) {
  const { getToken, user } = useAppContext();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    position: position,
    subs: subcategoriesToText(category?.subcategories),
    hero: {
      eyebrow: category?.hero?.eyebrow || "",
      title: category?.hero?.title || "",
      description: category?.hero?.description || "",
      image_url: category?.hero?.image_url || "",
      video_url: category?.hero?.video_url || "",
      primary_label: category?.hero?.primary_label || "",
      primary_url: category?.hero?.primary_url || "",
      secondary_label: category?.hero?.secondary_label || "",
      secondary_url: category?.hero?.secondary_url || "",
    },
  });
  const [file, setFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [resetHeroImage, setResetHeroImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverType, setCoverType] = useState(category?.hero?.video_url ? "video" : "image");
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const heroImagePreview = useMemo(() => (heroImageFile ? URL.createObjectURL(heroImageFile) : ""), [heroImageFile]);
  const videoPreview = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : ""), [videoFile]);
  const currentImage = resetImage ? category?.image : category?.image_url || category?.image;
  const categoryImage = filePreview || currentImage;
  const preview = categoryImage;
  const heroImage = heroImagePreview || (!resetHeroImage && form.hero.image_url) || categoryImage;
  const hasCustomHeroImage = Boolean(heroImagePreview || (!resetHeroImage && form.hero.image_url));
  const heroVideo = videoPreview || form.hero.video_url;
  const usesVideo = coverType === "video";

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);
  useEffect(() => () => { if (heroImagePreview) URL.revokeObjectURL(heroImagePreview); }, [heroImagePreview]);
  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview); }, [videoPreview]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateHero = (field) => (event) => setForm((current) => ({
    ...current,
    hero: { ...current.hero, [field]: event.target.value },
  }));
  const clearVideo = () => {
    setVideoFile(null);
    setCoverType("image");
    setForm((current) => ({ ...current, hero: { ...current.hero, video_url: "" } }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (file && !file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido.");
      return;
    }
    if (heroImageFile && !heroImageFile.type.startsWith("image/")) {
      toast.error("Selecciona una imagen de portada válida.");
      return;
    }
    if (!usesVideo && !heroImage) {
      toast.error("Sube una imagen para la portada o elige «Con video».");
      return;
    }
    if (usesVideo && !form.hero.video_url && !videoFile) {
      toast.error("Sube un video o elige «Solo imagen».");
      return;
    }
    if (usesVideo && videoFile && (!videoFile.type.startsWith("video/") || videoFile.size > 100 * 1024 * 1024)) {
      toast.error("El video debe ser válido y pesar máximo 100 MB.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const optimized = file ? await optimizeImage(file, { maxSide: 1600 }) : null;
      const optimizedHero = !usesVideo && heroImageFile ? await optimizeImage(heroImageFile, { maxSide: 2000 }) : null;
      if ((optimized && optimized.size > 8 * 1024 * 1024) || (optimizedHero && optimizedHero.size > 8 * 1024 * 1024)) {
        toast.error("La imagen pesa más de 8 MB. Usa una más pequeña.");
        return;
      }
      const imagePath = optimized ? await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "categories") : "";
      const heroImagePath = optimizedHero ? await uploadProductFile(createSupabaseBrowserClient(), user.id, optimizedHero, "categories") : "";
      const videoPath = usesVideo && videoFile ? await uploadProductFile(createSupabaseBrowserClient(), user.id, videoFile, "categories") : "";
      const payload = {
        name: form.name,
        description: form.description,
        position: Number(form.position) || 0,
        subcategories: parseSubcategories(form.subs, category?.subcategories),
        hero: {
          ...form.hero,
          video_url: usesVideo ? form.hero.video_url : "",
          image_url: usesVideo ? form.hero.image_url : resetHeroImage ? "" : form.hero.image_url,
        },
        imagePath,
        heroImagePath,
        videoPath,
        resetImage,
        resetHeroImage: !usesVideo && resetHeroImage,
      };
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = isNew
        ? await axios.post("/api/categories", payload, { headers })
        : await axios.put(`/api/categories/${category.slug}`, payload, { headers });
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setFile(null);
      setHeroImageFile(null);
      setVideoFile(null);
      setResetImage(false);
      setResetHeroImage(false);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const accepted = await confirm({
      title: "¿Eliminar esta categoría?",
      message: `Se eliminará «${category.name}» con sus subcategorías. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/categories/${category.slug}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo eliminar.");
    }
  };

  return (
    <form onSubmit={save} className="grid gap-6 rounded-xl border border-brand-line bg-white p-5 md:grid-cols-[260px_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-line bg-brand-sand">
          {preview ? <Image src={preview} alt="" fill unoptimized={Boolean(filePreview)} sizes="260px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-brand-muted">Sin imagen</span>}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand-line px-3 py-2.5 text-xs font-medium text-brand-accent hover:border-brand-accent">
          <ImagePlus size={16} /> {file ? file.name : "Imagen de categoría"}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setResetImage(false); }} />
        </label>
        {!isNew && category?.image_url && !file && !resetImage && (
          <button type="button" onClick={() => setResetImage(true)} className="mt-2 block w-full text-center text-xs text-brand-sale hover:underline">Quitar imagen personalizada</button>
        )}
        <p className="mt-2 text-[11px] leading-4 text-brand-muted">
          {usesVideo ? "Se usa como póster del video y lámina de categoría." : "Se usa como lámina de categoría y respaldo de la portada."} Horizontal, máximo 8 MB.
        </p>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
          <label className="block text-xs font-medium text-brand-charcoal">Título
            <input required maxLength={60} value={form.name} onChange={update("name")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Orden
            <input type="number" min="0" value={form.position} onChange={update("position")} className={inputClass} />
          </label>
        </div>
        <label className="block text-xs font-medium text-brand-charcoal">Descripción (subtítulo)
          <textarea rows={2} maxLength={200} value={form.description} onChange={update("description")} className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-brand-charcoal">Subcategorías <span className="font-normal text-brand-muted">(una por línea; escribe «- » antes para que sea hija de la de arriba)</span>
          <textarea rows={7} value={form.subs} onChange={update("subs")} placeholder={"Impresoras\nSuministros\n- Etiquetas\n- Cintas"} className={`${inputClass} font-mono`} />
        </label>

        <details className="rounded-xl border border-brand-line bg-brand-sand/30 p-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-ink">
              {usesVideo ? <Film size={15} className="text-brand-accent" /> : <ImageIcon size={15} className="text-brand-accent" />} Portada de categoría
            </span>
            <span className="text-[11px] text-brand-muted">{usesVideo ? (form.hero.video_url || videoFile ? "Video configurado" : "Falta video") : "Solo imagen"}</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-brand-line bg-white p-1">
                <button type="button" onClick={() => setCoverType("image")} aria-pressed={!usesVideo} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${!usesVideo ? "bg-brand-accent text-white" : "text-brand-muted hover:text-brand-ink"}`}>
                  <ImageIcon size={14} /> Solo imagen
                </button>
                <button type="button" onClick={() => setCoverType("video")} aria-pressed={usesVideo} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${usesVideo ? "bg-brand-accent text-white" : "text-brand-muted hover:text-brand-ink"}`}>
                  <Film size={14} /> Con video
                </button>
              </div>
              <span className="text-[11px] text-brand-muted">{usesVideo ? "Se reproduce automáticamente, sin sonido." : "Sube una portada propia o usa la imagen de categoría."}</span>
            </div>

            {usesVideo ? (
              <>
                <div className="overflow-hidden rounded-xl bg-brand-ink">
                  {heroVideo ? (
                    <video key={heroVideo} src={heroVideo} controls muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center text-xs text-white/70">Sin video de portada</div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-brand-charcoal">URL del video
                    <input value={form.hero.video_url} onChange={updateHero("video_url")} maxLength={500} placeholder="/videos/categoria.mp4" className={inputClass} />
                  </label>
                  <label className="flex cursor-pointer flex-col justify-center rounded-lg border border-dashed border-brand-line px-4 py-3 text-xs text-brand-charcoal transition hover:border-brand-accent">
                    <span className="inline-flex items-center gap-2 font-medium text-brand-accent"><Upload size={15} /> {videoFile ? "Cambiar video" : "Subir video"}</span>
                    <span className="mt-1 truncate text-[11px] text-brand-muted">{videoFile ? videoFile.name : "MP4 / WebM, máximo 100 MB"}</span>
                    <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-brand-line bg-brand-sand">
                  {heroImage ? (
                    <div className="relative aspect-video">
                      <Image src={heroImage} alt="" fill unoptimized={Boolean(heroImagePreview)} sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="grid aspect-video place-items-center text-xs text-brand-muted">Sin imagen de portada</div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer flex-col justify-center rounded-lg border border-dashed border-brand-line px-4 py-3 text-xs text-brand-charcoal transition hover:border-brand-accent">
                    <span className="inline-flex items-center gap-2 font-medium text-brand-accent"><ImagePlus size={15} /> {heroImageFile ? "Cambiar imagen de portada" : "Subir imagen de portada"}</span>
                    <span className="mt-1 truncate text-[11px] text-brand-muted">{heroImageFile ? heroImageFile.name : "Horizontal, ideal 16:9, máximo 8 MB"}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setHeroImageFile(event.target.files?.[0] || null); setResetHeroImage(false); }} />
                  </label>
                  <div className="flex flex-col justify-center gap-1.5 text-[11px] leading-4 text-brand-muted">
                    {hasCustomHeroImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setHeroImageFile(null);
                          setResetHeroImage(true);
                          setForm((current) => ({ ...current, hero: { ...current.hero, image_url: "" } }));
                        }}
                        className="self-start text-xs text-brand-sale hover:underline"
                      >
                        Usar imagen de categoría
                      </button>
                    )}
                    <p>Si no subes una imagen de portada, se usará la imagen de categoría.</p>
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-brand-charcoal">Etiqueta superior
                <input value={form.hero.eyebrow} onChange={updateHero("eyebrow")} maxLength={80} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-brand-charcoal sm:col-span-2">Título de portada
                <input value={form.hero.title} onChange={updateHero("title")} maxLength={140} className={inputClass} />
                <span className="mt-1 block text-[10px] font-normal text-brand-muted">Usa «|» para separar la línea azul.</span>
              </label>
              <label className="block text-xs font-medium text-brand-charcoal sm:col-span-2">Descripción de portada
                <textarea rows={3} maxLength={400} value={form.hero.description} onChange={updateHero("description")} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-brand-charcoal">Botón principal
                <input value={form.hero.primary_label} onChange={updateHero("primary_label")} maxLength={40} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-brand-charcoal">Enlace principal
                <input value={form.hero.primary_url} onChange={updateHero("primary_url")} maxLength={300} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-brand-charcoal">Botón secundario
                <input value={form.hero.secondary_label} onChange={updateHero("secondary_label")} maxLength={40} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-brand-charcoal">Enlace secundario
                <input value={form.hero.secondary_url} onChange={updateHero("secondary_url")} maxLength={300} className={inputClass} />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {category?.slug === "kioscos-y-pos" && !isNew ? (
                <Link href="/seller/kioscos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline">
                  Editar landing completa <ArrowRight size={13} />
                </Link>
              ) : <span />}
              {usesVideo && (form.hero.video_url || videoFile) && (
                <button type="button" onClick={clearVideo} className="text-xs text-brand-sale hover:underline">Quitar video</button>
              )}
            </div>
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {isNew ? <span /> : (
            <button type="button" onClick={remove} className="inline-flex items-center gap-2 text-xs text-brand-sale hover:underline"><Trash2 size={14} /> Eliminar categoría</button>
          )}
          <div className="flex gap-3">
            {isNew && <button type="button" onClick={onCancel} className="rounded-full border border-brand-line px-5 py-2.5 text-sm text-brand-charcoal hover:bg-brand-cream">Cancelar</button>}
            <button type="submit" disabled={saving} className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60">{saving ? "Guardando..." : isNew ? "Crear categoría" : "Guardar cambios"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function CategoriesAdmin() {
  const { fetchCategories } = useAppContext();
  const [adding, setAdding] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const reload = async () => {
    await fetchCategories();
    setAdding(false);
    setRefresh((value) => value + 1);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Administración · Catálogo"
          title="Categorías"
          description="Estas categorías aparecen en el inicio, el menú, el pie de página y al crear productos. Cada una puede usar portada con video o solo con imagen."
          actions={!adding ? (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-hover"><Plus size={16} /> Nueva categoría</button>
          ) : null}
        />

        <div className="mt-8 space-y-6" key={refresh}>
          {adding && <CategoryEditor isNew position={categories.length + 1} onSaved={reload} onCancel={() => setAdding(false)} />}
          {categories.map((category, index) => (
            <CategoryEditor key={`${category.slug}-${refresh}`} category={category} position={index + 1} onSaved={reload} />
          ))}
        </div>
      </div>
    </main>
  );
}
