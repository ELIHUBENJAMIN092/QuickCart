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
const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

export default function TrustedBrandsPage() {
  const { authLoading, getToken, isSeller, user } = useAppContext();
  const confirm = useConfirm();
  const [brands, setBrands] = useState(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const loadBrands = useCallback(async () => {
    const { data } = await axios.get("/api/trusted-brands");
    if (!data.success) throw new Error(data.message || "No se pudieron cargar las marcas.");
    setBrands(data.brands);
  }, []);

  useEffect(() => {
    loadBrands().catch((error) => toast.error(error.response?.data?.message || error.message));
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
      <PageHeader
        eyebrow="Administración · Contenido"
        title="Marcas de confianza"
        description="Agrega los logos de tus marcas aliadas. Las nuevas marcas se suman al carrusel de la tienda y puedes cambiar el orden cuando quieras."
      />

      <form onSubmit={addBrand} className="mt-6 grid gap-5 rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:grid-cols-[1fr_1.2fr_auto] md:items-end md:p-6">
        <label className="text-sm font-medium text-brand-charcoal">
          Nombre de la marca
          <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Zebra" className={inputClass} />
        </label>
        <label className="text-sm font-medium text-brand-charcoal">
          Logo (JPG, PNG o WebP)
          <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-sand file:px-3 file:py-2 file:font-semibold file:text-brand-ink" />
          <span className="mt-1 block text-xs text-brand-muted">Se optimiza antes de subirla para reducir el peso.</span>
        </label>
        <button type="submit" disabled={saving || !name.trim() || !file} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-50">
          <ImagePlus size={17} /> {saving ? "Optimizando y guardando..." : "Agregar marca"}
        </button>
        {preview && file && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-sand/60 p-3 md:col-span-3">
            <Image src={preview} alt="Vista previa del logo" width={112} height={56} unoptimized className="h-14 w-28 rounded-lg bg-white object-contain p-2" />
            <p className="text-xs text-brand-muted">Vista previa · {(file.size / 1024).toFixed(0)} KB antes de optimizar</p>
          </div>
        )}
      </form>

      <section className="mt-8" aria-labelledby="brands-list-title">
        <div className="mb-4 flex items-center gap-2">
          <BadgeCheck size={19} className="text-brand-accent" />
          <h2 id="brands-list-title" className="font-display text-xl text-brand-ink">Marcas en el carrusel</h2>
        </div>
        {brands === null ? (
          <p className="rounded-xl border border-brand-line bg-white p-6 text-sm text-brand-muted">Cargando marcas...</p>
        ) : brands.length ? (
          <ol className="space-y-3">
            {brands.map((brand, index) => (
              <li key={brand.id} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-3 shadow-sm sm:gap-5 sm:p-4">
                <span className="w-7 shrink-0 text-center text-xs font-semibold text-brand-muted">{index + 1}</span>
                <div className="grid h-16 w-28 shrink-0 place-items-center rounded-xl bg-brand-sand/50 p-2 sm:w-36">
                  <Image src={brand.logo_url} alt={brand.name} width={140} height={56} className="max-h-12 w-auto max-w-full object-contain" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-ink">{brand.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => moveBrand(index, -1)} disabled={index === 0 || busy !== ""} aria-label={`Subir ${brand.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40">
                    <ArrowUp size={17} />
                  </button>
                  <button type="button" onClick={() => moveBrand(index, 1)} disabled={index === brands.length - 1 || busy !== ""} aria-label={`Bajar ${brand.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40">
                    <ArrowDown size={17} />
                  </button>
                  <button type="button" onClick={() => deleteBrand(brand)} disabled={busy !== ""} aria-label={`Eliminar ${brand.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-brand-line bg-white p-8 text-center text-sm text-brand-muted">Aún no hay marcas. Agrega la primera desde el formulario.</p>
        )}
      </section>
    </main>
  );
}
