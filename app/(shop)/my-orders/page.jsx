"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";

const MyOrders = () => {
  const { authLoading, currency, getToken, user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
        setOrders([]);
      }
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data } = await axios.get("/api/order/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudieron cargar tus órdenes.");
      setOrders([...data.orders].reverse());
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "No se pudieron cargar tus órdenes.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, getToken, user]);

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 0);
    return () => clearTimeout(timeout);
  }, [fetchOrders]);

  return (
    <main className="min-h-[65vh] px-6 py-10 md:px-16 lg:px-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent">Tu cuenta</p>
            <h1 className="mt-2 font-display text-3xl text-brand-ink">Mis órdenes</h1>
          </div>
          {user && !loading && !error && (
            <button type="button" onClick={fetchOrders} className="text-sm font-medium text-brand-accent hover:underline">
              Actualizar
            </button>
          )}
        </div>

        {authLoading ? (
          <Loading />
        ) : !user ? (
          <div className="border border-brand-line bg-white px-6 py-12 text-center">
            <p className="font-display text-2xl text-brand-ink">Inicia sesión para ver tus órdenes.</p>
            <Link href="/sign-in" className="mt-5 inline-flex bg-brand-accent px-6 py-3 text-sm font-semibold text-white">
              Iniciar sesión
            </Link>
          </div>
        ) : loading ? (
          <Loading />
        ) : error ? (
          <div role="alert" className="border border-red-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-brand-sale">{error}</p>
            <button type="button" onClick={fetchOrders} className="mt-4 text-sm font-semibold text-brand-accent hover:underline">
              Intentar de nuevo
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-brand-line bg-white px-6 py-12 text-center">
            <p className="font-display text-2xl text-brand-ink">Aún no tienes órdenes.</p>
            <Link href="/all-products" className="mt-5 inline-flex bg-brand-accent px-6 py-3 text-sm font-semibold text-white">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-brand-line border-y border-brand-line bg-white">
            {orders.map((order) => {
              const address = order.address || {};
              return (
                <article key={order._id} className="flex flex-col justify-between gap-5 p-5 md:flex-row">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <Image
                      className="h-16 w-16 shrink-0 object-contain"
                      src={assets.box_icon}
                      alt=""
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink">
                        {(order.items || []).map((item, index) => (
                          <span key={`${item.product?._id || "deleted"}-${index}`}>
                            {index > 0 ? ", " : ""}
                            {item.product?.name || "Producto eliminado"} × {item.quantity}
                          </span>
                        ))}
                      </p>
                      <p className="mt-2 text-xs text-brand-muted">{(order.items || []).length} productos</p>
                    </div>
                  </div>

                  <div className="text-sm text-brand-charcoal">
                    <p className="font-medium text-brand-ink">{address.fullName || "Cliente"}</p>
                    <p>{address.area}</p>
                    <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
                    <p>{address.phoneNumber}</p>
                  </div>

                  <div className="shrink-0 text-sm md:text-right">
                    <p className="font-semibold text-brand-ink">{currency}{Number(order.amount || 0).toFixed(2)}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {order.date ? new Date(order.date).toLocaleDateString("es-EC") : "Fecha no disponible"}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${order.isPaid ? "text-brand-success" : "text-amber-700"}`}>
                      {order.isPaid ? "Pago confirmado" : "Pago pendiente · contra entrega"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrders;
