'use client'
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import BrandCarousel from "@/components/BrandLogos";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";

const AllProducts = () => {
  const { products } = useAppContext();

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  // Categorías únicas
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(unique)];
  }, [products]);

  // Filtro combinado
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "Todos" || p.category === selectedCategory;

      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">

        {/* Título */}
        <div className="flex flex-col items-end pt-12">
          <p className="text-2xl font-medium">Todos los Productos</p>
          <div className="w-16 h-0.5 bg-blue-600 rounded-full"></div>
        </div>

        {/* Filtro + Buscador */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mt-6 w-full">

          {/* Select categoría */}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <label htmlFor="category" className="font-medium">
              Categoría:
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 🔍 Buscador FULL WIDTH */}
          <div className="relative flex-1 w-full">
            
            {/* Icono lupa */}
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            {/* Input */}
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2"
            />

            {/* Botón limpiar */}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            )}

          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-12 pb-14 w-full">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No hay productos que coincidan con la búsqueda
            </p>
          )}
        </div>

      </div>
      <BrandCarousel/>
      <Footer />
      <ScrollToTopFloat />
    </>
  );
};

export default AllProducts;