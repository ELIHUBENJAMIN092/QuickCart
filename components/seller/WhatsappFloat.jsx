import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsappFloat = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        ¿Necesitas ayuda? Escríbenos por WhatsApp
      </div>

      {/* Botón de WhatsApp */}
      <a
        href="https://wa.me/593984647873"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-colors duration-300"
        aria-label="Chat en WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>
    </div>
  );
};

export default WhatsappFloat;
