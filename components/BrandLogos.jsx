"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const defaultBrands = [
  { id: "zebra", logo_url: "/logos/zebra.png", name: "Zebra" },
  { id: "tsc", logo_url: "/logos/tsc.png", name: "TSC" },
  { id: "swiftpro", logo_url: "/logos/swiftpro.png", name: "Swiftpro" },
  { id: "magicard", logo_url: "/logos/magicard.png", name: "Magicard" },
  { id: "epson", logo_url: "/logos/epson.png", name: "Epson" },
  { id: "hid", logo_url: "/logos/hid.png", name: "HID" },
  { id: "bartender", logo_url: "/logos/bartender.png", name: "Bartender" },
  { id: "unitech", logo_url: "/logos/unitech.png", name: "Unitech" },
];

export default function BrandCarousel() {
  const [brands, setBrands] = useState(defaultBrands);

  useEffect(() => {
    let active = true;
    fetch("/api/trusted-brands")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar las marcas.");
        return response.json();
      })
      .then((data) => {
        if (active && data.success && Array.isArray(data.brands)) setBrands(data.brands);
      })
      .catch((error) => console.error("No se pudo actualizar el carrusel de marcas:", error));
    return () => { active = false; };
  }, []);

  if (!brands.length) return null;

  return (
    <section className="overflow-hidden border-y border-brand-line bg-brand-cream py-8" aria-label="Marcas que distribuimos">
      <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-muted">Marcas de confianza</p>
      <div className="animate-scroll flex w-max items-center gap-12 whitespace-nowrap px-6">
        {[...brands, ...brands].map((brand, index) => (
          <div key={`${brand.id}-${index}`} className="brand-logo">
            <Image src={brand.logo_url} alt={index < brands.length ? brand.name : ""} width={120} height={60} className="max-h-12 w-auto object-contain" />
          </div>
        ))}
      </div>
    </section>
  );
}
