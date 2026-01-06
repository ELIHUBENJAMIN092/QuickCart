"use client";

import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
  } = useAppContext();

  // 📦 Dirección + datos del cliente
  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    idNumber: "",
    area: "",
    city: "",
    state: "",
  });

  // 🔄 Autocompletar nombre y correo desde CLERK
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  // ✅ Validaciones Ecuador
  const validatePhone = (phone) => /^09\d{8}$/.test(phone);
  const validateIdNumber = (id) => /^\d{10}$|^\d{13}$/.test(id);
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const createOrder = async () => {
    try {
      if (!user) {
        return toast("Por favor inicia sesión", { icon: "⚠️" });
      }

      const {
        fullName,
        email,
        phoneNumber,
        idNumber,
        area,
        city,
        state,
      } = address;

      if (
        !fullName ||
        !email ||
        !phoneNumber ||
        !idNumber ||
        !area ||
        !city ||
        !state
      ) {
        return toast.error("Completa todos los campos obligatorios");
      }

      if (!validateEmail(email)) {
        return toast.error("Correo electrónico inválido");
      }

      if (!validatePhone(phoneNumber)) {
        return toast.error(
          "Número celular inválido. Debe iniciar con 09 y tener 10 dígitos"
        );
      }

      if (!validateIdNumber(idNumber)) {
        return toast.error(
          "Cédula o RUC inválido. Debe tener 10 o 13 dígitos"
        );
      }

      const items = Object.keys(cartItems)
        .map((key) => ({
          product: key,
          quantity: cartItems[key],
        }))
        .filter((item) => item.quantity > 0);

      if (items.length === 0) {
        return toast.error("El carrito está vacío");
      }

      const token = await getToken();

      const { data } = await axios.post(
        "/api/order/create",
        {
          address,
          items,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success("Orden creada con éxito");
        setCartItems({});
        router.push("/order-placed");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Orden de Compra
      </h2>

      <hr className="border-gray-500/30 my-5" />

      {/* 📍 Datos del cliente */}
      <div className="space-y-3">
        <input
          name="fullName"
          placeholder="Nombre completo"
          value={address.fullName}
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={address.email}
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="idNumber"
          placeholder="Cédula o RUC"
          value={address.idNumber}
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="phoneNumber"
          placeholder="Teléfono celular (09xxxxxxxx)"
          value={address.phoneNumber}
          onChange={handleChange}
          className="w-full border p-2"
        />

        <textarea
          name="area"
          placeholder="Dirección / Sector"
          value={address.area}
          onChange={handleChange}
          className="w-full border p-2 resize-none"
          rows={3}
        />

        <input
          name="city"
          placeholder="Ciudad"
          value={address.city}
          onChange={handleChange}
          className="w-full border p-2"
        />

        <input
          name="state"
          placeholder="Provincia"
          value={address.state}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <hr className="border-gray-500/30 my-5" />

      {/* 💰 Totales */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Productos ({getCartCount()})</span>
          <span>
            {currency}
            {getCartAmount().toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>IVA (15%)</span>
          <span>
            {currency}
            {(getCartAmount() * 0.15).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-medium text-lg border-t pt-3">
          <span>Total</span>
          <span>
            {currency}
            {(getCartAmount() * 1.15).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={createOrder}
        className="w-full bg-blue-600 text-white py-3 mt-5 hover:bg-blue-700"
      >
        Finalizar Compra
      </button>
    </div>
  );
};

export default OrderSummary;
