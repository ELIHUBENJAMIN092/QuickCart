import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { assets } from "@/assets/assets";

export default function Banner() {
  return (
    <section className="bg-brand-sand">
      <div className="grid md:min-h-[460px] md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-14 md:py-20 md:pl-[max(2rem,calc((100vw-80rem)/2+3rem))] md:pr-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">Tecnología que transforma</p>
            <h2 className="mt-4 max-w-lg font-display text-4xl leading-tight text-brand-ink md:text-5xl">Identifica mejor. Trabaja más inteligente.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-brand-charcoal">Te acompañamos a encontrar el equipo adecuado con asesoría, implementación y soporte local.</p>
            <Link href="/Contactos" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">Conoce nuestras soluciones <ArrowRight size={16} /></Link>
          </div>
          <div className="relative min-h-64 bg-brand-sand">
            <Image src={assets.boy_with_laptop_image} alt="Especialista utilizando tecnología COMPEL" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
      </div>
    </section>
  );
}
