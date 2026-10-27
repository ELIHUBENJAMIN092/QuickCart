"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock3, Package, RefreshCw, Search, ShoppingBag, Wallet } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import PageHeader from "@/components/seller/PageHeader";
import OrderCard from "@/components/seller/OrderCard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

export default function Orders() {
  const { currency, getToken, user } = useAppContext();
  const confirm = useConfirm();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState("");

  const fetchSellerOrders = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "Error al obtener las órdenes.");
      setOrders(data.orders.filter((order) => !order.isPaid));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Ocurrió un error al obtener las órdenes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    const accepted = await confirm({
      title: "¿Confirmar este pago?",
      message: "La orden pasará a pagos confirmados y dejará de aparecer como pendiente.",
      confirmText: "Sí, confirmar",
    });
    if (!accepted) return;

    setConfirmingId(orderId);
    try {
      const token = await getToken();
      const { data } = await axios.put(`/api/order/update-payment/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo confirmar el pago.");
      toast.success("Pago confirmado.");
      setOrders((current) => current.filter((order) => order._id !== orderId));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error al confirmar el pago.");
    } finally {
      setConfirmingId("");
    }
  };

  useEffect(() => {
    if (user) fetchSellerOrders();
  }, [user]);

  const stats = useMemo(() => ({
    count: orders.length,
    amount: orders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
    units: orders.reduce((sum, order) => sum + (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0), 0),
  }), [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      const address = order.address || {};
      const items = (order.items || []).map((item) => item.product?.name || "").join(" ");
      return [order._id, address.fullName, address.idNumber, address.email, address.phoneNumber, items]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [orders, search]);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 md:p-8">
      {loading ? <Loading /> : (
        <div className="mx-auto max-w-6xl">
          <PageHeader
            eyebrow="Administración · Ventas"
            title="Órdenes pendientes"
            description="Revisa la información del cliente y confirma los pagos recibidos."
            actions={(
              <button
                type="button"
                onClick={() => fetchSellerOrders(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Actualizar
              </button>
            )}
          />

          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-brand-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-brand-muted">Órdenes pendientes</p>
                <ShoppingBag size={16} className="text-brand-accent" />
              </div>
              <p className="mt-2 font-display text-3xl text-brand-ink">{stats.count}</p>
            </article>
            <article className="rounded-xl border border-brand-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-brand-muted">Por confirmar</p>
                <Wallet size={16} className="text-brand-accent" />
              </div>
              <p className="mt-2 break-words font-display text-2xl text-brand-ink">{currency}{stats.amount.toFixed(2)}</p>
            </article>
            <article className="col-span-2 rounded-xl border border-brand-line bg-white p-4 md:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-brand-muted">Unidades comprometidas</p>
                <Package size={16} className="text-brand-accent" />
              </div>
              <p className="mt-2 font-display text-3xl text-brand-ink">{stats.units}</p>
            </article>
          </section>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, cédula, teléfono o producto"
                aria-label="Buscar órdenes"
                className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent"
              />
            </label>
            <p className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
              <Clock3 size={13} /> {filtered.length} de {orders.length} órdenes
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-brand-line bg-white px-6 py-16 text-center">
                <ShoppingBag size={30} className="mx-auto text-brand-muted" />
                <p className="mt-3 font-display text-xl text-brand-ink">{orders.length ? "No hay coincidencias." : "No hay órdenes pendientes."}</p>
                <p className="mt-1 text-sm text-brand-muted">{orders.length ? "Prueba con otra búsqueda." : "Cuando un cliente compre, la orden aparecerá aquí para confirmar el pago."}</p>
              </div>
            ) : (
              filtered.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  currency={currency}
                  confirming={confirmingId === order._id}
                  onConfirm={handleConfirmPayment}
                />
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
