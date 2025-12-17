"use client";

import React from "react";
import toast from "react-hot-toast";

export default function BannerOferta() {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClaim = () => {
    navigator.clipboard.writeText("NEW20");
    toast.success("Cupón copiado al portapapeles");
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-blue-900 text-white text-center py-2 px-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Texto de la oferta */}
        <p className="font-medium text-sm">
          ¡Obtén 20% OFF en tu primer pedido!
        </p>

        <div className="flex items-center space-x-4">
          {/* Botón de copiar cupón */}
          <button
            onClick={handleClaim}
            className="bg-white text-black font-medium px-3 py-1 rounded"
          >
            Copiar cupón
          </button>

          {/* Botón de cerrar */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white font-bold text-xl hover:text-gray-200 transition"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
