'use client'
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { assets } from "@/assets/assets";

const ContactPage = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="max-w-xl w-full">
          <h1 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-6">Contáctanos</h1>
          <p className="text-gray-700 mb-8">
            Si deseas más información sobre nuestros productos o servicios, no dudes en comunicarte con nosotros mediante los siguientes canales:
          </p>

          <div className="space-y-4 text-gray-600 text-base">
            <p><span className="font-semibold text-gray-800">📍 Dirección:</span> 10 de Agosto y Jerónimo Carrión, Ecuador</p>
            <p><span className="font-semibold text-gray-800">📞 Teléfono fijo:</span> 2548701</p>
            <p><span className="font-semibold text-gray-800">📱 Celular:</span> 099 646 4248</p>
            <p><span className="font-semibold text-gray-800">✉️ Correo electrónico:</span> soporte@compelecuador.com</p>
          </div>
        </div>

        <div className="w-full md:max-w-md">
          <Image
            src={assets.my_location_image}
            alt="Ubicación COMPEL"
            className="rounded shadow-md w-full h-auto"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
