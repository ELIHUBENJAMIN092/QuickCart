"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
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
    <div className="flex items-center gap-2">
      <button onClick={() => router.push(`/product/${product._id}`)} title="Ver en tienda" aria-label={`Ver ${product.name} en tienda`} className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-muted transition hover:border-brand-accent hover:text-brand-accent"><Eye size={16} /></button>
      <button onClick={() => router.push(`/seller/edit-product/${product._id}`)} title="Editar producto" aria-label={`Editar ${product.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-accent transition hover:bg-brand-sand"><Pencil size={16} /></button>
      <button onClick={() => handleDelete(product._id)} disabled={deletingId === product._id} title="Eliminar producto" aria-label={`Eliminar ${product.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-sale transition hover:bg-red-50 disabled:opacity-40"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-between bg-brand-cream">
      {loading ? <Loading /> : (
        <main className="w-full p-4 md:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Administración · Inventario</p>
              <h1 className="mt-2 font-display text-3xl text-brand-ink">Todos los productos</h1>
              <p className="mt-2 text-sm text-brand-muted">Gestiona el catálogo, el stock y la publicación de tus productos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportInventory} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:border-brand-accent"><Download size={15} /> Exportar CSV</button>
              <Link href="/seller" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-accent-hover"><Plus size={16} /> Añadir producto</Link>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: "Productos en catálogo", value: counts.total, hint: "Inventario total" },
              { label: "Disponibles", value: counts.available, hint: "Más de 5 unidades" },
              { label: "Stock bajo", value: counts.low, hint: "1 a 5 unidades" },
              { label: "Agotados", value: counts.out, hint: "Requieren reposición" },
            ].map((item) => (
              <article key={item.label} className="rounded-xl border border-brand-line bg-white p-4 md:p-5">
                <p className="text-xs text-brand-muted">{item.label}</p>
                <p className="mt-2 font-display text-3xl text-brand-ink">{item.value}</p>
                <p className="mt-1 text-[10px] text-brand-muted">{item.hint}</p>
              </article>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-brand-line bg-white">
            <div className="grid gap-3 border-b border-brand-line p-4 md:grid-cols-[minmax(220px,1fr)_220px_180px_180px]">
              <label className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre o descripción" aria-label="Buscar productos" className="w-full rounded-full border border-brand-line bg-brand-cream py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent" />
              </label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar categoría" className="rounded-full border border-brand-line bg-brand-cream px-4 py-2.5 text-xs outline-none focus:border-brand-accent">
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <optgroup key={category.slug} label={category.name}>
                    <option value={category.slug}>{category.name}</option>
                    {category.subcategories.map((subcategory) => <option key={subcategory.slug} value={`${category.slug}/${subcategory.slug}`}>{subcategory.label || subcategory.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filtrar inventario" className="rounded-full border border-brand-line bg-brand-cream px-4 py-2.5 text-xs outline-none focus:border-brand-accent">
                {stockFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Ordenar productos" className="rounded-full border border-brand-line bg-brand-cream px-4 py-2.5 text-xs outline-none focus:border-brand-accent">
                <option value="recent">Más recientes</option>
                <option value="name">Nombre A–Z</option>
                <option value="stock">Menor stock</option>
                <option value="price">Menor precio</option>
              </select>
            </div>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-muted">
              <span>{filteredProducts.length} de {products.length} productos</span>
              {(search || categoryFilter || stockFilter !== "all") && <button onClick={() => { setSearch(""); setCategoryFilter(""); setStockFilter("all"); }} className="font-medium text-brand-accent hover:underline">Limpiar filtros</button>}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-display text-2xl text-brand-ink">{products.length ? "No hay coincidencias." : "Tu catálogo aún está vacío."}</p>
                <p className="mt-2 text-sm text-brand-muted">{products.length ? "Prueba con otros filtros de búsqueda." : "Añade tu primer producto para publicarlo en la tienda."}</p>
                {!products.length && <Link href="/seller" className="mt-5 inline-flex rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white">Añadir producto</Link>}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[850px]">
                    <thead className="bg-brand-sand/70 text-left text-[10px] uppercase tracking-wider text-brand-muted">
                      <tr><th className="px-5 py-3 font-semibold">Producto</th><th className="px-4 py-3 font-semibold">Categoría</th><th className="px-4 py-3 font-semibold">Precio</th><th className="px-4 py-3 font-semibold">Stock</th><th className="px-5 py-3 text-right font-semibold">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="transition hover:bg-brand-cream/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 bg-brand-cream">
                                {product.image?.[0] && <Image src={product.image[0]} alt="" fill sizes="48px" className="object-contain p-1" />}
                              </div>
                              <div className="max-w-xs"><p className="truncate text-sm font-medium text-brand-ink">{product.name}</p><p className="mt-1 truncate text-[10px] text-brand-muted">{product.description}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-brand-charcoal">{getCategoryName(product.category)}{product.subcategory && <span className="block mt-1 text-[10px] text-brand-muted">{getSubcategoryName(product.category, product.subcategory)}</span>}</td>
                          <td className="px-4 py-3 text-xs"><span className="font-semibold text-brand-ink">{currency}{Number(product.offerPrice ?? product.price).toFixed(2)}</span>{Number(product.offerPrice) < Number(product.price) && <span className="ml-2 text-brand-muted line-through">{currency}{Number(product.price).toFixed(2)}</span>}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${Number(product.stock) > 5 ? "bg-brand-success/10 text-brand-success" : Number(product.stock) > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-brand-sale"}`}>{Number(product.stock) > 0 ? `${product.stock} unidades` : "Agotado"}</span></td>
                          <td className="px-5 py-3"><div className="flex justify-end">{renderActions(product)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-brand-line lg:hidden">
                  {filteredProducts.map((product) => (
                    <article key={product._id} className="flex gap-3 p-4">
                      <div className="relative h-16 w-16 shrink-0 bg-brand-cream">
                        {product.image?.[0] && <Image src={product.image[0]} alt="" fill sizes="64px" className="object-contain p-1" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-sm font-semibold text-brand-ink">{product.name}</h2>
                        <p className="mt-1 truncate text-[10px] text-brand-muted">{getCategoryName(product.category)}{product.subcategory ? ` · ${getSubcategoryName(product.category, product.subcategory)}` : ""}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-ink">{currency}{Number(product.offerPrice ?? product.price).toFixed(2)}</span>
                          <span className={`text-[10px] font-semibold ${Number(product.stock) > 0 ? "text-brand-success" : "text-brand-sale"}`}>{Number(product.stock) > 0 ? `Stock: ${product.stock}` : "Agotado"}</span>
                        </div>
                        <div className="mt-3">{renderActions(product)}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
