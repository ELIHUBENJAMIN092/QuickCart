"use client";

import React from "react";

export default function BannerOferta() {
  const [isOpen, setIsOpen] = React.useState(true);

  if (!isOpen) return null;

  return (
    <div className="w-full bg-black text-white py-3 shadow-md">
      <div className="relative max-w-7xl mx-auto flex items-center justify-center px-4">
        
        {/* Texto centrado */}
        <p className="text-sm md:text-base font-bold tracking-wide text-center">
          📢 ¡20% de descuento en tu primer pedido! 🛍️
        </p>

        {/* Botón cerrar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 text-white text-xl font-bold hover:scale-110 transition-transform"
          aria-label="Cerrar banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
