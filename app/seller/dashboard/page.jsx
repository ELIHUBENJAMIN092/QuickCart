"use client";

import Link from "next/link";
import { ArrowRight, Boxes, CircleDollarSign, PackageCheck, PackagePlus, TriangleAlert } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { categories, getCategoryName, getSubcategoryName, matchesCategoryFilter } from "@/lib/categories";

export default function SellerDashboard() {
  const { products, router } = useAppContext();
  const totalUnits = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5);
  const outOfStock = products.filter((product) => Number(product.stock) <= 0);
  const estimatedValue = products.reduce(
    (sum, product) => sum + Number(product.offerPrice ?? product.price) * Number(product.stock || 0),
    0
  );
  const stats = [
    { label: "Productos en catálogo", value: products.length, note: "Registros publicados", icon: Boxes },
    { label: "Unidades disponibles", value: totalUnits.toLocaleString("es-EC"), note: "Suma del inventario actual", icon: PackageCheck },
    { label: "Stock bajo", value: lowStock.length, note: "Cinco o menos unidades", icon: TriangleAlert },
    { label: "Valor del inventario", value: `$${estimatedValue.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, note: "Estimado según precio actual", icon: CircleDollarSign },
  ];

  if (products.length === 0) {
    return (
      <main className="grid min-h-[70vh] flex-1 place-items-center bg-brand-cream p-6">
        <div className="max-w-md text-center">
          <PackagePlus className="mx-auto text-brand-accent" size={38} />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Administración</p>
          <h1 className="mt-2 font-display text-3xl text-brand-ink">Prepara tu catálogo.</h1>
          <p className="mt-3 text-sm leading-6 text-brand-muted">Cuando agregues productos podrás revisar aquí el inventario y las alertas de stock.</p>
          <Link href="/seller" className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover">Añadir producto</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-brand-cream p-4 md:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Vista general</p>
          <h1 className="mt-2 font-display text-3xl text-brand-ink md:text-4xl">Resumen del catálogo.</h1>
          <p className="mt-2 text-sm text-brand-muted">Una vista rápida de productos, inventario y categorías.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/seller" className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-xs font-semibold text-white hover:bg-brand-accent-hover"><PackagePlus size={16} /> Añadir producto</Link>
          <Link href="/seller/product-list" className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-5 py-3 text-xs font-semibold text-brand-ink hover:border-brand-accent">Gestionar catálogo <ArrowRight size={15} /></Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-brand-line bg-white p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-brand-muted">{label}</p>
              <Icon size={17} className="shrink-0 text-brand-accent" />
            </div>
            <p className="mt-4 break-words font-display text-2xl text-brand-ink md:text-3xl">{value}</p>
            <p className="mt-1 text-[10px] text-brand-muted">{note}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-brand-line bg-white p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Organización</p><h2 className="mt-1 font-display text-2xl text-brand-ink">Categorías</h2></div>
            <Link href="/seller/product-list" className="text-xs font-semibold text-brand-accent hover:underline">Administrar</Link>
          </div>
          <div className="space-y-4">
            {categories.map((category) => {
              const count = products.filter((product) => matchesCategoryFilter(product, category.slug)).length;
              return (
                <button key={category.slug} onClick={() => router.push(`/seller/product-list?category=${category.slug}`)} className="w-full text-left">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-brand-charcoal">{category.name}</span>
                    <span className="text-brand-muted">{count} productos</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-brand-cream"><div className="h-full rounded-full bg-brand-accent" style={{ width: `${products.length ? (count / products.length) * 100 : 0}%` }} /></div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-brand-line bg-white p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Atención requerida</p><h2 className="mt-1 font-display text-2xl text-brand-ink">Revisar inventario</h2></div>
            <span className="rounded-full bg-brand-sand px-3 py-1 text-[10px] font-semibold text-brand-charcoal">{lowStock.length + outOfStock.length} alertas</span>
          </div>
          {lowStock.length + outOfStock.length === 0 ? (
            <p className="rounded-lg bg-brand-success/5 px-4 py-6 text-center text-sm text-brand-success">Todo el inventario tiene más de cinco unidades.</p>
          ) : (
            <div className="divide-y divide-brand-line">
              {[...outOfStock, ...lowStock].slice(0, 6).map((product) => (
                <div key={product._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-brand-ink">{product.name}</p><p className="mt-1 truncate text-[10px] text-brand-muted">{getCategoryName(product.category)}{product.subcategory ? ` · ${getSubcategoryName(product.category, product.subcategory)}` : ""}</p></div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${Number(product.stock) ? "bg-amber-50 text-amber-700" : "bg-red-50 text-brand-sale"}`}>{Number(product.stock) ? `${product.stock} uds.` : "Agotado"}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/seller/product-list" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-accent hover:underline">Abrir inventario <ArrowRight size={14} /></Link>
        </section>
      </div>
    </main>
  );
}
