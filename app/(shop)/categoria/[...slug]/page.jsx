"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import BrandCarousel from "@/components/BrandLogos";
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

  const title = subcategory ? subcategory.name : category.name;
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <main>
      <div className="bg-gray-100">
        <Container className="py-8 md:py-10">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-xs text-brand-muted">
            <Link href="/" className="hover:text-brand-accent">Inicio</Link><span>»</span>
            {subcategory ? (
              <>
                <Link href={`/categoria/${category.slug}`} className="hover:text-brand-accent">{category.name}</Link><span>»</span>
                <span className="text-brand-ink">{subcategory.name}</span>
              </>
            ) : (
              <span className="text-brand-ink">{category.name}</span>
            )}
          </nav>
          <h1 className="font-display text-3xl font-semibold text-brand-ink md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-muted md:text-base">{category.description}</p>
          {sections.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {sections.map((section) => (
                <a key={section.slug} href={`#${section.slug}`} className="inline-flex items-center rounded-md border border-brand-line bg-white px-4 py-2.5 text-sm font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent">{section.name}</a>
              ))}
            </div>
          )}
        </Container>
      </div>

      {total === 0 && (
        <Container className="py-10">
          <p className="rounded-lg bg-gray-100 px-5 py-6 text-sm text-brand-muted">Próximamente tendremos productos en esta sección.</p>
        </Container>
      )}

      {sections.map((section) => (
        <section key={section.slug} id={section.slug} className="scroll-mt-20 pb-10 md:pb-14">
          {!section.single && (
            <div className="bg-slate-200">
              <Container className="py-5 md:py-6">
                <h2 className="font-display text-2xl font-semibold text-brand-ink md:text-3xl">{section.name}</h2>
              </Container>
            </div>
          )}
          <Container>
            {section.items.length ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {section.items.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            ) : (
              !section.single && <p className="mt-8 rounded-lg bg-gray-100 px-5 py-6 text-sm text-brand-muted">Próximamente tendremos modelos en esta categoría.</p>
            )}
          </Container>
        </section>
      ))}
      <BrandCarousel />
    </main>
  );
}
