"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, Box, ChevronLeft, ChevronRight, Play, FileText, Headset, Minus, Plus, Truck, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import BrandCarousel from "@/components/BrandLogos";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { getCategoryBySlug, getCategoryName, getSubcategoryName } from "@/lib/categories";
import Price from "@/components/ui/Price";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function ProductPage() {
  const { id } = useParams();
  const { products, addToCart, user, currency, router } = useAppContext();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [show3d, setShow3d] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const product = useMemo(() => products.find((item) => item._id === id), [id, products]);
  const related = useMemo(
    () => products.filter((item) => item._id !== id && item.category === product?.category).slice(0, 4),
    [id, product, products]
  );

  useEffect(() => {
    setSelectedImage(0);
    setShowVideo(false);
    setQuantity(1);
    setShow3d(false);
    setCatalogOpen(false);
  }, [id]);

  if (!product) {
    if (!products.length) return <Loading />;
    return (
      <>
        <Container className="py-32 text-center">
          <h1 className="font-display text-3xl text-brand-ink">No encontramos este producto.</h1>
          <Link href="/all-products" className="mt-5 inline-block text-sm text-brand-accent underline">Volver al catálogo</Link>
        </Container>
      </>
    );
  }

  const imageCount = product.image?.length || 0;
  const mediaCount = imageCount + (product.video ? 1 : 0);
  const currentMedia = showVideo ? imageCount : selectedImage;
  const goToMedia = (index) => {
    const next = (index + mediaCount) % mediaCount;
    if (product.video && next === imageCount) setShowVideo(true);
    else { setShowVideo(false); setSelectedImage(next); }
  };
  const stock = Number(product.stock || 0);
  const category = getCategoryBySlug(product.category);
  const categoryLink = category
    ? `/all-products?category=${category.slug}${product.subcategory ? `/${product.subcategory}` : ""}`
    : `/all-products?category=${encodeURIComponent(product.category || "")}`;
  const addProduct = async (buyNow = false) => {
    if (stock <= 0 || quantity > stock) return;
    await addToCart(product._id, quantity);
    if (buyNow && user) router.push("/cart");
  };

  return (
    <>
      <main>
        <Container className="py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-xs text-brand-muted">
            <Link href="/" className="hover:text-brand-accent">Inicio</Link><span>/</span>
            <Link href={categoryLink} className="hover:text-brand-accent">{getCategoryName(product.category)}</Link>
            {product.subcategory && <><span>/</span><span>{getSubcategoryName(product.category, product.subcategory)}</span></>}
            <span>/</span><span className="text-brand-ink">{product.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <div className="relative aspect-square overflow-hidden bg-white">
                {showVideo && product.video ? (
                  <video src={product.video} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                ) : product.image?.[selectedImage] ? (
                  <Image src={product.image[selectedImage]} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-7 md:p-12" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-brand-muted">Imagen no disponible</div>
                )}
                {product.is_offer === true && <Badge variant="sale" className="absolute left-4 top-4">Oferta</Badge>}
                {product.is_offer !== true && product.is_new === true && <Badge variant="new" className="absolute left-4 top-4">Nuevo</Badge>}
                {mediaCount > 1 && (
                  <>
                    <button onClick={() => goToMedia(currentMedia - 1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-line bg-white/90 p-2 text-brand-ink shadow transition hover:bg-white"><ChevronLeft size={20} /></button>
                    <button onClick={() => goToMedia(currentMedia + 1)} aria-label="Siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-line bg-white/90 p-2 text-brand-ink shadow transition hover:bg-white"><ChevronRight size={20} /></button>
                  </>
                )}
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {product.image?.map((image, index) => (
                  <button key={`${image}-${index}`} onClick={() => { setSelectedImage(index); setShowVideo(false); }} className={`relative box-border block h-24 w-24 shrink-0 overflow-hidden border-2 bg-white ${selectedImage === index && !showVideo ? "border-brand-accent" : "border-brand-line"}`} aria-label={`Ver imagen ${index + 1}`}>
                    <Image src={image} alt="" fill sizes="96px" className="object-contain p-2" />
                  </button>
                ))}
                {product.video && (
                  <button onClick={() => setShowVideo(true)} aria-label="Reproducir video" className={`relative box-border block h-24 w-24 shrink-0 overflow-hidden border-2 bg-brand-ink ${showVideo ? "border-brand-accent" : "border-brand-line"}`}>
                    <video src={`${product.video}#t=0.5`} preload="metadata" muted playsInline tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-black/30"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-ink"><Play size={14} fill="currentColor" /></span></span>
                  </button>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{getCategoryName(product.category)}{product.subcategory ? ` · ${getSubcategoryName(product.category, product.subcategory)}` : ""}</p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-brand-ink md:text-5xl">{product.name}</h1>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Price price={product.price} offerPrice={product.offerPrice} currency={currency} className="text-2xl" />
                <span className={`text-xs font-semibold ${stock > 0 ? "text-brand-success" : "text-brand-sale"}`}>{stock > 0 ? `Disponible · ${stock} en stock` : "Agotado"}</span>
              </div>
              <p className="mt-6 whitespace-pre-line text-sm leading-7 text-brand-charcoal">{product.description}</p>

              <div className="mt-8 flex items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-brand-line">
                  <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="p-3 text-brand-ink disabled:opacity-40" aria-label="Disminuir cantidad"><Minus size={15} /></button>
                  <span className="min-w-8 text-center text-sm">{quantity}</span>
                  <button onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))} disabled={quantity >= stock} className="p-3 text-brand-ink disabled:opacity-40" aria-label="Aumentar cantidad"><Plus size={15} /></button>
                </div>
                <span className="text-xs text-brand-muted">{stock > 0 ? "Cantidad" : "Sin disponibilidad"}</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button onClick={() => addProduct()} disabled={stock <= 0} className="rounded-full bg-brand-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50">Añadir al carrito</button>
                <button onClick={() => addProduct(true)} disabled={stock <= 0} className="rounded-full border border-brand-ink px-6 py-3.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50">Comprar ahora</button>
              </div>

              {(product.model_3d_url || product.catalog_pdf) && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {product.model_3d_url && (
                    <button onClick={() => setShow3d(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-line px-6 py-3 text-sm font-semibold text-brand-accent transition hover:border-brand-accent"><Box size={16} /> Ver en 3D</button>
                  )}
                  {product.catalog_pdf && (
                    <button onClick={() => setCatalogOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-line px-6 py-3 text-sm font-semibold text-brand-accent transition hover:border-brand-accent"><FileText size={16} /> Ver catálogo</button>
                  )}
                </div>
              )}

              <div className="mt-8 grid grid-cols-3 gap-3 border-y border-brand-line py-5">
                <div className="text-center"><Truck className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Envíos a nivel nacional</p></div>
                <div className="text-center"><BadgeCheck className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Garantía y respaldo</p></div>
                <div className="text-center"><Headset className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Soporte especializado</p></div>
              </div>

              <div className="mt-5 divide-y divide-brand-line border-y border-brand-line">
                <details open className="py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-ink">Especificaciones</summary>
                  <dl className="grid grid-cols-2 gap-3 pt-3 text-sm"><dt className="text-brand-muted">Categoría</dt><dd>{getCategoryName(product.category)}</dd>{product.subcategory && <><dt className="text-brand-muted">Subcategoría</dt><dd>{getSubcategoryName(product.category, product.subcategory)}</dd></>}</dl>
                  {product.specifications?.map((section, index) => (
                    <div key={`${section.title}-${index}`} className="mt-5">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink">{section.title}</h3>
                      {section.rows ? (
                        <dl className="divide-y divide-brand-line border-y border-brand-line text-sm">
                          {section.rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-[2fr_3fr] gap-3 py-2">
                              <dt className="text-brand-muted">{row.label}</dt>
                              <dd className="text-brand-charcoal">{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-brand-charcoal">
                          {section.items?.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </details>
              </div>
            </div>
          </div>

          {catalogOpen && product.catalog_pdf && (
            <div role="dialog" aria-modal="true" aria-label={`Catálogo de ${product.name}`} className="fixed inset-0 z-[100] flex flex-col bg-black/70 p-3 md:p-8" onClick={() => setCatalogOpen(false)}>
              <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-3">
                  <p className="truncate text-sm font-semibold text-brand-ink">{product.name} · Catálogo</p>
                  <div className="flex items-center gap-4">
                    <a href={product.catalog_pdf} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent underline">Abrir / descargar</a>
                    <button onClick={() => setCatalogOpen(false)} aria-label="Cerrar catálogo" className="p-1 text-brand-ink"><X size={20} /></button>
                  </div>
                </div>
                <iframe src={product.catalog_pdf} title={`Catálogo de ${product.name}`} className="w-full flex-1 border-0" />
              </div>
            </div>
          )}

          {show3d && product.model_3d_url && (
            <div role="dialog" aria-modal="true" aria-label={`Vista 3D de ${product.name}`} className="fixed inset-0 z-[100] flex flex-col bg-black/70 p-3 md:p-8" onClick={() => setShow3d(false)}>
              <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-3">
                  <p className="truncate text-sm font-semibold text-brand-ink">{product.name} · Vista 3D</p>
                  <div className="flex items-center gap-4">
                    <a href={product.model_3d_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent underline">Abrir en pestaña nueva</a>
                    <button onClick={() => setShow3d(false)} aria-label="Cerrar vista 3D" className="p-1 text-brand-ink"><X size={20} /></button>
                  </div>
                </div>
                <iframe src={product.model_3d_url} title={`Vista 3D de ${product.name}`} allow="fullscreen; xr-spatial-tracking" allowFullScreen className="w-full flex-1 border-0" />
              </div>
            </div>
          )}

          {related.length > 0 && (
            <section className="pt-20">
              <SectionHeading eyebrow="Completa tu solución" title="También te puede interesar." />
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{related.map((item) => <ProductCard key={item._id} product={item} />)}</div>
            </section>
          )}
        </Container>
        <BrandCarousel />
      </main>
    </>
  );
}
