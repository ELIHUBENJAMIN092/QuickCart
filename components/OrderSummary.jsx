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

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: user.user_metadata?.name || "",
        email: user.email || "",
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
    <div className="w-full bg-brand-sand p-6 md:w-96">
      <h2 className="font-display text-2xl text-brand-ink">
        Orden de Compra
      </h2>

      <hr className="my-5 border-brand-line" />

      {/* 📍 Datos del cliente */}
      <div className="space-y-3">
        <input
          name="fullName"
          placeholder="Nombre completo"
          value={address.fullName}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />

        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={address.email}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />

        <input
          name="idNumber"
          placeholder="Cédula o RUC"
          value={address.idNumber}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />

        <input
          name="phoneNumber"
          placeholder="Teléfono celular (09xxxxxxxx)"
          value={address.phoneNumber}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />

        <textarea
          name="area"
          placeholder="Dirección / Sector"
          value={address.area}
          onChange={handleChange}
          required
          className="w-full resize-none border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
          rows={3}
        />

        <input
          name="city"
          placeholder="Ciudad"
          value={address.city}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />

        <input
          name="state"
          placeholder="Provincia"
          value={address.state}
          onChange={handleChange}
          required
          className="w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
        />
      </div>

      <hr className="my-5 border-brand-line" />

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
        <div className="flex justify-between border-t border-brand-line pt-3 text-lg font-medium text-brand-ink">
          <span>Total</span>
          <span>
            {currency}
            {(getCartAmount() * 1.15).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={createOrder}
        className="mt-5 w-full rounded-full bg-brand-accent py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
      >
        Finalizar Compra
      </button>
    </div>
  );
};

export default OrderSummary;
