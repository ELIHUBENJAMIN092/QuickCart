"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

const tabs = [
  { id: "featured", label: "Selección destacada" },
  { id: "new", label: "Novedades" },
  { id: "offers", label: "Ofertas" },
];

export default function HomeProducts() {
  const { products, router } = useAppContext();
  const [activeTab, setActiveTab] = useState("featured");
  const visibleProducts = useMemo(() => {
    if (activeTab === "offers") {
      return products.filter((product) => Number(product.offerPrice) < Number(product.price));
    }
    if (activeTab === "new") {
      return [...products].sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
    }
    return products;
  }, [activeTab, products]);

  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Una selección para ti"
          title="Tecnología en la que puedes confiar."
          description="Productos profesionales seleccionados para mejorar la productividad de tu operación."
        />
        <div className="mb-7 flex flex-wrap gap-2 border-b border-brand-line">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`border-b-2 px-4 py-3 text-sm transition ${activeTab === tab.id ? "border-brand-accent font-semibold text-brand-ink" : "border-transparent text-brand-muted hover:text-brand-ink"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {visibleProducts.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-brand-muted">No hay productos disponibles en esta selección por el momento.</p>
        )}
        <div className="mt-10 text-center">
          <Button variant="secondary" onClick={() => router.push("/all-products")}>Explorar catálogo</Button>
        </div>
      </Container>
    </section>
  );
}
