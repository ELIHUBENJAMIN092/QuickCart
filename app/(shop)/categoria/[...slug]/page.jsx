"use client";

import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import BrandCarousel from "@/components/BrandLogos";
import CategoryHero from "@/components/CategoryHero";
import Loading from "@/components/Loading";
import Container from "@/components/ui/Container";
import { useAppContext } from "@/context/AppContext";
import { getCategoryBySlug, normalizeProductCategory } from "@/lib/categories";

export default function CategoryPage() {
  const { slug = [] } = useParams();
  const [categorySlug, subSlug] = slug;
  const { products } = useAppContext();
  const category = getCategoryBySlug(categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subSlug);
  if (!category || (subSlug && !subcategory)) notFound();

  const sections = useMemo(() => {
    const inCategory = products
      .map((product) => ({ product, ...normalizeProductCategory(product.category, product.subcategory) }))
      .filter((entry) => entry.category === category.slug);
    const pick = (slugs) => inCategory.filter((entry) => slugs.includes(entry.subcategory)).map((entry) => entry.product);

    if (subcategory) {
      const children = category.subcategories.filter((item) => item.parent === subcategory.slug);
      if (!children.length) return [{ slug: subcategory.slug, name: subcategory.name, items: pick([subcategory.slug]), single: true }];
      const own = pick([subcategory.slug]);
      return [
        ...(own.length ? [{ slug: subcategory.slug, name: subcategory.name, items: own }] : []),
        ...children.map((child) => ({ slug: child.slug, name: child.name, items: pick([child.slug]) })),
      ];
    }
    const top = category.subcategories.filter((item) => !item.parent);
    const known = category.subcategories.map((item) => item.slug);
    const result = top.map((item) => {
      const slugs = [item.slug, ...category.subcategories.filter((child) => child.parent === item.slug).map((child) => child.slug)];
      return { slug: item.slug, name: item.name, items: pick(slugs) };
    }).filter((section) => section.items.length);
    const others = inCategory.filter((entry) => !known.includes(entry.subcategory)).map((entry) => entry.product);
    return others.length ? [...result, { slug: "otros", name: "Otros productos", items: others }] : result;
  }, [products, category, subcategory]);

  if (!products.length) return <Loading />;

  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <main>
      <CategoryHero category={category} subcategory={subcategory} />

      <div id="productos" className="scroll-mt-24">
        {sections.length > 1 && (
          <div className="border-b border-brand-line bg-white">
            <Container className="flex flex-wrap gap-2 py-5">
              {sections.map((section) => (
                <a key={section.slug} href={`#${section.slug}`} className="inline-flex items-center border border-brand-line bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-ink transition hover:border-brand-ink hover:bg-brand-ink hover:text-white">{section.name}</a>
              ))}
            </Container>
          </div>
        )}

        {total === 0 && (
          <Container className="py-12">
            <p className="border border-brand-line bg-brand-sand px-5 py-6 text-sm text-brand-muted">Próximamente tendremos productos en esta sección.</p>
          </Container>
        )}

        {sections.map((section) => (
          <section key={section.slug} id={section.slug} className="scroll-mt-24 border-b border-brand-line pb-12 pt-8 md:pb-16 md:pt-10">
            {!section.single && (
              <div className="border-y border-brand-line bg-brand-sand">
                <Container className="flex items-end justify-between gap-4 py-6 md:py-8">
                  <h2 className="font-display text-2xl leading-none text-brand-ink md:text-4xl">{section.name}</h2>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">{section.items.length} productos</span>
                </Container>
              </div>
            )}
            <Container>
              {section.items.length ? (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {section.items.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
              ) : (
                !section.single && <p className="mt-8 border border-brand-line bg-brand-sand px-5 py-6 text-sm text-brand-muted">Próximamente tendremos modelos en esta categoría.</p>
              )}
            </Container>
          </section>
        ))}
      </div>
      <BrandCarousel />
    </main>
  );
}
