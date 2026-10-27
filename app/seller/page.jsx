'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import axios from "axios";
import toast from "react-hot-toast";
import { categories } from "@/lib/categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { processProductImage } from "@/lib/imageOptimize";
import ProductExtraFields, { ProductBadgeFields, validateCatalogFile } from "@/components/seller/ProductExtraFields";

const inputClass = "w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent";

const AddProduct = () => {

  const { getToken, fetchProductData, user } = useAppContext()

  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0].slug);
  const [subcategory, setSubcategory] = useState('');

  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  // 🔥 NUEVO STOCK
  const [stock, setStock] = useState('');
  const [processingImage, setProcessingImage] = useState(null);
  const [isOffer, setIsOffer] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [catalogFile, setCatalogFile] = useState(null);
  const [brandLogo, setBrandLogo] = useState(null);
  const [model3dUrl, setModel3dUrl] = useState('');
  const [printerType, setPrinterType] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [saving, setSaving] = useState(false);

  // ENVIAR PRODUCTO
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (Number(offerPrice) > Number(price)) {
      toast.error("El precio de oferta no puede superar el precio normal.");
      return;
    }
    const selectedImages = files.filter(Boolean);
    if (selectedImages.length === 0 || selectedImages.length > 3) {
      toast.error("Añade entre 1 y 3 imágenes del producto.");
      return;
    }
    if (selectedImages.some((file) => !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)) {
      toast.error("Cada imagen debe ser válida y pesar máximo 8 MB.");
      return;
    }
    if (video && (!video.type.startsWith("video/") || video.size > 100 * 1024 * 1024)) {
      toast.error("El video debe ser válido y pesar máximo 100 MB.");
      return;
    }
    if (!validateCatalogFile(catalogFile)) {
      toast.error("El catálogo debe ser un PDF de máximo 25 MB.");
      return;
    }

    setSaving(true);
    try {

      const token = await getToken()
      if (!token || !user) {
        toast.error("Inicia sesión como vendedor para agregar productos.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const imagePaths = await Promise.all(
        selectedImages.map((file) => uploadProductFile(supabase, user.id, file, "images"))
      );
      const videoPath = video
        ? await uploadProductFile(supabase, user.id, video, "videos")
        : "";
      const brandLogoPath = brandLogo
        ? await uploadProductFile(supabase, user.id, brandLogo, "brands")
        : "";
      const catalogPath = catalogFile
        ? await uploadProductFile(supabase, user.id, catalogFile, "catalogs")
        : "";

      const { data } = await axios.post(
        '/api/product/add',
        { name, description, category, subcategory, price, offerPrice, stock, imagePaths, videoPath, catalogPath, brandLogoPath, specificationsText: specsText, model3dUrl, printerType, isOffer, isNew },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        toast.success(data.message)
        fetchProductData()

        // LIMPIAR FORMULARIO
        setFiles([])
        setVideo(null)

        setName('')
        setDescription('')
        setCategory(categories[0].slug)
        setSubcategory('')

        setPrice('')
        setOfferPrice('')

        // 🔥 LIMPIAR STOCK
        setStock('')
        setCatalogFile(null)
        setBrandLogo(null)
        setIsOffer(false)
        setIsNew(false)
        setModel3dUrl('')
        setPrinterType('')
        setSpecsText('')

      } else {

        toast.error(data.message)

      }

    } catch (error) {

      toast.error(error.message)

    } finally {
    setSaving(false)
    }

  };

  return (

    <main className="flex-1 p-4 md:p-8">

      <div className="mx-auto max-w-5xl">
        <PageHeader
          className="mb-7"
          eyebrow="Administración · Catálogo"
          title="Añadir producto"
          description="Completa los datos para publicar un nuevo artículo en la tienda."
          actions={(
            <Link href="/seller/product-list" className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-5 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent">
              Gestionar productos
            </Link>
          )}
        />

      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-8"
      >
        {/* IMÁGENES */}
        <section className="border-t border-brand-line pt-6">

          <p className="text-sm font-semibold text-brand-ink">Imágenes del producto</p>
          <p className="mt-1 text-xs text-brand-muted">Añade entre 1 y 3 imágenes, máximo 8 MB por imagen, más un video opcional. Se optimizan automáticamente y, si el fondo es blanco, se quita y se guarda como PNG transparente.</p>

          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(3)].map((_, index) => (

              <label key={index} htmlFor={`image${index}`}>

                <input
                  onChange={(e) => {

                    const selected = e.target.files[0];
                    if (!selected) return;

                    setProcessingImage(index);
                    processProductImage(selected)
                      .then((processed) => setFiles((current) => {
                        const updatedFiles = [...current];
                        updatedFiles[index] = processed;
                        return updatedFiles;
                      }))
                      .finally(() => setProcessingImage(null));

                  }}
                  type="file"
                  accept="image/*"
                  id={`image${index}`}
                  hidden
                />

                <Image
                  className="max-w-24 cursor-pointer rounded border bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:12px_12px]"
                  src={
                    files[index]
                      ? URL.createObjectURL(files[index])
                      : assets.upload_area
                  }
                  alt={files[index]?.name || "Seleccionar imagen"}
                  width={100}
                  height={100}
                />

              </label>

            ))}

          </div>

        </section>

        {/* VIDEO */}
        <section className="border-t border-brand-line pt-6">

          <p className="text-sm font-semibold text-brand-ink">Video del producto <span className="font-normal text-brand-muted">(opcional, máximo 100 MB)</span></p>

          <label htmlFor="videoUpload">

            <input
              type="file"
              id="videoUpload"
              accept="video/*"
              hidden
              onChange={(e) =>
                setVideo(e.target.files[0])
              }
            />

            <div className="mt-3 flex h-24 w-52 items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-line bg-brand-cream">

              {video ? (

                <video
                  src={URL.createObjectURL(video)}
                  className="w-full h-full object-cover rounded"
                />

              ) : (

                <span className="text-xs text-brand-muted">Seleccionar video</span>

              )}

            </div>
            {video && <p className="mt-2 text-xs text-brand-muted">{video.name}</p>}

          </label>

        </section>

        {/* MARCA */}
        <section className="border-t border-brand-line pt-6">
          <p className="text-sm font-semibold text-brand-ink">Logo de la marca <span className="font-normal text-brand-muted">(opcional, máximo 2 MB)</span></p>
          <label htmlFor="brandLogoUpload" className="mt-3 flex h-20 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-line bg-brand-cream">
            <input
              type="file"
              id="brandLogoUpload"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              onChange={async (e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (!file) return setBrandLogo(null);
                setProcessingImage('brand');
                try { setBrandLogo(await processProductImage(file)); } finally { setProcessingImage(null); }
              }}
            />
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(brandLogo)} alt="Logo de la marca" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-xs text-brand-muted">{processingImage === 'brand' ? 'Procesando...' : 'Seleccionar logo'}</span>
            )}
          </label>
        </section>

        {/* NOMBRE */}
        <label htmlFor="product-name" className="flex max-w-3xl flex-col gap-2 text-xs font-medium text-brand-charcoal">
          Nombre del producto

          <input
            id="product-name"
            type="text"
            placeholder="Ingresar nombre"
            className={inputClass}
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />

        </label>

        {/* DESCRIPCIÓN */}
        <label htmlFor="product-description" className="flex max-w-3xl flex-col gap-2 text-xs font-medium text-brand-charcoal">
          Descripción del producto

          <textarea
            id="product-description"
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Ingresar descripción"
            onChange={(e) =>
              setDescription(e.target.value)
            }
            value={description}
            required
          ></textarea>
        </label>

        {/* CATEGORÍA + PRECIOS + STOCK */}
        <section className="grid gap-4 border-t border-brand-line pt-6 sm:grid-cols-2 xl:grid-cols-5">

          {/* CATEGORÍA */}
          <label htmlFor="category" className="flex flex-col gap-2 text-xs font-medium text-brand-charcoal">
            Categoría principal

            <select
              id="category"
              className={inputClass}
              onChange={(e) => {
                setCategory(e.target.value)
                setSubcategory('')
              }}
              value={category}
            >

              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.label || item.name}</option>
              ))}

            </select>

          </label>

          <label className="flex flex-col gap-2 text-xs font-medium text-brand-charcoal">
            <span>Subcategoría</span>
            <select id="subcategory" value={subcategory} onChange={(e) => { setSubcategory(e.target.value); setPrinterType('') }} className={inputClass}>
              <option value="">Sin subcategoría</option>
              {categories.find((item) => item.slug === category)?.subcategories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>

          {/* PRECIO */}
          <label htmlFor="product-price" className="flex flex-col gap-2 text-xs font-medium text-brand-charcoal">
            Precio normal

            <input
              id="product-price"
              type="number"
              placeholder="0"
              className={inputClass}
              min="0.01"
              step="0.01"
              onChange={(e) =>
                setPrice(e.target.value)
              }
              value={price}
              required
            />

          </label>

          {/* PRECIO OFERTA */}
          <label htmlFor="offer-price" className="flex flex-col gap-2 text-xs font-medium text-brand-charcoal">
            Precio de oferta

            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className={inputClass}
              min="0"
              step="0.01"
              onChange={(e) =>
                setOfferPrice(e.target.value)
              }
              value={offerPrice}
              required
            />

          </label>

          {/* 🔥 STOCK */}
          <label htmlFor="stock" className="flex flex-col gap-2 text-xs font-medium text-brand-charcoal">
            Unidades en stock

            <input
              id="stock"
              type="number"
              placeholder="0"
              className={inputClass}
              min="0"
              step="1"
              onChange={(e) =>
                setStock(e.target.value)
              }
              value={stock}
              required
            />

          </label>

        </section>

        <ProductBadgeFields isOffer={isOffer} isNew={isNew} onIsOffer={setIsOffer} onIsNew={setIsNew} />

        <ProductExtraFields
          category={category}
          subcategory={subcategory}
          printerType={printerType}
          onPrinterType={setPrinterType}
          model3dUrl={model3dUrl}
          onModel3dUrl={setModel3dUrl}
          catalogFile={catalogFile}
          onCatalogFile={setCatalogFile}
          specsText={specsText}
          onSpecsText={setSpecsText}
        />

        <div className="border-t border-brand-line pt-6">
          <button type="submit" disabled={saving || processingImage !== null} className="w-full rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60 sm:w-auto">
            {saving ? "Publicando..." : "Publicar producto"}
          </button>
        </div>

      </form>
      </div>

    </main>
  );
};

export default AddProduct;