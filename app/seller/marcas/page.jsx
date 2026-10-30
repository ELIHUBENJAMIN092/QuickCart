"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, BadgeCheck, ImagePlus, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { optimizeImage } from "@/lib/imageOptimize";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";

const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxUploadBytes = 12 * 1024 * 1024;
const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

export default function TrustedBrandsPage() {
  const { authLoading, getToken, isSeller, user } = useAppContext();
  const confirm = useConfirm();
  const [brands, setBrands] = useState(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState("");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const loadBrands = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/trusted-brands");
      if (!data.success) throw new Error(data.message || "No se pudieron cargar las marcas.");
      setBrands(data.brands);
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "No se pudieron cargar las marcas.");
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const addBrand = async (event) => {
    event.preventDefault();
    if (!name.trim() || !file) {
      toast.error("Ingresa el nombre y selecciona el logo de la marca.");
      return;
    }
    if (!supportedImageTypes.includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > maxUploadBytes) {
      toast.error("El logo debe pesar menos de 12 MB antes de optimizarlo.");
      return;
    }

    setSaving(true);
    let uploadedPath = "";
    let apiRequestStarted = false;
    try {
      const token = await getToken();
      if (!token || !user?.id) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const optimized = await optimizeImage(file, { maxSide: 1400, quality: 0.82 });
      if (optimized.size > 8 * 1024 * 1024) {
        throw new Error("El logo supera 8 MB después de optimizarlo. Selecciona una imagen más liviana.");
      }

      uploadedPath = await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "brands");
      apiRequestStarted = true;
      const { data } = await axios.post(
        "/api/trusted-brands",
        { name: name.trim(), imagePath: uploadedPath },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo agregar la marca.");

      setName("");
      setFile(null);
      toast.success(optimized.size < file.size ? "Logo optimizado y marca agregada al carrusel." : "Marca agregada al carrusel.");
      await loadBrands();
    } catch (error) {
      if (uploadedPath && !apiRequestStarted) {
        const { error: cleanupError } = await createSupabaseBrowserClient()
          .storage.from("product-media").remove([uploadedPath]);
        if (cleanupError) console.error("No se pudo limpiar el logo que no se guardó:", cleanupError);
      }
      toast.error(error.response?.data?.message || error.message || "No se pudo agregar la marca.");
    } finally {
      setSaving(false);
    }
  };

  const moveBrand = async (index, step) => {
    if (!brands) return;
    const target = index + step;
    if (target < 0 || target >= brands.length) return;
    const order = brands.map((brand) => brand.id);
    [order[index], order[target]] = [order[target], order[index]];
    setBusy("order");
    try {
      const token = await getToken();
      const { data } = await axios.patch("/api/trusted-brands", { order }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo actualizar el orden.");
      setBrands(data.brands);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo actualizar el orden.");
    } finally {
      setBusy("");
    }
  };

  const deleteBrand = async (brand) => {
    const accepted = await confirm({
      title: `¿Eliminar la marca ${brand.name}?`,
      message: "Se quitará del carrusel de marcas de confianza.",
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;

    setBusy(brand.id);
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/trusted-brands", {
        data: { id: brand.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo eliminar la marca.");
      setBrands((current) => current.filter((item) => item.id !== brand.id));
      if (data.cleanupWarning) toast.error(data.message);
      else toast.success(data.message || "Marca eliminada.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo eliminar la marca.");
    } finally {
      setBusy("");
    }
  };

  if (authLoading) {
    return <main className="flex-1 p-6 text-sm text-brand-muted">Verificando acceso...</main>;
  }
  if (!isSeller) {
    return <main className="flex-1 p-6"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">No tienes permiso para administrar las marcas.</p></main>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Marcas de confianza"
          description="Agrega los logos de tus marcas aliadas. Se suman al carrusel de la tienda y puedes cambiar su orden cuando quieras."
        />

        <form onSubmit={addBrand} className="mt-6 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-5">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            <ImagePlus size={14} className="text-brand-accent" /> Nueva marca
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <label className="block text-xs font-medium text-brand-charcoal">
              Nombre de la marca
              <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Zebra" className={inputClass} />
            </label>

            <div className="min-w-0">
              <span className="block text-xs font-medium text-brand-charcoal">Logo (JPG, PNG o WebP)</span>
              <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line bg-brand-sand/30 px-3 py-2.5 text-xs font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent-soft/40">
                <ImagePlus size={16} />
                <span className="min-w-0 truncate">{file ? file.name : "Seleccionar logo"}</span>
                <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="sr-only" />
              </label>
              <span className="mt-1 block text-[11px] leading-4 text-brand-muted">Se optimiza antes de subirla para reducir el peso.</span>
            </div>

            <button type="submit" disabled={saving || !name.trim() || !file} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50 md:mt-6 md:w-auto">
              <ImagePlus size={17} /> {saving ? "Optimizando y guardando..." : "Agregar marca"}
            </button>
          </div>

          {preview && file && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-sand/60 p-3">
              <Image src={preview} alt="Vista previa del logo" width={112} height={56} unoptimized className="h-14 w-28 shrink-0 rounded-lg bg-white object-contain p-2" />
              <p className="min-w-0 text-xs leading-4 text-brand-muted">Vista previa · {(file.size / 1024).toFixed(0)} KB antes de optimizar</p>
            </div>
          )}
        </form>

        <section className="mt-6" aria-labelledby="brands-list-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <BadgeCheck size={19} className="shrink-0 text-brand-accent" />
              <h2 id="brands-list-title" className="truncate font-display text-xl text-brand-ink">Marcas en el carrusel</h2>
              {brands?.length ? <span className="shrink-0 rounded-full bg-brand-sand px-2 py-0.5 text-[10px] font-semibold text-brand-muted">{brands.length}</span> : null}
            </div>
            <p className="text-[11px] text-brand-muted">El orden se refleja en la tienda.</p>
          </div>

          {loadError ? (
            <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-white p-5 text-sm text-brand-sale shadow-sm">
              <p>{loadError}</p>
              <button type="button" onClick={loadBrands} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-brand-line px-4 text-xs font-semibold text-brand-charcoal transition hover:border-brand-sale hover:text-brand-sale">
                Reintentar
              </button>
            </div>
          ) : brands === null ? (
            <p className="mt-3 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted shadow-sm">Cargando marcas...</p>
          ) : brands.length ? (
            <ol className="mt-3 space-y-3">
              {brands.map((brand, index) => (
                <li key={brand.id} className={`rounded-2xl border border-brand-line bg-white p-3 shadow-sm transition hover:shadow-md sm:flex sm:items-center sm:gap-4 sm:p-4 ${busy === brand.id ? "opacity-60" : ""}`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-sand text-[10px] font-semibold text-brand-muted">{index + 1}</span>
                    <div className="grid h-14 w-24 shrink-0 place-items-center rounded-xl border border-brand-line bg-white p-2 sm:h-16 sm:w-32">
                      <Image src={brand.logo_url} alt={brand.name} width={140} height={56} className="max-h-10 w-auto max-w-full object-contain sm:max-h-12" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-ink">{brand.name}</p>
                      <p className="mt-0.5 text-[10px] text-brand-muted">Logo del carrusel</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-brand-line pt-3 sm:mt-0 sm:shrink-0 sm:border-0 sm:pt-0">
                    <button type="button" onClick={() => moveBrand(index, -1)} disabled={index === 0 || busy !== ""} aria-label={`Subir ${brand.name}`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none">
                      <ArrowUp size={16} /> <span className="sm:hidden">Subir</span>
                    </button>
                    <button type="button" onClick={() => moveBrand(index, 1)} disabled={index === brands.length - 1 || busy !== ""} aria-label={`Bajar ${brand.name}`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none">
                      <ArrowDown size={16} /> <span className="sm:hidden">Bajar</span>
                    </button>
                    <button type="button" onClick={() => deleteBrand(brand)} disabled={busy !== ""} aria-label={`Eliminar ${brand.name}`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none">
                      <Trash2 size={16} /> <span className="sm:hidden">Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center">
              <BadgeCheck size={26} className="mx-auto text-brand-muted" />
              <p className="mt-3 text-sm font-semibold text-brand-ink">Aún no hay marcas</p>
              <p className="mt-1 text-xs text-brand-muted">Agrega la primera desde el formulario de arriba.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
