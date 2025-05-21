import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <div className="flex md:flex-row flex-col-reverse items-center justify-between text-left w-full px-10">
      <div className="flex items-center gap-4">
        <Image className="hidden md:block w-32 h-auto" src={assets.logo} alt="logo" />
        <div className="hidden md:block w-px h-5 bg-gray-500/60"></div>

        <p className="py-4 text-center text-xs md:text-sm text-gray-500">
          Copyright 2025 © COMPEL Todos los derechos reservados.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://www.facebook.com/CompelEcuadorImpresorasSuministrosEtiquetasNylon"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src={assets.facebook_icon} alt="facebook_icon" />
        </a>
        <a
          href="https://www.instagram.com/compelecuador/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src={assets.instagram_icon} alt="instagram_icon" />
        </a>
        <a
          href="https://www.youtube.com/@compelecuador7211"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src={assets.youtube_icon} alt="youtube_icon" />
        </a>
      </div>
    </div>
  );
};

export default Footer;
