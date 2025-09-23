import React from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTopFloat = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={scrollToTop}
        className="w-14 h-14 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition duration-300"
        aria-label="Subir al inicio"
      >
        <FaArrowUp size={26} />
      </button>
    </div>
  );
};

export default ScrollToTopFloat;
