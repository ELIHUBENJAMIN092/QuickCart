'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa"; // ✅ Importar icono de WhatsApp

const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();

            const { data } = await axios.get(
                '/api/order/seller-orders',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setOrders(data.orders);
                setLoading(false);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? (
                <Loading />
            ) : (
                <div className="md:p-10 p-4 space-y-5">
                    <h2 className="text-lg font-medium">Ordenes Online</h2>
                    <div className="max-w-4xl rounded-md">
                        {orders.map((order, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium">
                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                        </span>
                                        <span>Items : {order.items.length}</span>
                                    </p>
                                </div>

                                <div>
                                    <p>
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span>{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
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

                                <p className="font-medium my-auto">{currency}{order.amount}</p>

                                <div>
                                    <p className="flex flex-col">
                                        <span>Método: COD</span>
                                        <span>Fecha: {new Date(order.date).toLocaleDateString()}</span>
                                        <span>Pago: Pendiente Generar DataLink</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;
