"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Award, ImagePlus, Save, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { CERTIFICATION_HEIGHT, clampCertificationHeight } from "@/lib/certifications";
import { optimizeImage } from "@/lib/imageOptimize";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";

const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxUploadBytes = 12 * 1024 * 1024;
const MIGRATION_FILE = "20261104130000_certifications.sql";
const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

function CertificationCard({ certification, index, total, busy, disabled, onMove, onDelete, onSaved }) {
  const { getToken } = useAppContext();
  const [name, setName] = useState(certification.name);
  const [height, setHeight] = useState(certification.height);
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== certification.name || height !== certification.height;
  const previewHeight = Math.min(112, Math.max(56, height));

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre del sello no puede quedar vacío.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        "/api/certifications",
        { id: certification.id, name: name.trim(), height },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo guardar el sello.");
      onSaved(data.certification);
      toast.success("Sello actualizado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar el sello.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`rounded-2xl border border-brand-line bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4 ${busy === certification.id ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-sand text-[10px] font-semibold text-brand-muted">{index + 1}</span>
          <div className="grid min-h-24 min-w-28 shrink-0 place-items-center rounded-xl border border-brand-line bg-brand-sand/50 p-3">
            <Image
              src={certification.image_url}
              alt={certification.name}
              width={160}
              height={126}
              style={{ height: previewHeight }}
              className="w-auto max-w-full object-contain"
            />
          </div>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-semibold text-brand-ink">{certification.name}</p>
            <p className="mt-1 text-[11px] text-brand-muted">Alto en el carrusel: {certification.height} px</p>
            <p className="mt-1 text-[11px] leading-4 text-brand-muted">Visible en la primera diapositiva del inicio.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:pt-1">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={disabled || index === 0 || busy !== ""}
            aria-label={`Subir ${certification.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <ArrowUp size={16} /><span className="md:hidden">Subir</span>
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={disabled || index === total - 1 || busy !== ""}
            aria-label={`Bajar ${certification.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <ArrowDown size={16} /><span className="md:hidden">Bajar</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(certification)}
            disabled={disabled || busy !== ""}
            aria-label={`Eliminar ${certification.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <Trash2 size={16} /><span className="md:hidden">Eliminar</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-brand-line pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block min-w-0 text-xs font-medium text-brand-charcoal">
          Nombre del sello
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} disabled={disabled} className={inputClass} />
        </label>

        <label className="block min-w-0 text-xs font-medium text-brand-charcoal">
          <span className="flex items-center justify-between gap-2">Tamaño <span className="font-semibold text-brand-accent">{height} px</span></span>
          <input
            type="range"
            min={CERTIFICATION_HEIGHT.min}
            max={CERTIFICATION_HEIGHT.max}
            step={CERTIFICATION_HEIGHT.step}
            value={height}
            onChange={(event) => setHeight(clampCertificationHeight(event.target.value))}
            disabled={disabled}
            className="mt-3 h-2 w-full cursor-pointer accent-brand-accent disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={disabled || !dirty || saving || busy !== ""}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </li>
  );
}

export default function CertificationsPage() {
  const { authLoading, getToken, isSeller, user } = useAppContext();
  const confirm = useConfirm();
  const [certifications, setCertifications] = useState(null);
  const [pendingMigration, setPendingMigration] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [height, setHeight] = useState(CERTIFICATION_HEIGHT.default);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState("");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const loadCertifications = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/certifications");
      if (!data.success) throw new Error(data.message || "No se pudieron cargar los sellos.");
      setCertifications(data.certifications);
      setPendingMigration(Boolean(data.pending));
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "No se pudieron cargar los sellos.");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadCertifications, 0);
    return () => clearTimeout(timeout);
  }, [loadCertifications]);

  const addCertification = async (event) => {
    event.preventDefault();
    if (!name.trim() || !file) {
      toast.error("Ingresa el nombre y selecciona la imagen del sello.");
      return;
    }
    if (!supportedImageTypes.includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > maxUploadBytes) {
      toast.error("El sello debe pesar menos de 12 MB antes de optimizarlo.");
      return;
    }

    setSaving(true);
    let uploadedPath = "";
    let apiRequestStarted = false;
    try {
      const token = await getToken();
      if (!token || !user?.id) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const optimized = await optimizeImage(file, { maxSide: 1200, quality: 0.9 });
      if (optimized.size > 8 * 1024 * 1024) {
        throw new Error("El sello supera 8 MB después de optimizarlo. Selecciona una imagen más liviana.");
      }

      uploadedPath = await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "certifications");
      apiRequestStarted = true;
      const { data } = await axios.post(
        "/api/certifications",
        { name: name.trim(), imagePath: uploadedPath, height },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo agregar el sello.");

      setName("");
      setFile(null);
      setHeight(CERTIFICATION_HEIGHT.default);
      setPendingMigration(false);
      toast.success("Sello agregado. Ya aparece en la primera diapositiva del carrusel.");
      await loadCertifications();
    } catch (error) {
      if (uploadedPath && !apiRequestStarted) {
        const { error: cleanupError } = await createSupabaseBrowserClient()
          .storage.from("product-media").remove([uploadedPath]);
        if (cleanupError) console.error("No se pudo limpiar el sello que no se guardó:", cleanupError);
      }
      toast.error(error.response?.data?.message || error.message || "No se pudo agregar el sello.");
    } finally {
      setSaving(false);
    }
  };

  const saveCertification = (updated) => {
    setCertifications((current) => current?.map((item) => item.id === updated.id ? { ...item, ...updated } : item) || current);
  };

  const moveCertification = async (index, step) => {
    if (!certifications) return;
    const target = index + step;
    if (target < 0 || target >= certifications.length) return;
    const order = certifications.map((item) => item.id);
    [order[index], order[target]] = [order[target], order[index]];

    setBusy("order");
    try {
      const token = await getToken();
      const { data } = await axios.patch("/api/certifications", { order }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo actualizar el orden.");
      setCertifications(data.certifications);
      toast.success("Orden actualizado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo actualizar el orden.");
    } finally {
      setBusy("");
    }
  };

  const deleteCertification = async (certification) => {
    const accepted = await confirm({
      title: `¿Eliminar el sello ${certification.name}?`,
      message: "Se quitará de la primera diapositiva del carrusel de inicio.",
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;

    setBusy(certification.id);
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/certifications", {
        data: { id: certification.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo eliminar el sello.");
      setCertifications((current) => current.filter((item) => item.id !== certification.id));
      if (data.cleanupWarning) toast.error(data.message);
      else toast.success(data.message || "Sello eliminado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo eliminar el sello.");
    } finally {
      setBusy("");
    }
  };

  if (authLoading) {
    return <main className="flex-1 p-6 text-sm text-brand-muted">Verificando acceso...</main>;
  }
  if (!isSeller) {
    return <main className="flex-1 p-6"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">No tienes permiso para administrar las certificaciones.</p></main>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Certificaciones"
          description="Sube los sellos de calificación certificada. Se muestran en la primera diapositiva del carrusel de inicio y puedes ajustar su tamaño y orden."
        />

        <form onSubmit={addCertification} className="mt-6 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-5">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            <Award size={15} className="text-brand-accent" /> Nuevo sello
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_1fr_170px_auto] md:items-start">
            <label className="block text-xs font-medium text-brand-charcoal">
              Nombre del sello
              <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Zebra Supplies Specialist" disabled={pendingMigration} className={inputClass} />
            </label>

            <div className="min-w-0">
              <span className="block text-xs font-medium text-brand-charcoal">Imagen (JPG, PNG o WebP)</span>
              <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line bg-brand-sand/30 px-3 py-2.5 text-xs font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent-soft/40">
                <ImagePlus size={16} />
                <span className="min-w-0 truncate">{file ? file.name : "Seleccionar sello"}</span>
                <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} disabled={pendingMigration} className="sr-only" />
              </label>
              <span className="mt-1 block text-[11px] leading-4 text-brand-muted">Funciona mejor con PNG de fondo transparente.</span>
            </div>

            <label className="block text-xs font-medium text-brand-charcoal">
              <span className="flex items-center justify-between gap-2">Tamaño <span className="font-semibold text-brand-accent">{height} px</span></span>
              <input
                type="range"
                min={CERTIFICATION_HEIGHT.min}
                max={CERTIFICATION_HEIGHT.max}
                step={CERTIFICATION_HEIGHT.step}
                value={height}
                onChange={(event) => setHeight(clampCertificationHeight(event.target.value))}
                disabled={pendingMigration}
                className="mt-3 h-2 w-full cursor-pointer accent-brand-accent"
              />
            </label>

            <button type="submit" disabled={saving || pendingMigration || !name.trim() || !file} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50 md:mt-6 md:w-auto">
              <ImagePlus size={17} /> {saving ? "Optimizando..." : "Agregar sello"}
            </button>
          </div>

          {preview && file && (
            <div className="mt-4 flex items-center gap-4 rounded-xl bg-brand-sand/60 p-3">
              <div className="grid min-h-28 min-w-32 place-items-center rounded-lg bg-white p-3">
                <Image
                  src={preview}
                  alt="Vista previa del sello"
                  width={160}
                  height={126}
                  unoptimized
                  style={{ height: Math.min(112, height) }}
                  className="w-auto max-w-full object-contain"
                />
              </div>
              <p className="min-w-0 text-xs leading-5 text-brand-muted">Vista previa · {(file.size / 1024).toFixed(0)} KB antes de optimizar<br />Así se verá en la primera diapositiva.</p>
            </div>
          )}
        </form>

        {pendingMigration && (
          <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Falta crear la tabla de certificaciones.</p>
            <p className="mt-1 text-xs leading-5">Aplica la migración <code className="rounded bg-white px-1 py-0.5">{MIGRATION_FILE}</code> en Supabase para poder agregar, editar y ordenar los sellos. Mientras tanto se muestran los sellos de ejemplo en la tienda.</p>
          </div>
        )}

        <section className="mt-6" aria-labelledby="certifications-list-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Award size={19} className="shrink-0 text-brand-accent" />
              <h2 id="certifications-list-title" className="truncate font-display text-xl text-brand-ink">Sellos del carrusel</h2>
              {certifications?.length ? <span className="shrink-0 rounded-full bg-brand-sand px-2 py-0.5 text-[10px] font-semibold text-brand-muted">{certifications.length}</span> : null}
            </div>
            <p className="text-[11px] text-brand-muted">Solo primera diapositiva · el orden se refleja en la tienda.</p>
          </div>

          {loadError ? (
            <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-white p-5 text-sm text-brand-sale shadow-sm">
              <p>{loadError}</p>
              <button type="button" onClick={loadCertifications} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-brand-line px-4 text-xs font-semibold text-brand-charcoal transition hover:border-brand-sale hover:text-brand-sale">
                Reintentar
              </button>
            </div>
          ) : certifications === null ? (
            <p className="mt-3 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted shadow-sm">Cargando sellos...</p>
          ) : certifications.length ? (
            <ol className="mt-3 space-y-3">
              {certifications.map((certification, index) => (
                <CertificationCard
                  key={`${certification.id}-${certification.updated_at || ""}-${certification.height}`}
                  certification={certification}
                  index={index}
                  total={certifications.length}
                  busy={busy}
                  disabled={pendingMigration}
                  onMove={moveCertification}
                  onDelete={deleteCertification}
                  onSaved={saveCertification}
                />
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center">
              <Award size={26} className="mx-auto text-brand-muted" />
              <p className="mt-3 text-sm font-semibold text-brand-ink">Aún no hay sellos</p>
              <p className="mt-1 text-xs text-brand-muted">Agrega el primero desde el formulario de arriba y aparecerá en el carrusel.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
