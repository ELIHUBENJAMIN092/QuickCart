import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { assets } from "@/assets/assets";

export default function Banner() {
  return (
    <section className="border-y border-brand-line bg-brand-sand">
      <div className="mx-auto grid max-w-[1360px] md:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-16 md:px-8 md:py-24 lg:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Tecnología que transforma</p>
          <h2 className="mt-4 max-w-lg font-display text-4xl leading-[0.96] text-brand-ink md:text-6xl">Identifica mejor. Trabaja más inteligente.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-brand-charcoal md:text-base">Te acompañamos a encontrar el equipo adecuado con asesoría, implementación y soporte local.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/Acerca#contacto" className="inline-flex items-center gap-2 bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Conoce nuestras soluciones <ArrowRight size={16} /></Link>
            <Link href="/all-products" className="inline-flex items-center border border-brand-ink px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-brand-ink hover:text-white">Ver catálogo</Link>
          </div>
        </div>
        <div className="relative min-h-[320px] bg-white md:min-h-full">
          <Image src={assets.boy_with_laptop_image} alt="Especialista utilizando tecnología COMPEL" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
