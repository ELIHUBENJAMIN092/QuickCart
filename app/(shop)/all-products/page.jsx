"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useAppContext } from "@/context/AppContext";
import BrandCarousel from "@/components/BrandLogos";
import { categories, matchesCategoryFilter } from "@/lib/categories";
import Container from "@/components/ui/Container";

const PAGE_SIZE = 12;

export default function AllProducts() {
  const { products } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get("category") || "");
    setSearch(params.get("search") || "");
  }, []);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.description || ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const price = Number(product.offerPrice ?? product.price);
      const matchesPrice = (!minPrice || price >= Number(minPrice)) && (!maxPrice || price <= Number(maxPrice));
      return matchesCategoryFilter(product, selectedCategory) && matchesSearch && matchesPrice;
    });

    if (sortBy === "price-asc") result.sort((a, b) => Number(a.offerPrice ?? a.price) - Number(b.offerPrice ?? b.price));
    if (sortBy === "price-desc") result.sort((a, b) => Number(b.offerPrice ?? b.price) - Number(a.offerPrice ?? a.price));
    if (sortBy === "recent") result.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
    return result;
  }, [products, selectedCategory, search, minPrice, maxPrice, sortBy]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [selectedCategory, search, minPrice, maxPrice, sortBy]);

  const chooseCategory = (value) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("category", value);
    else params.delete("category");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <>
      <main>
        <Container className="py-12 md:py-16">
          <div className="mb-9 border-b border-brand-line pb-8">
            <p className="mb-3 text-xs text-brand-muted"><Link href="/" className="hover:text-brand-accent">Inicio</Link> <span className="px-1">/</span> Catálogo</p>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">COMPEL · Catálogo</p>
            <h1 className="font-display text-4xl text-brand-ink md:text-5xl">Soluciones para tu operación.</h1>
            <p className="mt-3 text-sm text-brand-muted">{filteredProducts.length} productos disponibles</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="hidden lg:block">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Categorías</h2>
              <button onClick={() => chooseCategory("")} className={`mb-3 block text-left text-sm ${!selectedCategory ? "font-semibold text-brand-accent" : "text-brand-muted hover:text-brand-ink"}`}>Todo el catálogo</button>
              <div className="space-y-5">
                {categories.map((category) => (
                  <div key={category.slug}>
                    <button onClick={() => chooseCategory(category.slug)} className={`text-left text-sm font-medium ${selectedCategory === category.slug ? "text-brand-accent" : "text-brand-ink hover:text-brand-accent"}`}>{category.name}</button>
                    <ul className="mt-2 space-y-2 pl-3">
                      {category.subcategories.map((subcategory) => {
                        const value = `${category.slug}/${subcategory.slug}`;
                        return <li key={value} className={subcategory.parent ? "pl-3" : ""}><button onClick={() => chooseCategory(value)} className={`text-left text-xs ${selectedCategory === value ? "font-semibold text-brand-accent" : "text-brand-muted hover:text-brand-ink"}`}>{subcategory.name}</button></li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-brand-line pt-6">
                <label htmlFor="price-filter" className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Precio máximo</label>
                <input aria-label="Precio mínimo" type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Precio mínimo" className="mt-3 w-full border-b border-brand-line bg-transparent py-2 text-sm outline-none focus:border-brand-accent" />
                <input id="price-filter" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Precio máximo" className="mt-3 w-full border-b border-brand-line bg-transparent py-2 text-sm outline-none focus:border-brand-accent" />
              </div>
            </aside>

            <div>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <select aria-label="Filtrar por categoría" value={selectedCategory} onChange={(event) => chooseCategory(event.target.value)} className="rounded-full border border-brand-line bg-transparent px-4 py-3 text-sm outline-none lg:hidden">
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => <optgroup key={category.slug} label={category.name}><option value={category.slug}>{category.name}</option>{category.subcategories.map((subcategory) => <option key={subcategory.slug} value={`${category.slug}/${subcategory.slug}`}>{subcategory.label || subcategory.name}</option>)}</optgroup>)}
                </select>
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="search" placeholder="Buscar productos..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-brand-line bg-transparent py-3 pl-11 pr-10 text-sm outline-none focus:border-brand-accent" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-label="Limpiar búsqueda"><X size={16} /></button>}
                </div>
                <details className="mb-5 border-b border-brand-line pb-4 lg:hidden">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Filtrar por precio máximo</summary>
                  <input aria-label="Precio mínimo" type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Precio mínimo" className="mt-3 w-full border-b border-brand-line bg-transparent py-2 text-sm outline-none focus:border-brand-accent" />
                  <input aria-label="Precio máximo" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Precio máximo" className="mt-3 w-full border-b border-brand-line bg-transparent py-2 text-sm outline-none focus:border-brand-accent" />
                </details>
                <select aria-label="Ordenar productos" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-full border border-brand-line bg-transparent px-4 py-3 text-sm outline-none">
                  <option value="recommended">Recomendados</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="recent">Más recientes</option>
                </select>
              </div>
              <div className="mb-5 flex items-center justify-between text-xs text-brand-muted">
                <span>{filteredProducts.length} resultados</span>
                {selectedCategory && <button onClick={() => chooseCategory("")} className="text-brand-accent hover:underline">Limpiar categoría</button>}
              </div>
              {filteredProducts.length ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.slice(0, visibleCount).map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
              ) : (
                <p className="bg-white py-20 text-center text-sm text-brand-muted">No hay productos que coincidan con los filtros seleccionados.</p>
              )}
              {visibleCount < filteredProducts.length && <div className="mt-10 text-center"><button onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-full border border-brand-ink px-7 py-3 text-sm font-medium text-brand-ink hover:bg-brand-ink hover:text-white">Cargar más productos</button></div>}
            </div>
          </div>
        </Container>
        <BrandCarousel />
      </main>
    </>
  );
}
