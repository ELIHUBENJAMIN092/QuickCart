import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { FaArrowUp, FaWhatsapp } from "react-icons/fa";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";

const products = [
  {
    id: 1,
    image: assets.girl_with_headphone_image,
    title: "Identificación sin contacto RFID",
    description: "Escanea y gestiona en segundos sin errores manuales.",
  },
  {
    id: 2,
    image: assets.girl_with_earphone_image,
    title: "Tecnología probada, resultados confiables",
    description: "La fuerza del código de barras en cada operación.",
  },
  {
    id: 3,
    image: assets.boy_with_laptop_image,
    title: "Acceso seguro, imagen profesional",
    description: "Identificación inteligente en una sola tarjeta.",
  },
  {
    id: 4,
    image: assets.codigo_barras,
    title: "Un clic, toda la información",
    description: "Transforma datos en decisiones al instante.",
  },
  {
    id: 5,
    image: assets.lectores_barras,
    title: "Escaneo preciso, productividad garantizada",
    description: "Lector de códigos de barras que nunca falla.",
  },
  {
    id: 6,
    image: assets.credencial,
    title: "Identificacion PVC",
    description: "El poder de un lector en la palma de tu mano.",
  },
];

const FeaturedProduct = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mt-14">
      <div className="flex flex-col items-center">
        <p className="text-3xl font-medium">Categoría de Productos</p>
        <div className="w-28 h-0.5 bg-blue-700 mt-2"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
        {products.map(({ id, image, title, description }) => (
          <div key={id} className="relative group">
            <Image
              src={image}
              alt={title}
              className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover"
            />
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 text-white space-y-2">
              <p className="font-medium text-xl lg:text-2xl">{title}</p>
              <p className="text-sm lg:text-base leading-5 max-w-60">
                {description}
              </p>
              {id === 1 ? (
                <Link href="/Productos">
                  <button className="flex items-center gap-1.5 bg-blue-700 px-4 py-2 rounded mt-4">
                    Ver más
                  </button>
                </Link>
              ) : (
                <button
                  className="flex items-center gap-1.5 bg-gray-500 px-4 py-2 rounded cursor-not-allowed mt-4"
                  disabled
                >
                  Ver más
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ScrollToTopFloat />

      {/* Botón flotante de WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip */}
        <div className="absolute bottom-16 right-10 bg-gray-500 text-white text-sm px-4 py-1 rounded-md shadow opacity-0 group-hover:opacity-100 transition duration-300">
          ¿Necesitas ayuda?
        </div>

        {/* Botón */}
        <a
          href="https://wa.me/593987873"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition duration-300"
          aria-label="Chat en WhatsApp"
        >
          <FaWhatsapp size={26} />
        </a>
      </div>
    </div>
  );
};

export default FeaturedProduct;
