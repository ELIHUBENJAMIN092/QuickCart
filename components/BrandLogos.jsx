import React from "react";
import Image from "next/image";

const brandLogos = [
  { src: "/logos/zebra.png", alt: "Zebra" },
  { src: "/logos/tsc.png", alt: "TSC" },
  { src: "/logos/swiftpro.png", alt: "Swiftpro" },
  { src: "/logos/magicard.png", alt: "Magicard" },
  { src: "/logos/epson.png", alt: "Epson" },
  { src: "/logos/hid.png", alt: "Hid" },
  { src: "/logos/bartender.png", alt: "Bartender" },
  { src: "/logos/unitech.png", alt: "Unitech" },
];

const BrandCarousel = () => {
  return (
    <div className="overflow-hidden bg-[#F4F6FA] py-6">
      <div className="animate-scroll flex gap-10 items-center whitespace-nowrap px-4">
        {brandLogos.concat(brandLogos).map((logo, index) => (
          <div
            key={`${logo.alt}-${index}`}
            className="min-w-[100px] h-[60px] flex items-center justify-center"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={100}
              height={60}
              priority={index < 10} // Mejora el rendimiento en los primeros logos
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandCarousel;
