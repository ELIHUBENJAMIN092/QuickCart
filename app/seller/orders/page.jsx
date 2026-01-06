"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";

import { FaWhatsapp } from "react-icons/fa";

const Orders = () => {
  const { currency, getToken, user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error("Error al confirmar el pago.");
    }
  };

  useEffect(() => {
    if (user) fetchSellerOrders();
  }, [user]);

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium">Órdenes Online</h2>

          <div className="max-w-4xl rounded-md">
            {orders.length === 0 ? (
              <p>No hay órdenes pendientes.</p>
            ) : (
              orders.map((order, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300"
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
                  <div className="text-sm text-gray-700">
                    {/* Nombre */}
                    <span className="font-medium block">
                      {order.address?.fullName || "Sin nombre"}
                    </span>

                    {/* Cédula / RUC */}
                    {order.address?.idNumber && (
                      <span className="block text-sm text-gray-700">
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
                      <span className="block text-sm text-blue-700 mt-1">
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
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition flex justify-center items-center gap-2 w-full md:w-auto"
                      >
                        <span>Pagos</span>
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
      <Footer />
    </div>
  );
};

export default Orders;
