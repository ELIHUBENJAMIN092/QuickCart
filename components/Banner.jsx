"use client";
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Banner = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
            Todo lo que buscas, en un solo lugar COMPEL
          </h2>
          <p className="max-w-[343px] font-medium text-gray-800/60">
            en un solo lugar con garantía y soporte garantizado.
          </p>
        </div>

        {/* Columna 3: Botón */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpen(true)}
            className="group flex items-center justify-center gap-1 px-12 py-2.5 bg-blue-600 rounded text-white"
          >
            Catálogo
            <Image
              className="group-hover:translate-x-1 transition"
              src={assets.arrow_icon_white}
              alt="arrow_icon_white"
            />
          </button>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">

          {/* Contenedor del modal */}
          <div className="relative w-[95%] md:w-[80%] h-[90%] bg-white rounded-xl overflow-hidden shadow-2xl">

            {/* Botón cerrar */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 bg-red-600 text-white px-3 py-1 rounded"
            >
              X
            </button>

            {/* Visor PDF */}
            <iframe
              src="https://drive.google.com/file/d/1WcFYHeEE6DxiRNMnhLw_hjR5b5o-WR1B/preview"
              className="w-full h-full"
              allow="autoplay"
            ></iframe>

          </div>
        </div>
      )}
    </>
  );
};

export default Banner;