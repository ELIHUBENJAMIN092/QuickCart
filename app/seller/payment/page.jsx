'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
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
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium">Pagos Confirmados</h2>
          <div className="max-w-4xl rounded-md">
            {paidOrders.length === 0 ? (
              <p>No hay pagos confirmados aún.</p>
            ) : (
              paidOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300"
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
                          .map((item) => `${item.product.name} x ${item.quantity}`)
                          .join(", ")}
                      </span>
                      <span>Items: {order.items.length}</span>
                    </div>
                  </div>

                  {/* Columna 2: Dirección y WhatsApp */}
                  <div>
                    <p>
                      <span className="font-medium">{order.address.fullName}</span>
                      <br />
                      <span>{order.address.area}</span>
                      <br />
                      <span>{`${order.address.city}, ${order.address.state}`}</span>
                      <br />
                      <span>{order.address.phoneNumber}</span>
                      <br />
                      <a
                        href={`https://wa.me/593${order.address.phoneNumber.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:underline mt-1"
                      >
                        <FaWhatsapp size={16} />
                        {order.address.phoneNumber}
                      </a>
                    </p>
                  </div>

                  {/* Columna 3: Monto */}
                  <p className="font-medium my-auto whitespace-nowrap">
                    {currency}{order.amount}
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
      <Footer />
    </div>
  );
};

export default Pagos;
