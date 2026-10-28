"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Layers3,
  MonitorSmartphone,
  ScanLine,
  Settings2,
} from "lucide-react";
import TwoToneTitle from "@/components/TwoToneTitle";
import { defaultKiosk } from "@/lib/kiosk";

const featureIcons = [Layers3, MonitorSmartphone, ScanLine, Settings2];

const industries = ["Retail", "Restaurantes y QSR", "Hospitalidad", "Salud", "Corporativo"];

export default function KioscosPage() {
  const [kiosk, setKiosk] = useState(defaultKiosk);

  useEffect(() => {
    let active = true;
    fetch("/api/kiosk")
      .then((response) => response.json())
      .then((data) => { if (active && data.kiosk) setKiosk(data.kiosk); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <main className="bg-white">
      <section>
        <div className="relative isolate min-h-[45vh] overflow-hidden bg-[#edf2f5] md:min-h-[60vh]">
          {kiosk.video_url && (
            <video
              key={kiosk.video_url}
              className="absolute inset-0 h-full w-full object-contain"
              src={kiosk.video_url}
              poster={kiosk.video_url === defaultKiosk.video_url ? "/videos/kiosk-poster.jpg" : undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="mx-auto w-full max-w-[1360px] px-5 py-12 md:px-12 md:py-16">
          <div className="mx-auto max-w-5xl text-center">
            <p className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">
              <span className="h-px w-8 bg-brand-accent" /> {kiosk.eyebrow}
            </p>
            <TwoToneTitle title={kiosk.title} className="mt-5 text-4xl md:text-6xl lg:text-7xl" />
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">{kiosk.description}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href={kiosk.primary_url || "/Acerca#contacto"} className="inline-flex items-center gap-2 bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">
                {kiosk.primary_label || "Solicitar asesoría"} <ArrowRight size={16} />
              </Link>
              <Link href={kiosk.secondary_url || "/all-products"} className="inline-flex items-center gap-2 border border-brand-ink px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-brand-ink hover:text-white">
                {kiosk.secondary_label || "Ver equipos"}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-brand-muted">
              {industries.map((industry) => (
                <span key={industry} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-brand-accent" /> {industry}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-line bg-white">
        <div className="mx-auto grid max-w-[1360px] divide-y divide-brand-line px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-12">
          {kiosk.highlights.map((highlight, index) => (
            <div key={`${highlight.label}-${index}`} className="py-8 first:pt-8 sm:px-8 sm:py-10 sm:first:pl-0 sm:last:pr-0">
              <p className="font-display text-4xl text-brand-ink md:text-5xl">{highlight.value}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] leading-5 text-brand-muted">{highlight.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-5 py-16 md:px-12 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Diseñado para operar</p>
            <h2 className="mt-4 font-display text-3xl leading-[0.98] text-brand-ink md:text-5xl">Una estación, múltiples formas de atender.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-brand-muted">
              Combinamos hardware, accesorios e integración para crear puntos de autoservicio que reducen filas, agilizan pagos y liberan a tu equipo para tareas de mayor valor.
            </p>
            <Link href="/Acerca#contacto" className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent hover:text-brand-ink">
              Cuéntanos tu proyecto <ArrowRight size={15} />
            </Link>
          </div>

          <div className="space-y-3">
            {kiosk.features.map((feature, index) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <article key={`${feature.title}-${index}`} className="group flex gap-5 border border-brand-line bg-white p-6 transition hover:border-brand-ink md:p-7">
                  <span className="font-display text-sm text-brand-muted">0{index + 1}</span>
                  <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center bg-brand-sand text-brand-accent">
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-brand-ink md:text-lg">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-brand-muted">{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-sand py-16 md:py-24">
        <div className="mx-auto grid max-w-[1360px] gap-8 px-5 md:px-8 lg:px-12 lg:grid-cols-2">
          <div className="relative overflow-hidden bg-brand-ink p-8 text-white md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-accent/25 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-hover">Configuración a medida</p>
              <h2 className="mt-4 font-display text-3xl leading-[0.98] md:text-5xl">Elige el formato, los accesorios y el software.</h2>
              <ul className="mt-7 space-y-4 text-sm text-white/80">
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" /> Estaciones de piso, mostrador o pared.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" /> Pantallas táctiles con orientación vertical.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" /> Pagos, impresión, lectura de códigos y biometría.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" /> Integración con tu sistema de gestión.</li>
              </ul>
              <Link href={kiosk.closing_url || "/Acerca#contacto"} className="mt-9 inline-flex items-center gap-2 bg-white px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-brand-accent hover:text-white">
                {kiosk.closing_label || "Hablar con un especialista"} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: MonitorSmartphone, title: "Autoservicio", text: "Pedidos, check-in y consultas sin filas." },
              { icon: CreditCard, title: "Pagos integrados", text: "Cobros seguros con terminales compatibles." },
              { icon: ScanLine, title: "Captura de datos", text: "Códigos de barras, RFID y validación en sitio." },
              { icon: Settings2, title: "Soporte local", text: "Implementación, mantenimiento y acompañamiento." },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="border border-brand-line bg-white p-6">
                <Icon size={20} className="text-brand-accent" />
                <h3 className="mt-5 text-base font-semibold text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-brand-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-center md:px-12 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Siguiente paso</p>
          <h2 className="mt-4 font-display text-3xl leading-[0.98] text-brand-ink md:text-5xl">{kiosk.closing_title}</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-brand-muted">{kiosk.closing_description}</p>
          <Link href={kiosk.closing_url || "/Acerca#contacto"} className="mt-9 inline-flex items-center gap-2 bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">
            {kiosk.closing_label || "Hablar con un especialista"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
