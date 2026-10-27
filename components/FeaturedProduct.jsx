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
          link={<Link href="/all-products" className="text-brand-accent transition hover:text-brand-ink">Ver todo el catálogo <span aria-hidden="true">→</span></Link>}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const cover = category.image_url || category.image || category.hero?.image_url;
            return (
              <Link key={category.slug} href={`/categoria/${category.slug}`} className={`group flex flex-col ${index === 0 || index === 4 ? "sm:col-span-2" : ""}`}>
                <div className={`relative overflow-hidden border border-brand-line bg-brand-sand ${index === 0 || index === 4 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                  {categoriesLoaded && cover && <Image src={cover} alt="" fill sizes={index === 0 || index === 4 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-700 group-hover:scale-[1.03]" />}
                  <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center bg-white text-brand-ink transition group-hover:bg-brand-accent group-hover:text-white"><ArrowUpRight size={18} /></span>
                  <span className="absolute bottom-4 left-4 bg-brand-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">0{index + 1}</span>
                </div>
                <div className="flex flex-1 flex-col border-x border-b border-brand-line p-5">
                  <h3 className="font-display text-2xl leading-tight text-brand-ink transition group-hover:text-brand-accent">{category.name}</h3>
                  <p className="mt-2 text-xs leading-6 text-brand-muted">{category.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
