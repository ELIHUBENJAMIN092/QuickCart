"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import BrandCarousel from "@/components/BrandLogos";
import { assets } from "@/assets/assets";
import Container from "@/components/ui/Container";

const contactItems = [
  { icon: Phone, title: "Llámanos", detail: "02 2548-701 · 02 2902-384", href: "tel:+59322548701" },
  { icon: Mail, title: "Escríbenos", detail: "soporte@compelecuador.com", href: "mailto:soporte@compelecuador.com" },
  { icon: MapPin, title: "Visítanos", detail: "Jerónimo Carrión Oe1-10 y Av. 10 de Agosto, Quito", href: "https://maps.google.com/?q=Jerónimo+Carrión+Oe1-10+y+Av.+10+de+Agosto,+Quito" },
];

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
              <Link href="#contacto" className="mt-8 inline-flex bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Conversemos sobre tu proyecto</Link>
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
        <section id="contacto" className="scroll-mt-24 border-y border-brand-line bg-brand-sand">
          <Container className="py-14 md:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Contacto y asesoría</p>
              <h2 className="mt-4 font-display text-4xl leading-[0.96] text-brand-ink md:text-5xl">Hablemos de tu próximo proyecto.</h2>
              <p className="mt-5 text-sm leading-7 text-brand-muted">Cuéntanos qué necesita tu operación. Nuestro equipo puede ayudarte a encontrar la solución más adecuada.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {contactItems.map(({ icon: Icon, title, detail, href }) => (
                <a key={title} href={href} target={title === "Visítanos" ? "_blank" : undefined} rel={title === "Visítanos" ? "noreferrer" : undefined} className="rounded-xl border border-brand-line bg-white p-7 transition hover:-translate-y-1 hover:border-brand-ink hover:shadow-lg">
                  <Icon className="text-brand-accent" size={22} />
                  <h3 className="mt-5 font-semibold text-brand-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{detail}</p>
                </a>
              ))}
            </div>
            <div className="mt-8 overflow-hidden rounded-xl border border-brand-line bg-white">
              <iframe
                title="Ubicación de COMPEL en Quito"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.2390283720582!2d-78.51072873052784!3d-0.22400739859244912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a742b0ffcaf%3A0xa4aa32ef7c2b2747!2s10%20de%20Agosto%20%26%20Jer%C3%B3nimo%20Carri%C3%B3n%2C%20Quito%20170129!5e0!3m2!1ses!2sec!4v1718921699216!5m2!1ses!2sec"
                className="h-[320px] w-full border-0 md:h-[360px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="mt-7 text-sm text-brand-muted">¿Prefieres explorar primero? <Link href="/all-products" className="font-semibold text-brand-accent hover:underline">Visita nuestro catálogo.</Link></p>
          </Container>
        </section>
      </main>
      <BrandCarousel />
    </>
  );
}
