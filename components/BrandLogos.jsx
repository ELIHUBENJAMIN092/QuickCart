import Image from "next/image";

const brandLogos = [
  { src: "/logos/zebra.png", alt: "Zebra" },
  { src: "/logos/tsc.png", alt: "TSC" },
  { src: "/logos/swiftpro.png", alt: "Swiftpro" },
  { src: "/logos/magicard.png", alt: "Magicard" },
  { src: "/logos/epson.png", alt: "Epson" },
  { src: "/logos/hid.png", alt: "HID" },
  { src: "/logos/bartender.png", alt: "Bartender" },
  { src: "/logos/unitech.png", alt: "Unitech" },
];

export default function BrandCarousel() {
  return (
    <section className="overflow-hidden border-y border-brand-line bg-brand-cream py-8" aria-label="Marcas que distribuimos">
      <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-muted">Marcas de confianza</p>
      <div className="animate-scroll flex w-max items-center gap-12 whitespace-nowrap px-6">
        {[...brandLogos, ...brandLogos].map((logo, index) => (
          <div key={`${logo.alt}-${index}`} className="brand-logo grayscale transition duration-300 hover:grayscale-0">
            <Image src={logo.src} alt={index < brandLogos.length ? logo.alt : ""} width={120} height={60} className="max-h-12 w-auto object-contain" />
          </div>
        ))}
      </div>
    </section>
  );
}
