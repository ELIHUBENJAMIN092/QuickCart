"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, BadgeCheck, Boxes, CircleDollarSign, Clock3, PackageCheck, PackagePlus, TriangleAlert, Wallet } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { categories, getCategoryName, getSubcategoryName, matchesCategoryFilter } from "@/lib/categories";

export default function SellerDashboard() {
  const { authLoading, products, productsLoading, productsError, fetchProductData, router, user, getToken, currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!user) {
      if (!authLoading) {
        setOrdersLoading(false);
        setOrders([]);
      }
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudieron cargar las órdenes.");
      setOrders(data.orders);
    } catch (error) {
      setOrdersError(error.response?.data?.message || error.message || "No se pudieron cargar las órdenes.");
    } finally {
      setOrdersLoading(false);
    }
  }, [authLoading, getToken, user]);

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 0);
    return () => clearTimeout(timeout);
  }, [fetchOrders]);

  const sales = useMemo(() => {
    const pending = orders.filter((order) => !order.isPaid);
    const paid = orders.filter((order) => order.isPaid);
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      paidAmount: paid.reduce((sum, order) => sum + Number(order.amount || 0), 0),
    };
  }, [orders]);
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
    { label: "Valor del inventario", value: `${currency}${estimatedValue.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, note: "Estimado según precio actual", icon: CircleDollarSign },
  ];

  if (productsLoading) {
    return (
      <main className="grid min-h-[70vh] flex-1 place-items-center p-6">
        <p role="status" className="text-sm text-brand-muted">Cargando el inventario...</p>
      </main>
    );
  }

  if (productsError && products.length === 0) {
    return (
      <main className="grid min-h-[70vh] flex-1 place-items-center p-6">
        <div role="alert" className="max-w-md text-center">
          <p className="text-sm text-brand-sale">{productsError}</p>
          <button type="button" onClick={fetchProductData} className="mt-4 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white">
            Reintentar carga del inventario
          </button>
        </div>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main className="grid min-h-[70vh] flex-1 place-items-center p-6">
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

  const salesValue = (value) => {
    if (ordersLoading) return "Cargando…";
    if (ordersError) return "—";
    return value;
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <PageHeader
        className="mb-7"
        eyebrow="Vista general"
        title="Resumen del negocio"
        description="Una vista rápida de productos, inventario y ventas."
        actions={(
          <>
            <Link href="/seller" className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-xs font-semibold text-white hover:bg-brand-accent-hover"><PackagePlus size={16} /> Añadir producto</Link>
            <Link href="/seller/product-list" className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-5 py-3 text-xs font-semibold text-brand-ink hover:border-brand-accent">Gestionar catálogo <ArrowRight size={15} /></Link>
          </>
        )}
      />

      {productsError && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <span>No se pudo actualizar el inventario: {productsError}</span>
          <button type="button" onClick={fetchProductData} className="font-semibold underline">Reintentar</button>
        </div>
      )}

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

      <section className="mt-6 rounded-xl border border-brand-line bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Ventas</p>
            <h2 className="mt-1 font-display text-xl text-brand-ink">Movimiento de órdenes</h2>
          </div>
          <Link href="/seller/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline">Ver órdenes <ArrowRight size={14} /></Link>
        </div>
        {ordersError && (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-xs text-brand-sale">
            <span>No se pudo cargar el resumen de órdenes: {ordersError}</span>
            <button type="button" onClick={fetchOrders} className="font-semibold underline">Reintentar</button>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/seller/orders" className="flex items-center gap-3 rounded-xl bg-brand-sand px-4 py-3 transition hover:bg-brand-line/50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-accent"><Clock3 size={18} /></span>
            <span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-muted">Por confirmar</span>
              <span className="block text-lg font-semibold text-brand-ink">{salesValue(`${sales.pendingCount} órdenes`)}</span>
            </span>
          </Link>
          <Link href="/seller/orders" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-brand-line transition hover:ring-brand-accent">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"><Wallet size={18} /></span>
            <span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-muted">Por cobrar</span>
              <span className="block text-lg font-semibold text-brand-ink">{salesValue(`${currency}${sales.pendingAmount.toFixed(2)}`)}</span>
            </span>
          </Link>
          <Link href="/seller/pagos" className="flex items-center gap-3 rounded-xl bg-brand-success/5 px-4 py-3 ring-1 ring-brand-success/15 transition hover:ring-brand-success/40">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-success"><BadgeCheck size={18} /></span>
            <span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-muted">Recaudado</span>
              <span className="block text-lg font-semibold text-brand-ink">{salesValue(`${currency}${sales.paidAmount.toFixed(2)}`)}</span>
            </span>
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-brand-line bg-white p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Organización</p><h2 className="mt-1 font-display text-2xl text-brand-ink">Categorías</h2></div>
            <Link href="/seller/categories" className="text-xs font-semibold text-brand-accent hover:underline">Administrar</Link>
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
