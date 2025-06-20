import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa"; // ✅ Importar ícono de WhatsApp

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
          <p className="mt-6 text-sm">
            "En Compel te ofrecemos soluciones de identificación como credenciales PVC, códigos de barras, tecnología RFID y computadores móviles. Somos distribuidor autorizado Zebra en Ecuador, garantizando calidad y respaldo en cada producto."
          </p>
        </div>

        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Empresa</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:underline transition" href="#">Inicio</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Acerca de nosotros</a>
              </li>
              <li>
                <a className="hover:underline transition" href="/Contactos">Contactos</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Política de Privacidad</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Ponte en contacto</h2>
            <div className="text-sm space-y-2">
              <a
                href="https://wa.me/593984647873"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaWhatsapp size={18} />
                +(593) 98 461 7873
              </a>
              <p>02 2548-701</p>
              <p>02 2902-384</p>
              <p>Jerónimo Carrión Oe1-10 y Av.10 de Agosto </p>
              <p>soporte@compelecuador.com</p>
            </div>
          </div>
        </div>
      </div>
      {/* Redes sociales centradas */}
      <div className="flex justify-center py-6">
        <div className="flex items-center gap-4">
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
      <p className="py-4 text-center text-xs md:text-sm">
        Copyright 2025 © COMPEL Todos los derechos reservados.
      </p>
    </footer>
  );
};

export default Footer;
