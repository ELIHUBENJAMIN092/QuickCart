"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";

import { FaWhatsapp } from "react-icons/fa";

const Orders = () => {
  const { currency, getToken, user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState("");

  const fetchSellerOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const ordersPendientes = data.orders.filter(
          (order) => !order.isPaid
        );
        setOrders(ordersPendientes);
      } else {
        toast.error(data.message || "Error al obtener las órdenes.");
      }
    } catch (error) {
      toast.error(
        error.message || "Ocurrió un error al obtener las órdenes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    setConfirmingId(orderId);
    try {
      const token = await getToken();
      const { data } = await axios.put(
        `/api/order/update-payment/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Pago confirmado.");
        setOrders((prev) =>
          prev.filter((order) => order._id !== orderId)
        );
      } else {
        toast.error("No se pudo confirmar el pago.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error al confirmar el pago.");
    } finally {
      setConfirmingId("");
    }
  };

  useEffect(() => {
    if (user) fetchSellerOrders();
  }, [user]);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 bg-brand-cream p-4 text-sm md:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Administración · Ventas</p>
            <h1 className="mt-2 font-display text-3xl text-brand-ink">Órdenes pendientes</h1>
            <p className="mt-2 text-sm text-brand-muted">Revisa la información del cliente y confirma los pagos recibidos.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
            {orders.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm text-brand-muted">No hay órdenes pendientes.</p>
            ) : (
              orders.map((order, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between gap-5 border-b border-brand-line p-5 last:border-b-0 md:flex-row md:items-center"
                >
                  {/* Columna 1: Productos */}
                  <div className="flex-1 flex gap-5 max-w-80">
                    <Image
                      className="w-16 h-16 object-cover"
                      src={assets.box_icon}
                      alt="box_icon"
                    />
                    <div className="flex flex-col gap-3">
                      <span className="font-medium">
                        {order.items
                          .map((item) => {
                            const nombre =
                              item?.product?.name ||
                              "Producto eliminado";
                            return `${nombre} x ${item.quantity}`;
                          })
                          .join(", ")}
                      </span>
                      <span>Items: {order.items.length}</span>
                    </div>
                  </div>

                  {/* Columna 2: Datos del cliente */}
                  <div className="text-sm text-brand-charcoal">
                    {/* Nombre */}
                    <span className="font-medium block">
                      {order.address?.fullName || "Sin nombre"}
                    </span>

                    {/* Cédula / RUC */}
                    {order.address?.idNumber && (
                      <span className="block text-sm text-brand-charcoal">
                        C.I:{" "}
                        <span className="font-medium">
                          {order.address.idNumber}
                        </span>
                      </span>
                    )}

                    {/* Dirección */}
                    <span className="block mt-1">
                      {order.address?.area || "Sin dirección"}
                    </span>

                    <span className="block">
                      {order.address?.city},{" "}
                      {order.address?.state}
                    </span>

                    {/* 📧 Correo electrónico */}
                    {order.address?.email && (
                      <span className="block text-sm text-brand-accent mt-1">
                        {" "}
                        <span className="font-medium">
                          {order.address.email}
                        </span>
                      </span>
                    )}

                    {/* 📱 WhatsApp (sin cambios) */}
                    {order.address?.phoneNumber ? (
                      <a
                        href={`https://wa.me/593${order.address.phoneNumber.replace(
                          /^0/,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:underline mt-1"
                      >
                        <FaWhatsapp size={16} />
                        {order.address.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-red-500 text-xs mt-1 block">
                        No dejó teléfono
                      </span>
                    )}
                  </div>

                  {/* Columna 3: Monto */}
                  <div className="font-medium my-auto whitespace-nowrap">
                    {currency}
                    {order.amount}
                  </div>

                  {/* Columna 4: Datos adicionales */}
                  <div className="my-auto">
                    <div className="flex flex-col gap-1">
                      <span>Detalles:</span>
                      <span>
                        Fecha:{" "}
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                      <span>Pago: Pendiente</span>

                      <button
                        onClick={() =>
                          handleConfirmPayment(order._id)
                        }
                        disabled={confirmingId === order._id}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60 md:w-auto"
                      >
                        <span>{confirmingId === order._id ? "Confirmando..." : "Confirmar pago"}</span>
                        <Image
                          className="h-4 w-auto"
                          src={assets.redirect_icon}
                          alt="redirect_icon"
                        />
                      </button>
                    </div>
                </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Orders;
