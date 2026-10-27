"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BadgeCheck, RefreshCw, Search, Wallet } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import PageHeader from "@/components/seller/PageHeader";
import OrderCard from "@/components/seller/OrderCard";

export default function Pagos() {
  const { currency, getToken, user } = useAppContext();
  const [paidOrders, setPaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPaidOrders = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "Error al obtener los pagos.");
      setPaidOrders(data.orders.filter((order) => order.isPaid === true));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Ocurrió un error al obtener los pagos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchPaidOrders();
  }, [user]);

  const stats = useMemo(() => ({
    count: paidOrders.length,
    amount: paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
  }), [paidOrders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return paidOrders;
    return paidOrders.filter((order) => {
      const address = order.address || {};
      const items = (order.items || []).map((item) => item.product?.name || "").join(" ");
      return [order._id, address.fullName, address.idNumber, address.email, address.phoneNumber, items]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [paidOrders, search]);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 md:p-8">
      {loading ? <Loading /> : (
        <div className="mx-auto max-w-6xl">
          <PageHeader
            eyebrow="Administración · Ventas"
            title="Pagos confirmados"
            description="Consulta el historial de órdenes marcadas como pagadas."
            actions={(
              <button
                type="button"
                onClick={() => fetchPaidOrders(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Actualizar
              </button>
            )}
          />

          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-brand-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-brand-muted">Pagos confirmados</p>
                <BadgeCheck size={16} className="text-brand-success" />
              </div>
              <p className="mt-2 font-display text-3xl text-brand-ink">{stats.count}</p>
            </article>
            <article className="rounded-xl border border-brand-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-brand-muted">Total recaudado</p>
                <Wallet size={16} className="text-brand-success" />
              </div>
              <p className="mt-2 break-words font-display text-2xl text-brand-ink">{currency}{stats.amount.toFixed(2)}</p>
            </article>
          </section>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, cédula, teléfono o producto"
                aria-label="Buscar pagos"
                className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent"
              />
            </label>
            <p className="text-xs text-brand-muted">{filtered.length} de {paidOrders.length} pagos</p>
          </div>

          <div className="mt-4 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-brand-line bg-white px-6 py-16 text-center">
                <BadgeCheck size={30} className="mx-auto text-brand-muted" />
                <p className="mt-3 font-display text-xl text-brand-ink">{paidOrders.length ? "No hay coincidencias." : "No hay pagos confirmados aún."}</p>
                <p className="mt-1 text-sm text-brand-muted">{paidOrders.length ? "Prueba con otra búsqueda." : "Las órdenes que confirmes aparecerán en este historial."}</p>
              </div>
            ) : (
              filtered.map((order) => (
                <OrderCard key={order._id} order={order} currency={currency} paid />
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
