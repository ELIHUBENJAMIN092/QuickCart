"use client";
import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTopFloat = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Detectar el scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Mostrar si el usuario está cerca del pie (último 20% de la página)
      if (scrollTop + windowHeight >= fullHeight * 0.8) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
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
