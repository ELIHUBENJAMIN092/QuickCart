import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsappFloat = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-16 right-10 bg-gray-500 text-white text-sm px-4 py-1 rounded-md shadow opacity-0 group-hover:opacity-100 transition duration-300">
        ¿Necesitas ayuda?
      </div>

      {/* Botón de WhatsApp */}
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
  );
};

export default WhatsappFloat;
