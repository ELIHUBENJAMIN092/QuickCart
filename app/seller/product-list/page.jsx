"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Eye, Package, PackageOpen, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import PageHeader from "@/components/seller/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { categories, getCategoryName, getSubcategoryName, matchesCategoryFilter } from "@/lib/categories";

const stockFilters = [
  { value: "all", label: "Todo el inventario" },
  { value: "available", label: "Disponible" },
  { value: "low", label: "Stock bajo (1–5)" },
  { value: "out", label: "Agotado" },
];

export default function ProductList() {
  const { router, getToken, user, fetchProductData, currency } = useAppContext();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [deletingId, setDeletingId] = useState("");

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/product/seller-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo cargar el inventario.");
      setProducts(data.products);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get("category");
    if (category) setCategoryFilter(category);
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || `${product.name} ${product.description || ""} ${product.category} ${product.subcategory || ""}`.toLowerCase().includes(query);
      const stock = Number(product.stock || 0);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && stock > 5) ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock === 0);
      return matchesSearch && matchesCategoryFilter(product, categoryFilter) && matchesStock;
    });
    if (sortBy === "recent") filtered.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
    if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (sortBy === "stock") filtered.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    if (sortBy === "price") filtered.sort((a, b) => Number(a.offerPrice || 0) - Number(b.offerPrice || 0));
    return filtered;
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  const counts = useMemo(() => ({
    total: products.length,
    available: products.filter((product) => Number(product.stock) > 5).length,
    low: products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length,
    out: products.filter((product) => Number(product.stock) <= 0).length,
  }), [products]);

  const handleDelete = async (productId) => {
    const accepted = await confirm({
      title: "¿Eliminar este producto?",
      message: "Se quitará del catálogo y esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;
    setDeletingId(productId);
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/product/delete/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo eliminar el producto.");
      setProducts((current) => current.filter((product) => product._id !== productId));
      await fetchProductData();
      toast.success("Producto eliminado del catálogo.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setDeletingId("");
    }
  };

  const exportInventory = () => {
    const rows = [
      ["Nombre", "Categoría", "Subcategoría", "Precio", "Precio oferta", "Stock"],
      ...filteredProducts.map((product) => [
        product.name,
        getCategoryName(product.category),
        product.subcategory ? getSubcategoryName(product.category, product.subcategory) : "",
        product.price,
        product.offerPrice,
        product.stock,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario-compel.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderActions = (product) => (
    <div className="flex items-center gap-1.5">
      <button onClick={() => router.push(`/product/${product._id}`)} title="Ver en tienda" aria-label={`Ver ${product.name} en tienda`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-muted transition hover:border-brand-accent hover:text-brand-accent sm:h-9 sm:w-9"><Eye size={16} /></button>
      <button onClick={() => router.push(`/seller/edit-product/${product._id}`)} title="Editar producto" aria-label={`Editar ${product.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-accent transition hover:bg-brand-sand sm:h-9 sm:w-9"><Pencil size={16} /></button>
      <button onClick={() => handleDelete(product._id)} disabled={deletingId === product._id} title="Eliminar producto" aria-label={`Eliminar ${product.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-sale transition hover:bg-red-50 disabled:opacity-40 sm:h-9 sm:w-9"><Trash2 size={16} /></button>
    </div>
  );

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("all");
  };

  const stats = [
    { label: "En catálogo", value: counts.total, hint: "Inventario total", icon: Package, tone: "bg-brand-accent-soft text-brand-accent" },
    { label: "Disponibles", value: counts.available, hint: "Más de 5 unidades", icon: CheckCircle2, tone: "bg-brand-success/10 text-brand-success" },
    { label: "Stock bajo", value: counts.low, hint: "1 a 5 unidades", icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
    { label: "Agotados", value: counts.out, hint: "Requieren reposición", icon: XCircle, tone: "bg-red-50 text-brand-sale" },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between">
      {loading ? <Loading /> : (
        <main className="w-full p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <PageHeader
              className="mb-6"
              eyebrow="Administración · Inventario"
              title="Todos los productos"
              description="Gestiona el catálogo, el stock y la publicación de tus productos."
              actions={(
                <>
                  <button onClick={exportInventory} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent sm:flex-none"><Download size={15} /> Exportar CSV</button>
                  <Link href="/seller" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-accent-hover sm:flex-none"><Plus size={16} /> Añadir producto</Link>
                </>
              )}
            />

            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-brand-muted">{item.label}</p>
                        <p className="mt-1.5 font-display text-2xl leading-none text-brand-ink sm:text-3xl">{item.value}</p>
                      </div>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone}`}><Icon size={17} /></span>
                    </div>
                    <p className="mt-2.5 text-[10px] leading-4 text-brand-muted">{item.hint}</p>
                  </article>
                );
              })}
            </div>

            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
              <div className="grid grid-cols-2 gap-2.5 border-b border-brand-line p-3 sm:gap-3 sm:p-4 lg:grid-cols-[minmax(220px,1fr)_200px_170px_170px]">
                <label className="relative col-span-2 lg:col-span-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre o descripción" aria-label="Buscar productos" className="min-h-11 w-full rounded-xl border border-brand-line bg-brand-sand/40 py-2.5 pl-9 pr-4 text-base outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-xs" />
                </label>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar categoría" className="col-span-2 min-h-11 rounded-xl border border-brand-line bg-brand-sand/40 px-3 py-2.5 text-base outline-none transition focus:border-brand-accent sm:text-xs lg:col-span-1">
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <optgroup key={category.slug} label={category.name}>
                      <option value={category.slug}>{category.name}</option>
                      {category.subcategories.map((subcategory) => <option key={subcategory.slug} value={`${category.slug}/${subcategory.slug}`}>{subcategory.label || subcategory.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filtrar inventario" className="min-h-11 rounded-xl border border-brand-line bg-brand-sand/40 px-3 py-2.5 text-base outline-none transition focus:border-brand-accent sm:text-xs">
                  {stockFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Ordenar productos" className="min-h-11 rounded-xl border border-brand-line bg-brand-sand/40 px-3 py-2.5 text-base outline-none transition focus:border-brand-accent sm:text-xs">
                  <option value="recent">Más recientes</option>
                  <option value="name">Nombre A–Z</option>
                  <option value="stock">Menor stock</option>
                  <option value="price">Menor precio</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-brand-muted">
                <span className="rounded-full bg-brand-sand px-2.5 py-1 font-medium text-brand-charcoal">{filteredProducts.length} de {products.length} productos</span>
                {(search || categoryFilter || stockFilter !== "all") && <button onClick={clearFilters} className="rounded-full px-2 py-1 font-medium text-brand-accent hover:underline">Limpiar filtros</button>}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-accent-soft text-brand-accent"><PackageOpen size={24} /></span>
                  <p className="mt-4 font-display text-xl text-brand-ink sm:text-2xl">{products.length ? "No hay coincidencias." : "Tu catálogo aún está vacío."}</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brand-muted">{products.length ? "Prueba con otros filtros de búsqueda." : "Añade tu primer producto para publicarlo en la tienda."}</p>
                  {!products.length && <Link href="/seller" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover">Añadir producto</Link>}
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[850px]">
                      <thead className="bg-brand-sand/60 text-left text-[10px] uppercase tracking-wider text-brand-muted">
                        <tr><th className="px-5 py-3 font-semibold">Producto</th><th className="px-4 py-3 font-semibold">Categoría</th><th className="px-4 py-3 font-semibold">Precio</th><th className="px-4 py-3 font-semibold">Stock</th><th className="px-5 py-3 text-right font-semibold">Acciones</th></tr>
                      </thead>
                      <tbody className="divide-y divide-brand-line">
                        {filteredProducts.map((product) => (
                          <tr key={product._id} className="transition hover:bg-brand-sand/30">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-line bg-brand-sand/40">
                                  {product.image?.[0] && <Image src={product.image[0]} alt="" fill sizes="48px" className="object-contain p-1" />}
                                </div>
                                <div className="max-w-xs"><p className="truncate text-sm font-medium text-brand-ink">{product.name}</p><p className="mt-1 truncate text-[10px] text-brand-muted">{product.description}</p></div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-brand-charcoal">{getCategoryName(product.category)}{product.subcategory && <span className="mt-1 block text-[10px] text-brand-muted">{getSubcategoryName(product.category, product.subcategory)}</span>}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs"><span className="font-semibold text-brand-ink">{currency}{Number(product.offerPrice ?? product.price).toFixed(2)}</span>{Number(product.offerPrice) > 0 && Number(product.offerPrice) < Number(product.price) && <span className="ml-2 text-brand-muted line-through">{currency}{Number(product.price).toFixed(2)}</span>}</td>
                            <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${Number(product.stock) > 5 ? "bg-brand-success/10 text-brand-success" : Number(product.stock) > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-brand-sale"}`}>{Number(product.stock) > 0 ? `${product.stock} unidades` : "Agotado"}</span></td>
                            <td className="px-5 py-3"><div className="flex justify-end">{renderActions(product)}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-brand-line lg:hidden">
                    {filteredProducts.map((product) => (
                      <article key={product._id} className="p-4">
                        <div className="flex gap-3">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-brand-line bg-brand-sand/40">
                            {product.image?.[0] && <Image src={product.image[0]} alt="" fill sizes="80px" className="object-contain p-1.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-brand-ink">{product.name}</h2>
                                <p className="mt-1 truncate text-[10px] text-brand-muted">{getCategoryName(product.category)}{product.subcategory ? ` · ${getSubcategoryName(product.category, product.subcategory)}` : ""}</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${Number(product.stock) > 5 ? "bg-brand-success/10 text-brand-success" : Number(product.stock) > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-brand-sale"}`}>{Number(product.stock) > 0 ? `${product.stock} u.` : "Agotado"}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-brand-ink">{currency}{Number(product.offerPrice ?? product.price).toFixed(2)}</p>
                                {Number(product.offerPrice) > 0 && Number(product.offerPrice) < Number(product.price) && <p className="text-[10px] text-brand-muted line-through">{currency}{Number(product.price).toFixed(2)}</p>}
                              </div>
                              {renderActions(product)}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
