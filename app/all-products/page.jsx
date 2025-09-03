
'use client'
import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

const AllProducts = () => {
  const { products } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Sacamos las categorías únicas desde los productos
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(unique)];
  }, [products]);

  // Filtramos según categoría seleccionada
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todos") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
        {/* Título */}
        <div className="flex flex-col items-end pt-12">
          <p className="text-2xl font-medium">Todos los Productos</p>
          <div className="w-16 h-0.5 bg-blue-600 rounded-full"></div>
        </div>

        {/* Filtro de categorías */}
        <div className="flex items-center gap-4 mt-6 w-full">
          <label htmlFor="category" className="font-medium">
            Filtrar por categoría:
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

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-12 pb-14 w-full">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No hay productos en esta categoría
            </p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllProducts;