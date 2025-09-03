import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Banner = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-items-center gap-6 py-14 md:py-0 bg-[#E6E9F2] my-16 rounded-xl overflow-hidden text-center">
      
      {/* Columna 1: Imagen */}
      <Image
        className="max-w-56"
        src={assets.jbl_soundbox_image}
        alt="jbl_soundbox_image"
      />

      {/* Columna 2: Texto */}
      <div className="flex flex-col items-center justify-center space-y-2 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold max-w-[290px]">
          Todo lo que buscas, para tu negocio
        </h2>
        <p className="max-w-[343px] font-medium text-gray-800/60">
          en un solo lugar con garantía y soporte garantizado.
        </p>
      </div>

      {/* Columna 3: Botón */}
      <div className="flex justify-center">
        <button className="group flex items-center justify-center gap-1 px-12 py-2.5 bg-blue-600 rounded text-white">
          Comprar ahora
          <Image
            className="group-hover:translate-x-1 transition"
            src={assets.arrow_icon_white}
            alt="arrow_icon_white"
          />
        </button>
      </div>
    </div>
  );
};

export default Banner;
