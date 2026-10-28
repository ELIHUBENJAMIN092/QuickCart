"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import TwoToneTitle from "@/components/TwoToneTitle";

function ActionLink({ href, className, children }) {
  if (!href) return null;
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  }
  return <Link href={href} className={className}>{children}</Link>;
}

export default function CategoryHero({ category, subcategory }) {
  const hero = category.hero || {};
  const background = hero.image_url || category.image_url || category.image;
  const poster = typeof background === "string" ? background : background?.src;
  const title = subcategory?.name || hero.title || category.name;
  const description = subcategory ? category.description : hero.description || category.description;
  const primaryLabel = hero.primary_label || "Solicitar asesoría";
  const primaryUrl = hero.primary_url || "/Acerca#contacto";
  const secondaryLabel = hero.secondary_label || "Ver productos";
  const secondaryUrl = hero.secondary_url || "#productos";
  const videoBackground = category.slug === "kioscos-y-pos" ? "bg-[#edf2f5]" : "bg-brand-ink";

  return (
    <section className="bg-white">
      <div className={`relative isolate min-h-[45vh] overflow-hidden border-b border-brand-line md:min-h-[60vh] ${hero.video_url ? videoBackground : "bg-brand-sand"}`}>
        {hero.video_url ? (
          <video
            key={hero.video_url}
            className="absolute inset-0 h-full w-full object-contain"
            src={hero.video_url}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : background ? (
          <Image src={background} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : null}
      </div>

      <Container>
        <div className="mx-auto max-w-5xl py-14 text-center md:py-20">
          <p className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">
            <span className="h-px w-8 bg-brand-accent" /> {hero.eyebrow || category.name}
          </p>
          <TwoToneTitle title={title} className="mt-5 text-4xl md:text-6xl lg:text-7xl" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">{description}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ActionLink href={primaryUrl} className="inline-flex items-center gap-2 bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">
              {primaryLabel} <ArrowRight size={16} />
            </ActionLink>
            <ActionLink href={secondaryUrl} className="inline-flex items-center gap-2 border border-brand-ink px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-brand-ink hover:text-white">
              {secondaryLabel}
            </ActionLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
