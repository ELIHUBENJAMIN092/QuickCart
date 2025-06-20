'use client'
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

        <div className="w-full md:max-w-md h-80 md:h-96">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.2390283720582!2d-78.51072873052784!3d-0.22400739859244912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a742b0ffcaf%3A0xa4aa32ef7c2b2747!2s10%20de%20Ago
