"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buildSlides, slideImage } from "@/lib/carousel";

const SLIDE_DURATION = 6000;

export default function HeaderSlider() {
  const [slides, setSlides] = useState(() => buildSlides());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/carousel")
      .then((response) => response.json())
      .then((data) => { if (active && data.slides) setSlides(data.slides); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const interval = window.setInterval(
      () => setCurrentSlide((current) => (current + 1) % slides.length),
      SLIDE_DURATION
    );
    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <section
      className="relative isolate min-h-[560px] overflow-hidden bg-brand-ink text-brand-cream md:min-h-[min(720px,calc(100vh-100px))]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Soluciones COMPEL"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.position}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== currentSlide}
        >
          <Image
            src={slideImage(slide)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ink/90 via-brand-ink/65 to-brand-ink/10" />
          <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-6 py-20 md:min-h-[min(720px,calc(100vh-100px))] md:px-12">
            <div className={`max-w-2xl transition-all duration-700 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{slide.eyebrow}</p>
              <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-white md:text-7xl">{slide.title}</h1>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/80 md:text-base">{slide.description}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href={`/all-products?category=${slide.category}`} tabIndex={index === currentSlide ? 0 : -1} className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-white">
                  {slide.primary_label}<ArrowRight size={16} />
                </Link>
                <Link href="/Contactos" tabIndex={index === currentSlide ? 0 : -1} className="rounded-full border border-white/50 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                  {slide.secondary_label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-8 left-6 right-6 z-10 mx-auto flex max-w-7xl gap-3 md:left-12 md:right-12">
        {slides.map((slide, index) => (
          <button key={slide.position} onClick={() => setCurrentSlide(index)} className="group h-8 flex-1 py-3" aria-label={`Mostrar diapositiva ${index + 1}`} aria-current={index === currentSlide}>
            <span className="block h-px w-full overflow-hidden bg-white/40">
              <span className={`block h-full bg-white ${index === currentSlide ? "animate-progress" : "w-0"}`} style={{ animationPlayState: paused ? "paused" : "running" }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
