"use client";

import React from "react";

export default function BannerOferta() {
  const [isOpen, setIsOpen] = React.useState(true);

  if (!isOpen) return null;

  return (
    <div className="w-full bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 text-white py-3 shadow-lg">
      <div className="relative max-w-7xl mx-auto flex items-center justify-center px-4">

        {/* Texto centrado */}
        <p className="text-sm md:text-base font-extrabold tracking-wide text-center drop-shadow-md">
          ¡20% DE DESCUENTO EN TU PRIMER PEDIDO! 🛍️
        </p>

        {/* Botón cerrar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 text-white text-xl font-bold hover:scale-125 transition-transform"
          aria-label="Cerrar banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
