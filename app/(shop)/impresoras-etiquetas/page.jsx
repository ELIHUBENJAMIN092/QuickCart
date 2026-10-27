"use client";

import { useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import BrandCarousel from "@/components/BrandLogos";
import Loading from "@/components/Loading";
import Container from "@/components/ui/Container";
import { useAppContext } from "@/context/AppContext";
import { normalizeProductCategory, printerTypes } from "@/lib/categories";

export default function LabelPrintersPage() {
  const { products } = useAppContext();

  const grouped = useMemo(() => {
    const printers = products.filter((product) => {
      const { category, subcategory } = normalizeProductCategory(product.category, product.subcategory);
      return category === "codigo-de-barras" && subcategory === "impresoras-etiquetas";
    });
    return printerTypes.map((type) => ({
      ...type,
      items: printers.filter((product) => product.printer_type === type.slug),
    }));
  }, [products]);

  if (!products.length) return <Loading />;

  return (
    <main>
      <div className="border-b border-brand-line bg-brand-sand">
        <Container className="py-8 md:py-10">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-xs text-brand-muted">
            <Link href="/" className="hover:text-brand-accent">Inicio</Link><span>»</span>
            <Link href="/all-products?category=codigo-de-barras" className="hover:text-brand-accent">Código de Barras</Link><span>»</span>
            <span className="text-brand-ink">Impresoras de etiquetas</span>
          </nav>
          <h1 className="font-display text-3xl leading-[0.96] text-brand-ink md:text-5xl">Impresoras de etiquetas</h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-muted md:text-base">Impresoras portátiles, de escritorio e industriales para identificar, etiquetar y rastrear en tu operación.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {grouped.map((type) => (
              <a key={type.slug} href={`#${type.slug}`} className="inline-flex items-center gap-2 border border-brand-line bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-ink transition hover:border-brand-ink hover:bg-brand-ink hover:text-white">
                {type.name}
              </a>
            ))}
          </div>
        </Container>
      </div>

      {grouped.map((type) => (
        <section key={type.slug} id={type.slug} className="scroll-mt-20 pb-10 md:pb-14">
          <div className="border-y border-brand-line bg-brand-sand">
            <Container className="py-5 md:py-6">
              <h2 className="font-display text-2xl text-brand-ink md:text-3xl">{type.name}</h2>
              <p className="mt-1 text-sm text-brand-muted">{type.description}</p>
            </Container>
          </div>
          <Container>
            {type.items.length ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {type.items.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            ) : (
              <p className="mt-8 border border-brand-line bg-brand-sand px-5 py-6 text-sm text-brand-muted">Próximamente tendremos modelos en esta categoría.</p>
            )}
          </Container>
        </section>
      ))}
      <BrandCarousel />
    </main>
  );
}
