"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  FileText,
  ImagePlus,
  PackageCheck,
  PackagePlus,
  Settings2,
  Video,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { categories, isLabelPrinterSubcategory, isValidHttpsUrl, printerTypes } from "@/lib/categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { processProductImage } from "@/lib/imageOptimize";
import ProductExtraFields, { ProductBadgeFields, validateCatalogFile } from "@/components/seller/ProductExtraFields";

const steps = [
  { title: "Imágenes", description: "Fotos y medios", icon: ImagePlus },
  { title: "Información", description: "Nombre y categoría", icon: PackagePlus },
  { title: "Precio y stock", description: "Datos de venta", icon: CircleDollarSign },
  { title: "Detalles", description: "Especificaciones", icon: Settings2 },
  { title: "Publicar", description: "Revisión final", icon: PackageCheck },
];

const inputClass = "w-full rounded-xl border border-brand-line bg-white px-4 py-3.5 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

function useObjectUrl(file) {
  const url = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => {
    if (!url) return undefined;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

function StepHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl text-brand-ink sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{description}</p>
    </div>
  );
}

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block min-w-0 text-sm font-medium text-brand-charcoal ${className}`}>
      <span>{label}</span>
      {hint && <span className="ml-1 font-normal text-brand-muted">{hint}</span>}
      {children}
    </label>
  );
}

export default function AddProduct() {
  const { getToken, fetchProductData, user } = useAppContext();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug || "");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [stock, setStock] = useState("");
  const [processingImage, setProcessingImage] = useState(null);
  const [isOffer, setIsOffer] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [catalogFile, setCatalogFile] = useState(null);
  const [brandLogo, setBrandLogo] = useState(null);
  const [model3dUrl, setModel3dUrl] = useState("");
  const [printerType, setPrinterType] = useState("");
  const [specsText, setSpecsText] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedCategory = categories.find((item) => item.slug === category);
  const firstImagePreview = useObjectUrl(files[0]);
  const secondImagePreview = useObjectUrl(files[1]);
  const thirdImagePreview = useObjectUrl(files[2]);
  const imagePreviews = [firstImagePreview, secondImagePreview, thirdImagePreview];
  const videoPreview = useObjectUrl(video);
  const brandLogoPreview = useObjectUrl(brandLogo);
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const validateStep = (stepIndex) => {
    if (stepIndex === 0) {
      const selectedImages = files.filter(Boolean);
      if (processingImage !== null) return "Espera a que termine el procesamiento de la imagen.";
      if (!files[0] || selectedImages.length > 3) return "Añade la foto principal del producto para continuar.";
      if (selectedImages.some((file) => !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)) return "Cada imagen debe ser válida y pesar máximo 8 MB.";
      if (video && (!video.type.startsWith("video/") || video.size > 100 * 1024 * 1024)) return "El video debe ser válido y pesar máximo 100 MB.";
      if (brandLogo && (!brandLogo.type.startsWith("image/") || brandLogo.size > 2 * 1024 * 1024)) return "El logo debe ser una imagen válida de máximo 2 MB.";
    }

    if (stepIndex === 1) {
      if (!name.trim() || name.trim().length > 160) return "Escribe un nombre de producto (máximo 160 caracteres).";
      if (!description.trim() || description.trim().length > 5000) return "Añade una descripción (máximo 5000 caracteres).";
      if (!selectedCategory || (subcategory && !selectedCategory.subcategories.some((item) => item.slug === subcategory))) return "Selecciona una categoría válida.";
    }

    if (stepIndex === 2) {
      const normalPrice = Number(price);
      const salePrice = Number(offerPrice);
      const availableStock = Number(stock);
      if (!Number.isFinite(normalPrice) || normalPrice <= 0) return "El precio normal debe ser mayor que cero.";
      if (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > normalPrice) return "El precio de oferta debe ser cero o menor que el precio normal.";
      if (!Number.isInteger(availableStock) || availableStock < 0) return "El stock debe ser un número entero igual o mayor que cero.";
    }

    if (stepIndex === 3) {
      if (!validateCatalogFile(catalogFile)) return "El catálogo debe ser un PDF de máximo 25 MB.";
      if (model3dUrl.trim() && (model3dUrl.trim().length > 500 || !isValidHttpsUrl(model3dUrl.trim()))) return "El enlace 3D debe ser una URL https válida.";
      if (isLabelPrinterSubcategory(category, subcategory) && !printerTypes.some((item) => item.slug === printerType)) return "Selecciona el tipo de impresora.";
    }

    return "";
  };

  const goToStep = (nextStep) => {
    if (nextStep > step) {
      for (let index = step; index < nextStep; index += 1) {
        const error = validateStep(index);
        if (error) {
          toast.error(error);
          return;
        }
      }
    }
    setStep(Math.max(0, Math.min(steps.length - 1, nextStep)));
  };

  const handleImageChange = async (index, selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/") || selected.size > 8 * 1024 * 1024) {
      toast.error("La imagen debe ser válida y pesar máximo 8 MB.");
      return;
    }
    setProcessingImage(index);
    try {
      const processed = await processProductImage(selected);
      if (processed.size > 8 * 1024 * 1024) {
        toast.error("La imagen debe pesar máximo 8 MB después de procesarla.");
        return;
      }
      setFiles((current) => {
        const next = [...current];
        next[index] = processed;
        return next;
      });
    } catch (error) {
      toast.error(error.message || "No se pudo procesar la imagen.");
    } finally {
      setProcessingImage(null);
    }
  };

  const resetForm = () => {
    setStep(0);
    setFiles([]);
    setVideo(null);
    setName("");
    setDescription("");
    setCategory(categories[0]?.slug || "");
    setSubcategory("");
    setPrice("");
    setOfferPrice("");
    setStock("");
    setIsOffer(false);
    setIsNew(false);
    setCatalogFile(null);
    setBrandLogo(null);
    setModel3dUrl("");
    setPrinterType("");
    setSpecsText("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    for (let index = 0; index < steps.length - 1; index += 1) {
      const error = validateStep(index);
      if (error) {
        setStep(index);
        toast.error(error);
        return;
      }
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token || !user) throw new Error("Inicia sesión como vendedor para agregar productos.");
      const supabase = createSupabaseBrowserClient();
      const imagePaths = await Promise.all(files.filter(Boolean).map((file) =>
        uploadProductFile(supabase, user.id, file, "images")
      ));
      const videoPath = video ? await uploadProductFile(supabase, user.id, video, "videos") : "";
      const brandLogoPath = brandLogo ? await uploadProductFile(supabase, user.id, brandLogo, "brands") : "";
      const catalogPath = catalogFile ? await uploadProductFile(supabase, user.id, catalogFile, "catalogs") : "";

      const { data } = await axios.post(
        "/api/product/add",
        {
          name: name.trim(),
          description: description.trim(),
          category,
          subcategory,
          price,
          offerPrice,
          stock,
          imagePaths,
          videoPath,
          catalogPath,
          brandLogoPath,
          specificationsText: specsText,
          model3dUrl: model3dUrl.trim(),
          printerType,
          isOffer,
          isNew,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) throw new Error(data.message || "No se pudo publicar el producto.");
      toast.success(data.message || "Producto publicado.");
      await fetchProductData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-w-0 flex-1 p-3 pb-28 sm:p-5 sm:pb-28 md:p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          className="mb-6"
          eyebrow="Administración · Catálogo"
          title="Añadir producto"
          description="Sigue los pasos para completar la ficha y publicar tu producto."
          actions={(
            <Link href="/seller/product-list" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent">
              Gestionar productos
            </Link>
          )}
        />

        <div className="mb-5 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-ink">Paso {step + 1} de {steps.length}: {steps[step].title}</p>
              <p className="mt-1 text-[11px] text-brand-muted">{steps[step].description}</p>
            </div>
            <span className="rounded-full bg-brand-sand px-3 py-1.5 text-xs font-bold text-brand-accent">{progress}%</span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-brand-sand"
            role="progressbar"
            aria-label="Progreso de creación del producto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-brand-accent transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-4 grid grid-cols-5 gap-1 sm:gap-2">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const completed = index < step;
              const current = index === step;
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    aria-current={current ? "step" : undefined}
                    className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition sm:flex-row sm:gap-2 sm:px-2 ${current ? "bg-brand-accent text-white" : completed ? "bg-brand-sand text-brand-ink" : "text-brand-muted hover:bg-brand-sand/70"}`}
                  >
                    {completed ? <Check size={15} /> : <Icon size={15} />}
                    <span className="text-[9px] font-semibold leading-tight sm:text-[11px]">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <form id="product-wizard-form" onSubmit={handleSubmit} className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-6 md:p-8">
          {step === 0 && (
            <section>
              <StepHeading
                eyebrow="Paso 1 · Fotos y medios"
                title="Muestra tu producto"
                description="Sube de una a tres fotos claras. Puedes incluir un video y el logo de la marca; estos dos últimos son opcionales."
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <label key={index} htmlFor={`product-image-${index}`} className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-line bg-brand-sand/40 p-3 text-center transition hover:border-brand-accent">
                    <input
                      id={`product-image-${index}`}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        handleImageChange(index, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    {imagePreviews[index] ? (
                      <>
                        <Image src={imagePreviews[index]} alt={`Vista previa de imagen ${index + 1}`} fill unoptimized className="object-contain p-3" />
                        <span className="absolute bottom-2 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-brand-ink shadow">{index === 0 ? "Imagen principal · Cambiar" : "Cambiar imagen"}</span>
                      </>
                    ) : (
                      <>
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-accent shadow-sm"><ImagePlus size={22} /></span>
                        <span className="mt-3 text-xs font-semibold text-brand-ink">{index === 0 ? "Foto principal *" : `Foto adicional ${index}`}</span>
                        <span className="mt-1 text-[10px] text-brand-muted">Toca para seleccionar</span>
                      </>
                    )}
                    {processingImage === index && <span className="absolute inset-0 grid place-items-center bg-white/80 text-xs font-semibold text-brand-accent">Optimizando…</span>}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-brand-muted">JPG, PNG o WebP · Máximo 8 MB por imagen. Se optimizan automáticamente.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Video del producto" hint="(opcional, máximo 100 MB)">
                  <label htmlFor="product-video" className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-line p-3 transition hover:border-brand-accent">
                    <input id="product-video" type="file" accept="video/*" className="sr-only" onChange={(event) => setVideo(event.target.files?.[0] || null)} />
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-sand text-brand-accent"><Video size={18} /></span>
                    <span className="min-w-0 truncate text-xs text-brand-muted">{video?.name || "Selecciona un video"}</span>
                  </label>
                  {videoPreview && <video src={videoPreview} controls className="mt-3 aspect-video w-full rounded-xl bg-brand-ink object-contain" />}
                </Field>
                <Field label="Logo de marca" hint="(opcional, máximo 2 MB)">
                  <label htmlFor="product-brand-logo" className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-line p-3 transition hover:border-brand-accent">
                    <input id="product-brand-logo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={async (event) => {
                      const selected = event.target.files?.[0];
                      event.target.value = "";
                      if (!selected) return;
                      if (!selected.type.startsWith("image/") || selected.size > 2 * 1024 * 1024) {
                        toast.error("El logo debe ser una imagen de máximo 2 MB.");
                        return;
                      }
                      setProcessingImage("brand");
                      try {
                        const processed = await processProductImage(selected);
                        if (processed.size > 2 * 1024 * 1024) throw new Error("El logo debe pesar máximo 2 MB después de procesarlo.");
                        setBrandLogo(processed);
                      } catch (error) {
                        toast.error(error.message || "No se pudo procesar el logo.");
                      } finally {
                        setProcessingImage(null);
                      }
                    }} />
                    {brandLogoPreview ? (
                      <Image src={brandLogoPreview} alt="Vista previa del logo" width={80} height={44} unoptimized className="h-11 w-20 rounded-lg bg-brand-sand object-contain p-1" />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-sand text-brand-accent"><ImagePlus size={18} /></span>
                    )}
                    <span className="min-w-0 truncate text-xs text-brand-muted">{processingImage === "brand" ? "Procesando…" : brandLogo?.name || "Selecciona el logo"}</span>
                  </label>
                </Field>
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <StepHeading
                eyebrow="Paso 2 · Información básica"
                title="Cuéntales qué estás vendiendo"
                description="Un nombre claro y una descripción completa ayudan a tus clientes a identificar el producto."
              />
              <div className="grid gap-5">
                <Field label="Nombre del producto *" hint="(máximo 160 caracteres)">
                  <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Impresora industrial de etiquetas" className={inputClass} />
                </Field>
                <Field label="Descripción *" hint="(máximo 5000 caracteres)">
                  <textarea required maxLength={5000} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe sus funciones, ventajas y para quién es ideal…" className={`${inputClass} resize-y`} />
                  <span className="mt-1 block text-right text-[11px] text-brand-muted">{description.length}/5000</span>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Categoría *">
                    <select required value={category} onChange={(event) => {
                      setCategory(event.target.value);
                      setSubcategory("");
                      setPrinterType("");
                    }} className={inputClass}>
                      {categories.map((item) => <option key={item.slug} value={item.slug}>{item.label || item.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Subcategoría" hint="(opcional)">
                    <select value={subcategory} onChange={(event) => {
                      setSubcategory(event.target.value);
                      setPrinterType("");
                    }} className={inputClass}>
                      <option value="">Sin subcategoría</option>
                      {selectedCategory?.subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <StepHeading
                eyebrow="Paso 3 · Precio e inventario"
                title="Define las condiciones de venta"
                description="Revisa los valores con cuidado. El stock debe ser un número entero y el precio de oferta no puede superar el normal."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Precio normal *">
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">{process.env.NEXT_PUBLIC_CURRENCY || "$"}</span>
                    <input required min="0.01" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" className={`${inputClass} pl-11`} />
                  </div>
                </Field>
                <Field label="Precio de oferta" hint="(usa 0 si no aplica)">
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">{process.env.NEXT_PUBLIC_CURRENCY || "$"}</span>
                    <input required min="0" step="0.01" type="number" value={offerPrice} onChange={(event) => setOfferPrice(event.target.value)} placeholder="0.00" className={`${inputClass} pl-11`} />
                  </div>
                </Field>
                <Field label="Unidades disponibles *">
                  <input required min="0" step="1" type="number" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="0" className={`${inputClass} mt-2`} />
                </Field>
                <div className="flex items-center gap-3 rounded-xl bg-brand-sand/70 p-4 text-xs leading-5 text-brand-muted">
                  <BadgeCheck size={20} className="shrink-0 text-brand-accent" />
                  Puedes actualizar el precio y el inventario más adelante desde la lista de productos.
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <StepHeading
                eyebrow="Paso 4 · Detalles adicionales"
                title="Completa la ficha del producto"
                description="Estos datos son opcionales, excepto el tipo de impresora para impresoras de etiquetas."
              />
              <div className="space-y-6">
                {isLabelPrinterSubcategory(category, subcategory) && (
                  <Field label="Tipo de impresora *">
                    <select required value={printerType} onChange={(event) => setPrinterType(event.target.value)} className={`${inputClass} mt-2`}>
                      <option value="">Selecciona un tipo</option>
                      {printerTypes.map((type) => <option key={type.slug} value={type.slug}>{type.name}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Características principales" hint="(una por línea: Nombre: valor)">
                  <textarea rows={5} value={specsText} onChange={(event) => setSpecsText(event.target.value)} placeholder={"Tipo de impresión: Térmica directa\nAncho de impresión: 104 mm\nVelocidad: 152 mm/s"} className={`${inputClass} mt-2 resize-y`} />
                </Field>
                <Field label="Catálogo del producto" hint="(PDF opcional, máximo 25 MB)">
                  <label htmlFor="product-catalog" className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-line p-3 transition hover:border-brand-accent">
                    <input id="product-catalog" type="file" accept="application/pdf" className="sr-only" onChange={(event) => setCatalogFile(event.target.files?.[0] || null)} />
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-sand text-brand-accent"><FileText size={18} /></span>
                    <span className="min-w-0 truncate text-xs text-brand-muted">{catalogFile?.name || "Selecciona el catálogo PDF"}</span>
                  </label>
                </Field>
                <Field label="Enlace a vista 3D" hint="(opcional, URL https)">
                  <input type="url" maxLength={500} value={model3dUrl} onChange={(event) => setModel3dUrl(event.target.value)} placeholder="https://…" className={`${inputClass} mt-2`} />
                </Field>
                <ProductBadgeFields isOffer={isOffer} isNew={isNew} onIsOffer={setIsOffer} onIsNew={setIsNew} />
              </div>
            </section>
          )}

          {step === 4 && (
            <section>
              <StepHeading
                eyebrow="Paso 5 · Revisión final"
                title="Todo listo para publicar"
                description="Revisa la información y vuelve a cualquier paso para corregirla. Al publicar, el producto quedará disponible en tu catálogo."
              />
              <div className="grid gap-5 rounded-2xl bg-brand-sand/60 p-4 sm:grid-cols-[180px_1fr] sm:p-6">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                  {imagePreviews[0] && <Image src={imagePreviews[0]} alt={name} fill unoptimized className="object-contain p-3" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">{selectedCategory?.name}{subcategory ? ` · ${selectedCategory?.subcategories.find((item) => item.slug === subcategory)?.name || ""}` : ""}</p>
                  <h3 className="mt-2 break-words font-display text-xl text-brand-ink sm:text-2xl">{name}</h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-brand-muted">{description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {files.filter(Boolean).map((file, index) => <span key={`${file.name}-${index}`} className="rounded-full bg-white px-3 py-1 text-[10px] text-brand-muted">Foto {index + 1}</span>)}
                    {video && <span className="rounded-full bg-white px-3 py-1 text-[10px] text-brand-muted">Video agregado</span>}
                    {brandLogo && <span className="rounded-full bg-white px-3 py-1 text-[10px] text-brand-muted">Logo agregado</span>}
                    {catalogFile && <span className="rounded-full bg-white px-3 py-1 text-[10px] text-brand-muted">Catálogo PDF</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-brand-line p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Precio normal</p>
                  <p className="mt-1 text-lg font-bold text-brand-ink">{process.env.NEXT_PUBLIC_CURRENCY || "$"}{Number(price || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-brand-line p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Precio de oferta</p>
                  <p className="mt-1 text-lg font-bold text-brand-ink">{Number(offerPrice) > 0 ? `${process.env.NEXT_PUBLIC_CURRENCY || "$"}${Number(offerPrice).toFixed(2)}` : "Sin oferta"}</p>
                </div>
                <div className="rounded-xl border border-brand-line p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Stock</p>
                  <p className="mt-1 text-lg font-bold text-brand-ink">{stock || "0"} unidades</p>
                </div>
              </div>
            </section>
          )}

          <div className="mt-8 hidden items-center justify-between border-t border-brand-line pt-5 sm:flex">
            <button type="button" onClick={() => goToStep(step - 1)} disabled={step === 0 || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-line px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-sand disabled:invisible">
              <ArrowLeft size={17} /> Anterior
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => goToStep(step + 1)} disabled={processingImage !== null || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-50">
                Continuar <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" disabled={saving || processingImage !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-50">
                <PackageCheck size={17} /> {saving ? "Publicando producto…" : "Publicar producto"}
              </button>
            )}
          </div>
        </form>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-line bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(20,35,50,0.08)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => goToStep(step - 1)} disabled={saving} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-xl border border-brand-line px-4 text-sm font-semibold text-brand-ink disabled:opacity-50">
                <ArrowLeft size={17} /> Atrás
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => goToStep(step + 1)} disabled={processingImage !== null || saving} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">
                Continuar <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" form="product-wizard-form" disabled={saving || processingImage !== null} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">
                <PackageCheck size={17} /> {saving ? "Publicando…" : "Publicar producto"}
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
