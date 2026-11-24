"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import CertificationSeals from "@/components/CertificationSeals";
import { buildSlides, slideImage } from "@/lib/carousel";

const SLIDE_DURATION = 6000;

export default function HeaderSlider({ initialSlides, initialCertifications }) {
  const slides = initialSlides?.length ? initialSlides : buildSlides();
  const certifications = initialCertifications || [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const paused = hoverPaused || userPaused || reducedMotion;

  // Respeta prefers-reduced-motion y reacciona si la preferencia cambia en vivo.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const interval = window.setInterval(
      () => setCurrentSlide((current) => (current + 1) % slides.length),
      SLIDE_DURATION
    );
    return () => window.clearInterval(interval);
  }, [paused, reducedMotion, currentSlide, slides.length]);

  const go = (step) => setCurrentSlide((current) => (current + step + slides.length) % slides.length);

  return (
    <section
      className="relative isolate grid min-h-[640px] overflow-hidden bg-brand-ink text-brand-cream md:min-h-[min(720px,calc(100vh-100px))]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      aria-label="Soluciones COMPEL"
    >
      {slides.map((slide, index) => {
        const Heading = index === currentSlide ? "h1" : "h2";
        return (
          <div
            key={slide.position}
            className={`relative [grid-area:1/1] transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={index !== currentSlide}
          >
            {(index === currentSlide ||
              index === (currentSlide + 1) % slides.length ||
              (currentSlide > 0 && index === (currentSlide - 1 + slides.length) % slides.length)) && (
              <Image
                src={slideImage(slide)}
                alt=""
                fill
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                quality={70}
                sizes="100vw"
                className="object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-ink/90 via-brand-ink/65 to-brand-ink/10" />
            <div className="relative mx-auto flex h-full min-h-[640px] max-w-7xl items-center px-6 pb-28 pt-20 md:min-h-[min(720px,calc(100vh-100px))] md:px-12">
              <div className={`min-w-0 max-w-2xl transition-all duration-700 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{slide.eyebrow}</p>
                <Heading className="font-display text-[clamp(2rem,11vw,3rem)] leading-[1.05] tracking-tight text-white md:text-7xl">{slide.title}</Heading>
                <p className="mt-6 max-w-lg text-sm leading-7 text-white/80 md:text-base">{slide.description}</p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link href={`/categoria/${encodeURIComponent(slide.category)}`} tabIndex={index === currentSlide ? 0 : -1} className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-white">
                    {slide.primary_label}<ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/Acerca#contacto" tabIndex={index === currentSlide ? 0 : -1} className="rounded-full border border-white/50 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                    {slide.secondary_label}
                  </Link>
                </div>
                {index === 0 && (
                  <div className="mt-6 md:hidden">
                    <div className="certification-seals-scroll flex overflow-x-auto pb-1">
                      <CertificationSeals certifications={certifications} visible={index === currentSlide} inline className="ml-auto shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="hidden md:contents">
        <CertificationSeals certifications={certifications} visible={currentSlide === 0} />
      </div>
      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:left-6 md:flex md:h-12 md:w-12">
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:right-6 md:flex md:h-12 md:w-12">
            <ChevronRight size={26} aria-hidden="true" />
          </button>
        </>
      )}
      <div className="absolute bottom-8 left-6 right-6 z-10 mx-auto flex max-w-7xl items-center gap-2 md:left-12 md:right-12 md:gap-3">
        {slides.length > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:hidden">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        {slides.map((slide, index) => (
          <button key={slide.position} onClick={() => setCurrentSlide(index)} className="group h-8 flex-1 py-3" aria-label={`Mostrar diapositiva ${index + 1}`} aria-current={index === currentSlide}>
            <span className="block h-px w-full overflow-hidden bg-white/40">
              <span className={`block h-full w-full origin-left bg-white ${index === currentSlide ? "animate-progress" : "scale-x-0"}`} style={{ animationPlayState: paused || reducedMotion ? "paused" : "running" }} />
            </span>
          </button>
        ))}
        {slides.length > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:hidden">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => setUserPaused((value) => !value)}
            aria-label={userPaused ? "Reanudar presentación" : "Pausar presentación"}
            aria-pressed={userPaused}
            title={userPaused ? "Reanudar presentación" : "Pausar presentación"}
            className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
          >
            {userPaused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
