"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/categories";
import { useAppContext } from "@/context/AppContext";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function FeaturedProduct() {
  const { categoriesLoaded } = useAppContext();
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Soluciones COMPEL"
          title="Encuentra la tecnología adecuada."
          description="Explora nuestras áreas de especialidad y encuentra equipos que hacen más eficiente cada proceso."
          link={<Link href="/all-products" className="text-sm font-semibold text-brand-accent hover:underline">Ver todo el catálogo <span aria-hidden="true">→</span></Link>}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categoria/${category.slug}`}
              className="group"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-line bg-brand-sand">
                {categoriesLoaded && (category.image_url || category.image) && <Image src={category.image_url || category.image} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/65 via-transparent to-transparent" />
                <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-brand-cream text-brand-ink transition group-hover:bg-brand-accent group-hover:text-white"><ArrowUpRight size={18} /></span>
              </div>
              <h3 className="mt-4 font-display text-2xl text-brand-ink">{category.name}</h3>
              <p className="mt-1 text-xs leading-5 text-brand-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
