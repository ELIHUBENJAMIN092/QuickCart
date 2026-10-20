"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import BrandCarousel from "@/components/BrandLogos";
import Container from "@/components/ui/Container";

const contactItems = [
  { icon: Phone, title: "Llámanos", detail: "02 2548-701 · 02 2902-384", href: "tel:+59322548701" },
  { icon: Mail, title: "Escríbenos", detail: "soporte@compelecuador.com", href: "mailto:soporte@compelecuador.com" },
  { icon: MapPin, title: "Visítanos", detail: "Jerónimo Carrión Oe1-10 y Av. 10 de Agosto, Quito", href: "https://maps.google.com/?q=Jerónimo+Carrión+Oe1-10+y+Av.+10+de+Agosto,+Quito" },
];

export default function ContactPage() {
  return (
    <>
      <main>
        <Container className="py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Estamos para ayudarte</p>
            <h1 className="mt-4 font-display text-4xl text-brand-ink md:text-6xl">Hablemos de tu próximo proyecto.</h1>
            <p className="mt-5 text-sm leading-7 text-brand-muted">Cuéntanos qué necesita tu operación. Nuestro equipo puede ayudarte a encontrar la solución más adecuada.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {contactItems.map(({ icon: Icon, title, detail, href }) => (
              <a key={title} href={href} target={title === "Visítanos" ? "_blank" : undefined} rel={title === "Visítanos" ? "noreferrer" : undefined} className="border border-brand-line bg-white p-6 transition hover:border-brand-accent">
                <Icon className="text-brand-accent" size={22} />
                <h2 className="mt-5 font-semibold text-brand-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">{detail}</p>
              </a>
            ))}
          </div>
          <div className="mt-8 overflow-hidden border border-brand-line bg-brand-sand">
            <iframe
              title="Ubicación de COMPEL en Quito"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.2390283720582!2d-78.51072873052784!3d-0.22400739859244912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a742b0ffcaf%3A0xa4aa32ef7c2b2747!2s10%20de%20Agosto%20%26%20Jer%C3%B3nimo%20Carri%C3%B3n%2C%20Quito%20170129!5e0!3m2!1ses!2sec!4v1718921699216!5m2!1ses!2sec"
              className="h-[360px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="mt-7 text-sm text-brand-muted">¿Prefieres explorar primero? <Link href="/all-products" className="font-semibold text-brand-accent hover:underline">Visita nuestro catálogo.</Link></p>
        </Container>
      </main>
      <BrandCarousel />
    </>
  );
}
