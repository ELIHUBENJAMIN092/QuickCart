'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { FaWhatsapp } from "react-icons/fa";

const Pagos = () => {
  const { currency, getToken, user } = useAppContext();

  const [paidOrders, setPaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPaidOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const pagosConfirmados = data.orders.filter((order) => order.isPaid === true);
        setPaidOrders(pagosConfirmados);
      } else {
        toast.error(data.message || "Error al obtener los pagos.");
      }
    } catch (error) {
      toast.error(error.message || "Ocurrió un error al obtener los pagos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPaidOrders();
    }
  }, [user]);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 bg-brand-cream p-4 text-sm md:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Administración · Ventas</p>
            <h1 className="mt-2 font-display text-3xl text-brand-ink">Pagos confirmados</h1>
            <p className="mt-2 text-sm text-brand-muted">Consulta las órdenes marcadas como pagadas.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
            {paidOrders.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm text-brand-muted">No hay pagos confirmados aún.</p>
            ) : (
              paidOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between gap-5 border-b border-brand-line p-5 last:border-b-0 md:flex-row md:items-center"
                >
                  {/* Columna 1: Imagen y productos */}
                  <div className="flex-1 flex gap-5 max-w-80">
                    <Image
                      className="w-16 h-16 object-cover"
                      src={assets.box_icon}
                      alt="box_icon"
                    />
                    <div className="flex flex-col gap-3">
                      <span className="font-medium">
                        {order.items
                          .map((item) =>
                            item.product
                              ? `${item.product.name} x ${item.quantity}`
                              : `Producto eliminado x ${item.quantity}`
                          )
                          .join(", ")}
                      </span>
                      <span>Items: {order.items.length}</span>
                    </div>
                  </div>

                  {/* Columna 2: Dirección y WhatsApp */}
                  <div>
                    <p>
                      <span className="font-medium">{order.address?.fullName || "Sin nombre"}</span>
                      <br />
                      <span>{order.address?.area || "Sin dirección"}</span>
                      <br />
                      <span>{`${order.address?.city || ""}, ${order.address?.state || ""}`}</span>
                      <br />
                      <span>{order.address?.phoneNumber || "Sin teléfono"}</span>
                      <br />
                      {order.address?.phoneNumber ? (
                        <a
                          href={`https://wa.me/593${order.address.phoneNumber.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:underline mt-1"
                        >
                          <FaWhatsapp size={16} />
                          {order.address.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Teléfono no disponible</span>
                      )}
                    </p>
                  </div>

                  {/* Columna 3: Monto */}
                  <p className="font-medium my-auto whitespace-nowrap">
                    {currency}
                    {order.amount}
                  </p>

                  {/* Columna 4: Datos adicionales */}
                  <div className="my-auto">
                    <p className="flex flex-col">
                      <span>Método: COD</span>
                      <span>Fecha: {new Date(order.date).toLocaleDateString()}</span>
                      <span className="text-green-600 font-semibold">Pago Confirmado</span>
                    </p>
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

export default Pagos;
