"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, ImagePlus, Music2, PanelTopOpen, Upload, Volume2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { clampVolume, defaultPopup, popupImage } from "@/lib/popup";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

const MAX_AUDIO_SECONDS = 180;

const isMp3 = (file) =>
  file.type === "audio/mpeg" ||
  file.type === "audio/mp3" ||
  file.type === "audio/x-mpeg" ||
  /\.mp3$/i.test(file.name || "");

function readAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer el audio."));
    });
    audio.preload = "metadata";
    audio.src = url;
  });
}

export default function PopupAdmin() {
  const { getToken, user } = useAppContext();
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [resetAudio, setResetAudio] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get("/api/popup").then(({ data }) => setForm(data.popup)).catch(() => toast.error("No se pudo cargar la ventana emergente."));
  }, []);

  const previewImage = file ? URL.createObjectURL(file) : resetImage ? popupImage(defaultPopup) : popupImage(form || defaultPopup);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    if (file && !file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido.");
      return;
    }
    if (audioFile && !isMp3(audioFile)) {
      toast.error("Selecciona un archivo MP3 válido.");
      return;
    }
    if (audioFile) {
      let duration;
      try {
        duration = await readAudioDuration(audioFile);
      } catch {
        toast.error("No se pudo leer la duración del audio.");
        return;
      }
      if (duration > MAX_AUDIO_SECONDS) {
        toast.error("La pista supera los 3 minutos. Sube una más corta.");
        return;
      }
    }

    setSaving(true);
    try {
      const token = await getToken();
      const optimized = file ? await optimizeImage(file, { maxSide: 2400 }) : null;
      if (optimized && optimized.size > 8 * 1024 * 1024) {
        toast.error("La imagen sigue pesando más de 8 MB después de optimizarla. Usa una más pequeña.");
        return;
      }
      const imagePath = optimized ? await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "popup") : "";
      const audioPath = audioFile ? await uploadProductFile(createSupabaseBrowserClient(), user.id, audioFile, "popup-audio") : "";
      const payload = { ...form, imagePath, resetImage, audioPath, resetAudio };
      const { data } = await axios.put("/api/popup", payload, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      toast.success("Ventana emergente guardada.");
      setFile(null);
      setResetImage(false);
      setAudioFile(null);
      setResetAudio(false);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="w-full flex-1 p-8 text-sm text-brand-muted">Cargando...</div>;

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Ventana emergente"
          description="Aviso que se muestra como ventana emergente al cargar la tienda. Úsala para promociones o mensajes importantes. Puedes subir una imagen, agregar textos y un botón."
        />

        <section className="mt-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-line px-4 py-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              <PanelTopOpen size={14} className="text-brand-accent" /> Vista previa
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${form.enabled ? "bg-brand-success/10 text-brand-success" : "bg-brand-sand text-brand-muted"}`}>
              {form.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
              {form.enabled ? "Visible en la tienda" : "Oculto"}
            </span>
          </div>

          <div className="grid gap-0 bg-brand-sand/30 p-3 sm:p-5">
            <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-brand-line bg-white shadow-lg transition ${form.enabled ? "" : "opacity-40"}`}>
              <div className="relative aspect-[4/3] w-full sm:aspect-video">
                <Image src={previewImage} alt="" fill unoptimized={Boolean(file)} sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
                <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-brand-ink shadow-lg ring-1 ring-black/5 backdrop-blur">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </span>
              </div>
              <div className="px-6 py-6 sm:px-10 sm:py-8">
                <p className="font-display text-2xl leading-tight text-brand-ink sm:text-3xl">{form.title || "Sin título"}</p>
                <p className="mt-2 text-sm leading-6 text-brand-muted sm:text-base">{form.message || "Sin mensaje"}</p>
                {form.button_label && (
                  <span className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white sm:w-auto">{form.button_label}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={save} className="mt-5 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-brand-line bg-brand-sand/40 p-4">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-brand-ink">Mostrar la ventana emergente en la tienda</span>
              <span className="mt-1 block text-xs text-brand-muted">Si la desactivas, no se mostrará a ningún visitante.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label="Mostrar la ventana emergente en la tienda"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              className="peer sr-only"
            />
            <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-brand-line transition peer-checked:bg-brand-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-accent after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          </label>

          <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr] lg:gap-6">
            <div>
              <p className="text-xs font-medium text-brand-charcoal">Imagen de la ventana</p>
              <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl border border-brand-line bg-brand-sand sm:aspect-video">
                <Image src={previewImage} alt="" fill unoptimized={Boolean(file)} sizes="(max-width: 1024px) 100vw, 300px" className="object-cover" />
              </div>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line bg-brand-sand/30 px-3 py-2.5 text-xs font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent-soft/40">
                <ImagePlus size={16} /> <span className="min-w-0 truncate">{file ? file.name : "Subir imagen"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setResetImage(false); }} />
              </label>
              <p className="mt-2 text-[11px] leading-4 text-brand-muted">Se optimiza sola antes de subirla. Máximo 8 MB. Si no subes una, se usa la imagen navideña por defecto.</p>
              {(form.image_url || file) && (
                <button type="button" onClick={() => { setFile(null); setResetImage(true); }} className="mt-1 block w-full text-center text-xs text-brand-accent hover:underline sm:text-left">Restaurar imagen por defecto</button>
              )}
            </div>

            <div className="grid min-w-0 gap-4">
              <label className="block text-sm font-medium text-brand-charcoal">Título <span className="font-normal text-brand-muted">(opcional)</span>
                <input maxLength={120} value={form.title} onChange={update("title")} className={inputClass} placeholder="Ej: ¡Llegó la Navidad!" />
              </label>
              <label className="block text-sm font-medium text-brand-charcoal">Mensaje <span className="font-normal text-brand-muted">(opcional)</span>
                <textarea rows={4} maxLength={300} value={form.message} onChange={update("message")} className={inputClass} placeholder="Escribe tu promoción o aviso importante..." />
              </label>
              <label className="block text-sm font-medium text-brand-charcoal">Texto del botón <span className="font-normal text-brand-muted">(opcional)</span>
                <input maxLength={40} value={form.button_label} onChange={update("button_label")} className={inputClass} placeholder="Ver promociones" />
              </label>
              <label className="block text-sm font-medium text-brand-charcoal">Enlace del botón <span className="font-normal text-brand-muted">(opcional)</span>
                <input maxLength={300} value={form.button_url} onChange={update("button_url")} className={inputClass} placeholder="/all-products" />
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-brand-line bg-brand-sand/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <Music2 size={16} className="text-brand-accent" /> Música de fondo
              </p>
              <span className="text-[11px] text-brand-muted">MP3 · máx. 3 minutos</span>
            </div>
            <p className="mt-1 text-xs text-brand-muted">Se reproduce en bucle mientras la ventana está abierta y se silencia al cerrarla.</p>

            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-brand-line bg-white p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-brand-charcoal">Reproducir música</span>
                <span className="mt-0.5 block text-xs text-brand-muted">Si la desactivas, no sonará aunque haya una pista cargada.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Reproducir música de fondo"
                checked={form.audio_enabled}
                onChange={(event) => setForm((current) => ({ ...current, audio_enabled: event.target.checked }))}
                className="peer sr-only"
              />
              <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-brand-line transition peer-checked:bg-brand-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-accent after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line bg-white px-3 py-2.5 text-xs font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent-soft/40">
                <Upload size={16} /> <span className="min-w-0 truncate">{audioFile ? audioFile.name : form.audio_url ? "Cambiar pista" : "Subir pista MP3"}</span>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  className="sr-only"
                  onChange={(event) => { setAudioFile(event.target.files?.[0] || null); setResetAudio(false); }}
                />
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-brand-line bg-white px-3 py-2.5">
                <Volume2 size={16} className="shrink-0 text-brand-muted" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.audio_volume}
                  onChange={update("audio_volume")}
                  aria-label="Volumen del audio"
                  className="w-full accent-brand-accent"
                />
                <span className="w-9 shrink-0 text-right text-xs font-semibold text-brand-accent">{clampVolume(form.audio_volume)}%</span>
              </div>
            </div>

            {(form.audio_url || audioFile) && (
              <button type="button" onClick={() => { setAudioFile(null); setResetAudio(true); }} className="mt-2 block text-xs text-brand-accent hover:underline">Quitar pista de audio</button>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-brand-line pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setForm(defaultPopup); setFile(null); setResetImage(true); setAudioFile(null); setResetAudio(true); }} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-5 py-3 text-sm font-medium text-brand-charcoal transition hover:bg-brand-sand">Restaurar valores</button>
            <button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">{saving ? "Guardando..." : "Guardar ventana"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
