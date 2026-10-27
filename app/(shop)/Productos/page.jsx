"use client";

import Image from "next/image";
import Link from "next/link";
import BrandCarousel from "@/components/BrandLogos";
import Container from "@/components/ui/Container";
import { assets } from "@/assets/assets";

const products = [
  {
    name: "FX9600",
    type: "Lector fijo RFID",
    description: "Lector fijo robusto de alto rendimiento para entornos exigentes y operaciones de alto volumen.",
    image: assets.rfid_fx9600,
    catalog: "https://drive.google.com/file/d/1D4k9CzE6jgvtXOEd9RImBCp1tO53FYwG/view?usp=drive_link",
  },
  {
    name: "RFD40",
    type: "Lector portátil RFID",
    description: "Lector ergonómico con conectividad móvil para capturar etiquetas RFID con rapidez.",
    image: assets.rfid_rfd40,
    catalog: "https://drive.google.com/file/d/1v8GufUus8U2Y8vzUq-WYOcgfP3u2EPEK/view?usp=drive_link",
  },
  {
    name: "MC3330R",
    type: "Computador móvil RFID",
    description: "Computador móvil con RFID integrado para capturar datos en campo y elevar la productividad.",
    image: assets.rfid_mc3330r,
    catalog: "https://drive.google.com/file/d/1vV6P8scx9Ui_KwJ-i6rL4pIOuYixHH3q/view?usp=drive_link",
  },
];

export default function ProductosPage() {
  return (
    <>
      <main>
        <section className="bg-brand-sand py-14 md:py-20">
          <Container className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Tecnología de identificación</p>
            <h1 className="mt-4 font-display text-4xl leading-[0.96] text-brand-ink md:text-6xl">Soluciones RFID.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-brand-charcoal">Optimiza la captura de datos, el control de inventarios y la trazabilidad de tus activos con lectores RFID profesionales.</p>
            <Link href="/all-products?category=rfid" className="mt-8 inline-flex bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Explorar catálogo RFID</Link>
          </Container>
        </section>
        <Container className="py-14 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {products.map((product) => (
              <article key={product.name} className="flex flex-col border border-brand-line bg-white p-6">
                <div className="relative aspect-[4/3] border border-brand-line bg-brand-sand/60">
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-5" />
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">{product.type}</p>
                <h2 className="mt-2 font-display text-2xl text-brand-ink">{product.name}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-brand-muted">{product.description}</p>
                <a href={product.catalog} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center border-b border-brand-accent pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent transition hover:text-brand-ink">Ver ficha técnica ↗</a>
              </article>
            ))}
          </div>
        </Container>
      </main>
      <BrandCarousel />
    </>
  );
}
