"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, Headset, Minus, Plus, Truck } from "lucide-react";
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

  const product = useMemo(() => products.find((item) => item._id === id), [id, products]);
  const related = useMemo(
    () => products.filter((item) => item._id !== id && item.category === product?.category).slice(0, 4),
    [id, product, products]
  );

  useEffect(() => {
    setSelectedImage(0);
    setShowVideo(false);
    setQuantity(1);
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
            <div>
              <div className="relative aspect-square overflow-hidden bg-white">
                {showVideo && product.video ? (
                  <video src={product.video} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                ) : product.image?.[selectedImage] ? (
                  <Image src={product.image[selectedImage]} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-7 md:p-12" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-brand-muted">Imagen no disponible</div>
                )}
                {Number(product.offerPrice) < Number(product.price) && <Badge variant="sale" className="absolute left-4 top-4">Oferta</Badge>}
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {product.image?.map((image, index) => (
                  <button key={`${image}-${index}`} onClick={() => { setSelectedImage(index); setShowVideo(false); }} className={`relative h-20 w-20 shrink-0 overflow-hidden border bg-white ${selectedImage === index && !showVideo ? "border-brand-accent" : "border-brand-line"}`} aria-label={`Ver imagen ${index + 1}`}>
                    <Image src={image} alt="" fill sizes="80px" className="object-contain p-2" />
                  </button>
                ))}
                {product.video && <button onClick={() => setShowVideo(true)} className={`grid h-20 w-20 shrink-0 place-items-center border text-xs ${showVideo ? "border-brand-accent bg-brand-sand" : "border-brand-line bg-white"}`}>Ver video</button>}
              </div>
            </div>

            <div className="lg:py-4">
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

              <div className="mt-8 grid grid-cols-3 gap-3 border-y border-brand-line py-5">
                <div className="text-center"><Truck className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Envíos a nivel nacional</p></div>
                <div className="text-center"><BadgeCheck className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Garantía y respaldo</p></div>
                <div className="text-center"><Headset className="mx-auto mb-2 text-brand-accent" size={20} /><p className="text-[10px] leading-4 text-brand-muted">Soporte especializado</p></div>
              </div>

              <div className="mt-5 divide-y divide-brand-line border-y border-brand-line">
                <details open className="py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-ink">Descripción</summary>
                  <p className="pt-3 text-sm leading-6 text-brand-muted">{product.description}</p>
                </details>
                <details className="py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-ink">Especificaciones</summary>
                  <dl className="grid grid-cols-2 gap-3 pt-3 text-sm"><dt className="text-brand-muted">Categoría</dt><dd>{getCategoryName(product.category)}</dd>{product.subcategory && <><dt className="text-brand-muted">Subcategoría</dt><dd>{product.subcategory}</dd></>}</dl>
                </details>
                <details className="py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-ink">Envíos y devoluciones</summary>
                  <p className="pt-3 text-sm leading-6 text-brand-muted">Contáctanos para coordinar la entrega y recibir información sobre garantía y soporte para este producto.</p>
                </details>
              </div>
            </div>
          </div>

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
