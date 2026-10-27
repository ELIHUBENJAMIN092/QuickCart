"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { ExternalLink, Film, RotateCcw, Upload } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { defaultKiosk } from "@/lib/kiosk";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent";
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export default function KioskAdmin() {
  const { getToken, user } = useAppContext();
  const [form, setForm] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const videoPreview = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : ""), [videoFile]);
  const currentVideo = videoPreview || form?.video_url || "";

  useEffect(() => {
    axios.get("/api/kiosk")
      .then(({ data }) => setForm(data.kiosk || defaultKiosk))
      .catch(() => {
        setForm(defaultKiosk);
        toast.error("No se pudo cargar la página de kioscos.");
      });
  }, []);

  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview); }, [videoPreview]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const updateHighlight = (index, field) => (event) => setForm((current) => ({
    ...current,
    highlights: current.highlights.map((item, i) => (i === index ? { ...item, [field]: event.target.value } : item)),
  }));

  const updateFeature = (index, field) => (event) => setForm((current) => ({
    ...current,
    features: current.features.map((item, i) => (i === index ? { ...item, [field]: event.target.value } : item)),
  }));

  const reset = () => {
    setVideoFile(null);
    setForm(defaultKiosk);
  };

  const save = async (event) => {
    event.preventDefault();
    if (videoFile && (!videoFile.type.startsWith("video/") || videoFile.size > MAX_VIDEO_SIZE)) {
      toast.error("El video debe ser válido y pesar máximo 100 MB.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token || !user) {
        toast.error("Inicia sesión como vendedor para guardar.");
        return;
      }
      const videoPath = videoFile
        ? await uploadProductFile(createSupabaseBrowserClient(), user.id, videoFile, "kiosks")
        : "";
      const { data } = await axios.put("/api/kiosk", { ...form, videoPath }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message);
      if (data.kiosk) setForm(data.kiosk);
      setVideoFile(null);
      toast.success(data.message || "Página de kioscos guardada.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="flex-1 p-8 text-sm text-brand-muted">Cargando...</div>;

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          className="mb-7"
          eyebrow="Administración · Contenido"
          title="Kioscos y punto de venta"
          description="Administra el video, los textos y las características de la página pública de autoservicio."
          actions={(
            <Link href="/kioscos-punto-de-venta" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent">
              <ExternalLink size={14} /> Ver página
            </Link>
          )}
        />

        <form onSubmit={save} className="space-y-6">
          <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-brand-ink">Video principal</h2>
                <p className="mt-1 text-xs text-brand-muted">Se muestra como fondo del encabezado. Máximo 100 MB.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-sand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                <Film size={12} /> MP4 / WebM
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl bg-brand-ink">
              {currentVideo ? (
                <video key={currentVideo} src={currentVideo} controls muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
              ) : (
                <div className="grid aspect-video w-full place-items-center text-xs text-white/70">Sin video configurado</div>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-brand-charcoal">URL del video
                <input value={form.video_url} onChange={update("video_url")} placeholder="/videos/kiosk-hero.mp4" className={inputClass} />
              </label>
              <label className="flex cursor-pointer flex-col justify-center rounded-lg border border-dashed border-brand-line px-4 py-3 text-sm text-brand-charcoal transition hover:border-brand-accent">
                <span className="inline-flex items-center gap-2 font-medium text-brand-accent"><Upload size={16} /> {videoFile ? "Cambiar video" : "Subir video"}</span>
                <span className="mt-1 truncate text-[11px] text-brand-muted">{videoFile ? videoFile.name : "Selecciona un archivo de tu equipo"}</span>
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold text-brand-ink">Encabezado</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-brand-charcoal">Etiqueta superior
                <input value={form.eyebrow} onChange={update("eyebrow")} maxLength={80} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal md:col-span-2">Título
                <input value={form.title} onChange={update("title")} maxLength={140} className={inputClass} />
                <span className="mt-1 block text-[10px] font-normal text-brand-muted">Usa «|» para separar la línea azul.</span>
              </label>
              <label className="text-sm text-brand-charcoal md:col-span-2">Descripción
                <textarea value={form.description} onChange={update("description")} maxLength={400} rows={3} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Botón principal
                <input value={form.primary_label} onChange={update("primary_label")} maxLength={40} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Enlace principal
                <input value={form.primary_url} onChange={update("primary_url")} maxLength={300} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Botón secundario
                <input value={form.secondary_label} onChange={update("secondary_label")} maxLength={40} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Enlace secundario
                <input value={form.secondary_url} onChange={update("secondary_url")} maxLength={300} className={inputClass} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold text-brand-ink">Indicadores</h2>
            <p className="mt-1 text-xs text-brand-muted">Tres datos breves que aparecen debajo del encabezado.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {form.highlights.map((highlight, index) => (
                <div key={index} className="rounded-xl border border-brand-line bg-brand-sand/40 p-4">
                  <label className="text-xs font-medium text-brand-charcoal">Valor
                    <input value={highlight.value} onChange={updateHighlight(index, "value")} maxLength={20} className={inputClass} />
                  </label>
                  <label className="mt-3 block text-xs font-medium text-brand-charcoal">Descripción
                    <input value={highlight.label} onChange={updateHighlight(index, "label")} maxLength={70} className={inputClass} />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold text-brand-ink">Características</h2>
            <p className="mt-1 text-xs text-brand-muted">Cuatro bloques que explican los beneficios de tu solución de autoservicio.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {form.features.map((feature, index) => (
                <div key={index} className="rounded-xl border border-brand-line bg-brand-sand/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Característica {index + 1}</p>
                  <label className="mt-2 block text-xs font-medium text-brand-charcoal">Título
                    <input value={feature.title} onChange={updateFeature(index, "title")} maxLength={90} className={inputClass} />
                  </label>
                  <label className="mt-3 block text-xs font-medium text-brand-charcoal">Descripción
                    <textarea value={feature.description} onChange={updateFeature(index, "description")} maxLength={200} rows={3} className={inputClass} />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold text-brand-ink">Llamado final</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-brand-charcoal md:col-span-2">Título
                <input value={form.closing_title} onChange={update("closing_title")} maxLength={140} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal md:col-span-2">Descripción
                <textarea value={form.closing_description} onChange={update("closing_description")} maxLength={300} rows={2} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Texto del botón
                <input value={form.closing_label} onChange={update("closing_label")} maxLength={40} className={inputClass} />
              </label>
              <label className="text-sm text-brand-charcoal">Enlace del botón
                <input value={form.closing_url} onChange={update("closing_url")} maxLength={300} className={inputClass} />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-line bg-white px-5 py-3 text-sm font-medium text-brand-charcoal transition hover:border-brand-accent">
              <RotateCcw size={15} /> Restaurar valores
            </button>
            <button type="submit" disabled={saving} className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar página"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
