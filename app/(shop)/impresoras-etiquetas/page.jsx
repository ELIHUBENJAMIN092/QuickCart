"use client";

import { useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import BrandCarousel from "@/components/BrandLogos";
import CategoryHero from "@/components/CategoryHero";
import Loading from "@/components/Loading";
import Container from "@/components/ui/Container";
import { useAppContext } from "@/context/AppContext";
import { getCategoryBySlug, normalizeProductCategory, printerTypes } from "@/lib/categories";

const DESCRIPTION =
  "Impresoras portátiles, de escritorio e industriales para identificar, etiquetar y rastrear en tu operación.";

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

  const category = getCategoryBySlug("codigo-de-barras");
  const heroCategory = { ...category, description: DESCRIPTION };
  const total = grouped.reduce((sum, type) => sum + type.items.length, 0);

  return (
    <main>
      <CategoryHero category={heroCategory} subcategory={{ name: "Impresoras de etiquetas" }} />

      <div id="productos" className="scroll-mt-24">
        {total === 0 && (
          <Container className="py-12">
            <p className="border border-brand-line bg-brand-sand px-5 py-6 text-sm text-brand-muted">
              Próximamente tendremos productos en esta sección.
            </p>
          </Container>
        )}

        {grouped.map((type) => (
          <section
            key={type.slug}
            id={type.slug}
            className="scroll-mt-24 border-b border-brand-line pb-12 pt-8 md:pb-16 md:pt-10"
          >
            <div className="border-y border-brand-line bg-brand-sand">
              <Container className="flex items-end justify-between gap-4 py-6 md:py-8">
                <div>
                  <h2 className="font-display text-2xl leading-none text-brand-ink md:text-4xl">{type.name}</h2>
                  <p className="mt-2 text-sm text-brand-muted">{type.description}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                  {type.items.length} productos
                </span>
              </Container>
            </div>
            <Container>
              {type.items.length ? (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {type.items.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="mt-8 border border-brand-line bg-brand-sand px-5 py-6 text-sm text-brand-muted">
                  Próximamente tendremos modelos en esta categoría.
                </p>
              )}
            </Container>
          </section>
        ))}
      </div>
      <BrandCarousel />
    </main>
  );
}
