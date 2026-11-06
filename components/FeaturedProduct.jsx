"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronsRight } from "lucide-react";
import { categories } from "@/lib/categories";
import { useAppContext } from "@/context/AppContext";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function FeaturedProduct() {
  const { categoriesLoaded } = useAppContext();

  return (
    <section className="bg-brand-sand/50 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Soluciones COMPEL"
          title="Encuentra la tecnología adecuada."
          description="Explora nuestras áreas de especialidad y encuentra equipos que hacen más eficiente cada proceso."
          link={<Link href="/all-products" className="text-brand-accent transition hover:text-brand-ink">Ver todo el catálogo <span aria-hidden="true">→</span></Link>}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const cover = category.image_url || category.image || category.hero?.image_url;
            return (
              <Link
                key={category.slug}
                href={`/categoria/${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-ink/10"
              >
                <div className="relative aspect-square overflow-hidden bg-brand-sand/40">
                  {categoriesLoaded && cover && (
                    <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl leading-tight text-brand-ink transition group-hover:text-brand-accent md:text-2xl">{category.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-brand-muted">{category.description}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                    Ver productos <ChevronsRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
