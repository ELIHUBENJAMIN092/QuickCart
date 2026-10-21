"use client";

import { specificationsToText } from "@/lib/specsText";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, ImagePlus, Video } from "lucide-react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { categories, normalizeProductCategory } from "@/lib/categories";
import Loading from "@/components/Loading";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { processProductImage } from "@/lib/imageOptimize";
import ProductExtraFields, { ProductBadgeFields, validateCatalogFile } from "@/components/seller/ProductExtraFields";

const inputClass =
  "w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent";

export default function EditProduct() {
  const { id } = useParams();
  const { getToken, router, fetchProductData, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState([]);
  const [processingSlot, setProcessingSlot] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [catalogFile, setCatalogFile] = useState(null);
  const [removeCatalog, setRemoveCatalog] = useState(false);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    offerPrice: "",
    stock: "",
    image: [],
    video: "",
    catalogPdf: "",
    specsText: "",
    isOffer: false,
    isNew: false,
    model3dUrl: "",
    printerType: "",
  });

  const subcategories = useMemo(
    () => categories.find((category) => category.slug === product.category)?.subcategories || [],
    [product.category]
  );
  const selectedCategoryIsValid = categories.some((category) => category.slug === product.category);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`/api/product/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data.success || !data.product) {
          toast.error(data.message || "No se encontró el producto.");
          router.push("/seller/product-list");
          return;
        }
        const normalized = normalizeProductCategory(data.product.category, data.product.subcategory);
        setProduct({
          name: data.product.name || "",
          description: data.product.description || "",
          category: normalized.category,
          subcategory: normalized.subcategory,
          price: data.product.price ?? "",
          offerPrice: data.product.offerPrice ?? "",
          stock: data.product.stock ?? 0,
          image: data.product.image || [],
          video: data.product.video || "",
          catalogPdf: data.product.catalog_pdf || "",
          specsText: specificationsToText(data.product.specifications),
          isOffer: data.product.is_offer === true,
          isNew: data.product.is_new === true,
          model3dUrl: data.product.model_3d_url || "",
          printerType: data.product.printer_type || "",
        });
        setSlots((data.product.image || []).map((url) => ({ url })));
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [getToken, id, router]);

  const updateField = (field, value) =>
    setProduct((current) => ({ ...current, [field]: value }));

  const replaceSlot = async (index, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      toast.error("La imagen debe ser válida y pesar máximo 8 MB.");
      return;
    }
    setProcessingSlot(index);
    try {
      const processed = await processProductImage(file);
      if (processed.size > 8 * 1024 * 1024) {
        toast.error("La imagen debe pesar máximo 8 MB.");
        return;
      }
      setSlots((current) => current.map((slot, i) => i === index ? { file: processed, preview: URL.createObjectURL(processed) } : slot));
    } catch {
      toast.error("No se pudo procesar la imagen.");
    } finally {
      setProcessingSlot(null);
    }
  };

  const removeSlot = (index) => setSlots((current) => current.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Number(product.offerPrice) > Number(product.price)) {
      toast.error("El precio de oferta no puede superar el precio normal.");
      return;
    }
    const visibleSlots = slots.filter((slot) => slot.url || slot.file);
    if (!visibleSlots.length) {
      toast.error("El producto debe tener al menos una imagen.");
      return;
    }
    if (videoFile && (!videoFile.type.startsWith("video/") || videoFile.size > 100 * 1024 * 1024)) {
      toast.error("El video debe ser válido y pesar máximo 100 MB.");
      return;
    }
    if (!validateCatalogFile(catalogFile)) {
      toast.error("El catálogo debe ser un PDF de máximo 25 MB.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token || !user) {
        toast.error("Inicia sesión como vendedor para editar productos.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const imageSlots = await Promise.all(
        visibleSlots.map(async (slot) => slot.file
          ? { path: await uploadProductFile(supabase, user.id, slot.file, "images") }
          : { keep: slot.url })
      );
      const videoPath = videoFile
        ? await uploadProductFile(supabase, user.id, videoFile, "videos")
        : "";
      const catalogPath = catalogFile
        ? await uploadProductFile(supabase, user.id, catalogFile, "catalogs")
        : "";
      const { data } = await axios.put(`/api/product/update/${id}`, {
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        offerPrice: product.offerPrice,
        stock: product.stock,
        imageSlots,
        videoPath,
        removeVideo,
        catalogPath,
        removeCatalog,
        specificationsText: product.specsText,
        isOffer: product.isOffer,
        isNew: product.isNew,
        model3dUrl: product.model3dUrl,
        printerType: product.printerType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) {
        toast.error(data.message || "No se pudo actualizar el producto.");
        return;
      }
      toast.success(data.message);
      await fetchProductData();
      router.push("/seller/product-list");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1"><Loading /></div>;

  return (
    <main className="min-h-screen flex-1 bg-brand-cream px-4 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/seller/product-list" className="mb-6 inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent">
          <ArrowLeft size={16} /> Volver a productos
        </Link>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Administración · Catálogo</p>
          <h1 className="mt-2 font-display text-3xl text-brand-ink md:text-4xl">Editar producto</h1>
          <p className="mt-2 text-sm text-brand-muted">Actualiza la información que verán tus clientes en la tienda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-8">
          <section>
            <h2 className="mb-4 text-sm font-semibold text-brand-ink">Información del producto</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-xs font-medium text-brand-charcoal md:col-span-2">
                Nombre del producto
                <input required maxLength={160} value={product.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass} />
              </label>
              <label className="space-y-2 text-xs font-medium text-brand-charcoal md:col-span-2">
                Descripción
                <textarea required rows={5} maxLength={5000} value={product.description} onChange={(event) => updateField("description", event.target.value)} className={`${inputClass} resize-y`} />
              </label>
              <label className="space-y-2 text-xs font-medium text-brand-charcoal">
                Categoría principal
                <select required value={product.category} onChange={(event) => setProduct((current) => ({ ...current, category: event.target.value, subcategory: "", printerType: "" }))} className={inputClass}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-medium text-brand-charcoal">
                Subcategoría
                <select value={product.subcategory} onChange={(event) => setProduct((current) => ({ ...current, subcategory: event.target.value, printerType: "" }))} className={inputClass}>
                  <option value="">Sin subcategoría</option>
                  {subcategories.map((subcategory) => <option key={subcategory.slug} value={subcategory.slug}>{subcategory.label || subcategory.name}</option>)}
                </select>
              </label>
            </div>
            {!selectedCategoryIsValid && (
              <p role="status" className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                La categoría anterior ({product.category || "sin categoría"}) ya no forma parte del catálogo. Selecciona una de las nuevas categorías para guardar este producto.
              </p>
            )}
          </section>

          <section className="border-t border-brand-line pt-6">
            <h2 className="mb-4 text-sm font-semibold text-brand-ink">Precio e inventario</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="space-y-2 text-xs font-medium text-brand-charcoal">
                Precio normal
                <input required type="number" min="0.01" step="0.01" value={product.price} onChange={(event) => updateField("price", event.target.value)} className={inputClass} />
              </label>
              <label className="space-y-2 text-xs font-medium text-brand-charcoal">
                Precio de oferta
                <input required type="number" min="0" step="0.01" value={product.offerPrice} onChange={(event) => updateField("offerPrice", event.target.value)} className={inputClass} />
              </label>
              <label className="space-y-2 text-xs font-medium text-brand-charcoal">
                Unidades en stock
                <input required type="number" min="0" step="1" value={product.stock} onChange={(event) => updateField("stock", event.target.value)} className={inputClass} />
              </label>
            </div>
          </section>

          <section className="border-t border-brand-line pt-6">
            <h2 className="mb-1 text-sm font-semibold text-brand-ink">Imágenes y video</h2>
            <p className="mb-4 text-xs leading-5 text-brand-muted">Cambia o quita cada foto por separado. Máximo 3 imágenes de 8 MB; se optimizan y se les quita el fondo blanco automáticamente.</p>
            <div className="flex flex-wrap gap-4">
              {slots.map((slot, index) => (
                <div key={index} className="w-28 space-y-2">
                  <div className="relative h-28 w-28 overflow-hidden border border-brand-line bg-brand-cream">
                    {processingSlot === index ? (
                      <span className="flex h-full items-center justify-center text-xs text-brand-muted">Procesando...</span>
                    ) : slot.url || slot.preview ? (
                      <Image src={slot.preview || slot.url} alt={`Imagen ${index + 1}`} fill unoptimized={Boolean(slot.preview)} sizes="112px" className="object-contain p-1" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-brand-muted">Sin imagen</span>
                    )}
                  </div>
                  <label className="block cursor-pointer text-center text-xs font-medium text-brand-accent hover:underline">
                    {slot.url || slot.file ? "Reemplazar" : "Subir foto"}
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => { replaceSlot(index, event.target.files?.[0]); event.target.value = ""; }} />
                  </label>
                  {(slot.url || slot.file) && <button type="button" onClick={() => removeSlot(index)} className="block w-full text-center text-xs text-brand-sale hover:underline">Quitar</button>}
                </div>
              ))}
              {slots.length < 3 && (
                <button type="button" onClick={() => setSlots((current) => [...current, {}])} className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-brand-line text-xs text-brand-muted transition hover:border-brand-accent">
                  <ImagePlus size={20} className="text-brand-accent" /> Añadir foto
                </button>
              )}
            </div>
            {product.video && !removeVideo && <video src={product.video} controls preload="metadata" className="mt-4 max-h-48 w-full rounded-lg bg-brand-ink" />}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-accent">
                <Video size={17} /> {videoFile ? videoFile.name : "Reemplazar video"}
                <input type="file" accept="video/*" className="sr-only" onChange={(event) => { setVideoFile(event.target.files?.[0] || null); setRemoveVideo(false); }} />
              </label>
              {product.video && !removeVideo && <button type="button" onClick={() => { setRemoveVideo(true); setVideoFile(null); }} className="text-xs text-brand-sale hover:underline">Quitar video actual</button>}
              {removeVideo && <button type="button" onClick={() => setRemoveVideo(false)} className="text-xs text-brand-accent hover:underline">Deshacer</button>}
            </div>
          </section>

          <ProductBadgeFields isOffer={product.isOffer} isNew={product.isNew} onIsOffer={(value) => updateField("isOffer", value)} onIsNew={(value) => updateField("isNew", value)} />

          <ProductExtraFields
            category={product.category}
            subcategory={product.subcategory}
            printerType={product.printerType}
            onPrinterType={(value) => updateField("printerType", value)}
            model3dUrl={product.model3dUrl}
            onModel3dUrl={(value) => updateField("model3dUrl", value)}
            catalogFile={catalogFile}
            onCatalogFile={(file) => { setCatalogFile(file); if (file) setRemoveCatalog(false); }}
            currentCatalog={product.catalogPdf}
            specsText={product.specsText}
            onSpecsText={(value) => updateField("specsText", value)}
            removeCatalog={removeCatalog}
            onRemoveCatalog={(value) => { setRemoveCatalog(value); if (value) setCatalogFile(null); }}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-brand-line pt-6 sm:flex-row sm:justify-end">
            <Link href="/seller/product-list" className="rounded-full border border-brand-line px-6 py-3 text-center text-sm font-medium text-brand-charcoal hover:bg-brand-cream">Cancelar</Link>
            <button type="submit" disabled={saving} className="rounded-full bg-brand-accent px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60">{saving ? "Guardando..." : "Guardar cambios"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
