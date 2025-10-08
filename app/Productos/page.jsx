'use client';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { assets } from "@/assets/assets";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";
import BrandCarousel from "@/components/BrandLogos";

const ProductosPage = () => {
  const productos = [
    {
      id: 1,
      nombre: "FX9600",
      descripcion:
        "Lector fijo robusto de alto rendimiento, diseñado para entornos difíciles y de alto volumen, gran precisión en la lectura de las etiquetas y colocación de varias antenas.",
      imagen: assets.rfid_fx9600,
      catalogo:
        "https://drive.google.com/file/d/1D4k9CzE6jgvtXOEd9RImBCp1tO53FYwG/view?usp=drive_link", // enlace real
    },
    {
      id: 2,
      nombre: "RFD40",
      descripcion:
        "Lector de mano ligero y ergonómico, lea sus etiquetas RFID rápidamente, gracias a su batería de gran capacidad y su conectividad a dispositivos móviles.",
      imagen: assets.rfid_rfd40,
      catalogo: "https://drive.google.com/file/d/1v8GufUus8U2Y8vzUq-WYOcgfP3u2EPEK/view?usp=drive_link",
    },
    {
      id: 3,
      nombre: "MC3330R",
      descripcion:
        "Computador móvil con lector RFID integrado, capture datos de etiquetas y códigos de barras, aumente su productividad gracias a su sistema operativo Android.",
      imagen: assets.rfid_mc3330r,
      catalogo: "https://drive.google.com/file/d/1vV6P8scx9Ui_KwJ-i6rL4pIOuYixHH3q/view?usp=drive_link",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16">
        {/* Título */}
        <h1 className="text-4xl font-bold text-blue-900 text-center mb-2">
          Lectores RFID
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          Fijos y Móviles
        </p>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {productos.map((prod) => (
            <div key={prod.id} className="flex flex-col items-center">
              <Image
                src={prod.imagen}
                alt={prod.nombre}
                className="w-full h-56 object-contain mb-6"
              />
              <h2 className="text-xl font-semibold text-blue-800 mb-3">
                {prod.nombre}
              </h2>
              <p className="text-gray-700 text-sm mb-4">{prod.descripcion}</p>
              <a
                href={prod.catalogo}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                Catálogo
              </a>
            </div>
          ))}
        </div>
      </div>
      <BrandCarousel/>
      <Footer />
      <ScrollToTopFloat />
    </>
  );
};

export default ProductosPage;
