"use client";

import { useAppContext } from "@/context/AppContext";
import { getOrderTotals } from "@/lib/cart";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const inputClass = "w-full border-b border-brand-line bg-transparent px-1 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent";

const emptyAddress = {
  fullName: "",
  email: "",
  phoneNumber: "",
  idNumber: "",
  area: "",
  city: "",
  state: "",
};

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    cartSaving,
    clearCart,
  } = useAppContext();
  const [address, setAddress] = useState(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const subtotal = getCartAmount();
  const totals = getOrderTotals(subtotal);

  useEffect(() => {
    let active = true;
    if (!user) {
      Promise.resolve().then(() => {
        if (!active) return;
        setAddress(emptyAddress);
        setSavedAddresses([]);
        setSelectedAddressId("");
      });
      return () => {
        active = false;
      };
    }

    const fetchSavedAddresses = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
        if (!active) return;
        setAddress((current) => ({
          ...current,
          fullName: current.fullName || user.user_metadata?.name || "",
          email: user.email || "",
        }));
        const { data } = await axios.get("/api/user/get-address", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data.success) throw new Error(data.message || "No se pudieron cargar las direcciones.");
        if (!active) return;

        const addresses = data.addresses || [];
        setSavedAddresses(addresses);
        const latest = addresses[0];
        if (latest) {
          setSelectedAddressId(latest._id);
          setAddress((current) => ({
            ...current,
            fullName: current.fullName || latest.fullName || "",
            phoneNumber: current.phoneNumber || latest.phoneNumber || "",
            area: current.area || latest.area || "",
            city: current.city || latest.city || "",
            state: current.state || latest.state || "",
          }));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || error.message || "No se pudieron cargar las direcciones.");
        }
      }
    };

    fetchSavedAddresses();
    return () => {
      active = false;
    };
  }, [getToken, user]);

  const handleChange = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const selectSavedAddress = (event) => {
    const selected = savedAddresses.find((item) => item._id === event.target.value);
    setSelectedAddressId(event.target.value);
    if (!selected) return;

    setAddress((current) => ({
      ...current,
      fullName: selected.fullName || "",
      phoneNumber: selected.phoneNumber || "",
      area: selected.area || "",
      city: selected.city || "",
      state: selected.state || "",
    }));
  };

  const validatePhone = (phone) => /^09\d{8}$/.test(phone);
  const validateIdNumber = (id) => /^\d{10}$|^\d{13}$/.test(id);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const createOrder = async () => {
    if (submittingRef.current) return;
    if (cartSaving) {
      toast("Espera a que se guarde el carrito.", { icon: "⏳" });
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);

    try {
      if (!user) {
        toast("Por favor inicia sesión", { icon: "⚠️" });
        return;
      }

      const { fullName, email, phoneNumber, idNumber, area, city, state } = address;
      if (!fullName || !email || !phoneNumber || !idNumber || !area || !city || !state) {
        toast.error("Completa todos los campos obligatorios.");
        return;
      }
      if (!validateEmail(email)) {
        toast.error("Correo electrónico inválido.");
        return;
      }
      if (!validatePhone(phoneNumber)) {
        toast.error("Número celular inválido. Debe iniciar con 09 y tener 10 dígitos.");
        return;
      }
      if (!validateIdNumber(idNumber)) {
        toast.error("Cédula o RUC inválido. Debe tener 10 o 13 dígitos.");
        return;
      }

      const items = Object.entries(cartItems)
        .map(([product, quantity]) => ({ product, quantity }))
        .filter((item) => item.quantity > 0);
      if (items.length === 0) {
        toast.error("El carrito está vacío.");
        return;
      }

      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data } = await axios.post(
        "/api/order/create",
        { address, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo crear la orden.");

      toast.success("Orden creada con éxito.");
      clearCart();
      router.push("/order-placed");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo crear la orden.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "fullName", label: "Nombre completo", autoComplete: "name" },
    { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
    { name: "idNumber", label: "Cédula o RUC", autoComplete: "off" },
    { name: "phoneNumber", label: "Teléfono celular (09xxxxxxxx)", type: "tel", autoComplete: "tel" },
    { name: "area", label: "Dirección / Sector", multiline: true, autoComplete: "street-address" },
    { name: "city", label: "Ciudad", autoComplete: "address-level2" },
    { name: "state", label: "Provincia", autoComplete: "address-level1" },
  ];

  return (
    <div className="w-full bg-brand-sand p-6 md:w-96">
      <h2 className="font-display text-2xl text-brand-ink">Orden de Compra</h2>
      <hr className="my-5 border-brand-line" />

      <div className="space-y-3">
        {savedAddresses.length > 0 && (
          <label className="block text-xs font-medium text-brand-muted" htmlFor="saved-address">
            Usar dirección guardada
            <select
              id="saved-address"
              value={selectedAddressId}
              onChange={selectSavedAddress}
              className={`${inputClass} mt-1`}
            >
              {savedAddresses.map((saved) => (
                <option key={saved._id} value={saved._id}>
                  {[saved.fullName, saved.city, saved.state].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </label>
        )}

        {fields.map(({ name, label, type, multiline, autoComplete }) => (
          <label key={name} className="block text-xs font-medium text-brand-muted" htmlFor={`order-${name}`}>
            {label}
            {multiline ? (
              <textarea
                id={`order-${name}`}
                name={name}
                autoComplete={autoComplete}
                value={address[name]}
                onChange={handleChange}
                required
                rows={3}
                className={`${inputClass} resize-none`}
              />
            ) : (
              <input
                id={`order-${name}`}
                name={name}
                type={type || "text"}
                autoComplete={autoComplete}
                value={address[name]}
                onChange={handleChange}
                required
                className={inputClass}
              />
            )}
          </label>
        ))}
      </div>

      <hr className="my-5 border-brand-line" />
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Productos ({getCartCount()})</span>
          <span>{currency}{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (15%)</span>
          <span>{currency}{totals.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-brand-line pt-3 text-lg font-medium text-brand-ink">
          <span>Total</span>
          <span>{currency}{totals.total.toFixed(2)}</span>
        </div>
        <p className="text-xs leading-5 text-brand-muted">
          El envío se cotiza por separado y no está incluido en este total. Te confirmaremos su costo antes del despacho.
        </p>
      </div>

      <button
        type="button"
        onClick={createOrder}
        disabled={submitting || cartSaving}
        className="mt-6 w-full bg-brand-accent py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? "Procesando orden..." : cartSaving ? "Guardando carrito..." : "Finalizar compra"}
      </button>
    </div>
  );
};

export default OrderSummary;
