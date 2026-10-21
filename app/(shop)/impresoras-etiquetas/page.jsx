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
      <Container className="py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-xs text-brand-muted">
          <Link href="/" className="hover:text-brand-accent">Inicio</Link><span>/</span>
          <Link href="/all-products?category=codigo-de-barras" className="hover:text-brand-accent">Código de Barras</Link><span>/</span>
          <span className="text-brand-ink">Impresoras de etiquetas</span>
        </nav>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Código de barras</p>
        <h1 className="mt-3 font-display text-3xl text-brand-ink md:text-5xl">Impresoras de etiquetas</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          {grouped.map((type) => (
            <a key={type.slug} href={`#${type.slug}`} className="rounded-full border border-brand-line px-5 py-2.5 text-sm font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent">
              {type.name} <span className="text-brand-muted">({type.items.length})</span>
            </a>
          ))}
        </div>
      </Container>

      {grouped.map((type, i) => (
        <section key={type.slug} id={type.slug} className={`scroll-mt-20 border-t-2 border-brand-ink/80 py-12 md:py-16 ${i === 1 ? "bg-sky-50" : "bg-white"}`}>
          <Container>
            <div className="border-b border-brand-line pb-5">
              <h2 className="font-display text-2xl text-brand-ink md:text-4xl">{type.name}</h2>
              <p className="mt-2 text-sm text-brand-muted">{type.description}</p>
            </div>
            {type.items.length ? (
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {type.items.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            ) : (
              <p className="mt-6 rounded-lg bg-brand-sand px-5 py-6 text-sm text-brand-muted">Próximamente tendremos modelos en esta categoría.</p>
            )}
          </Container>
        </section>
      ))}
      <BrandCarousel />
    </main>
  );
}
