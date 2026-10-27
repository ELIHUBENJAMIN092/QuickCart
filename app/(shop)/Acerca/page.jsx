"use client";

import Image from "next/image";
import Link from "next/link";
import BrandCarousel from "@/components/BrandLogos";
import { assets } from "@/assets/assets";
import Container from "@/components/ui/Container";

export default function AboutPage() {
  return (
    <>
      <main>
        <section className="bg-brand-sand">
          <Container className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Quiénes somos</p>
              <h1 className="mt-4 font-display text-4xl leading-[0.94] text-brand-ink md:text-6xl">Tecnología que impulsa negocios.</h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-brand-charcoal">En COMPEL nos especializamos en soluciones profesionales de identificación, captura de datos e impresión. Acompañamos a empresas en Ecuador con productos confiables y atención cercana.</p>
              <Link href="/Contactos" className="mt-8 inline-flex bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Conversemos sobre tu proyecto</Link>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-white">
              <Image src={assets.boy_with_laptop_image} alt="Tecnología COMPEL para empresas" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </Container>
        </section>
        <Container className="grid gap-6 py-14 md:grid-cols-2 md:py-20">
          <article className="border border-brand-line bg-white p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Nuestra misión</p>
            <h2 className="mt-3 font-display text-3xl text-brand-ink">Resolver necesidades reales.</h2>
            <p className="mt-4 text-sm leading-7 text-brand-muted">Brindar productos y soluciones tecnológicas de calidad con servicio eficiente, asesoría responsable y atención enfocada en cada cliente.</p>
          </article>
          <article className="border border-brand-line bg-white p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Nuestra visión</p>
            <h2 className="mt-3 font-display text-3xl text-brand-ink">Crecer junto a nuestros clientes.</h2>
            <p className="mt-4 text-sm leading-7 text-brand-muted">Ser un aliado reconocido en Ecuador por la excelencia en soluciones de identificación, innovación tecnológica y soporte cercano.</p>
          </article>
        </Container>
      </main>
      <BrandCarousel />
    </>
  );
}
