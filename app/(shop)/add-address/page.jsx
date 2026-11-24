"use client";

import Image from "next/image";
import { useState } from "react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const inputClass = "w-full border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent";

const AddAddress = () => {
  const { getToken, router } = useAppContext();
  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    idNumber: "",
    phoneNumber: "",
    area: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => {
    const value = event.target.value;
    setAddress((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!address.fullName.trim()) nextErrors.fullName = "Escribe tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) nextErrors.email = "Correo inválido.";
    if (!/^(\d{10}|\d{13})$/.test(address.idNumber)) nextErrors.idNumber = "Cédula o RUC inválido.";
    if (!/^09\d{8}$/.test(address.phoneNumber)) nextErrors.phoneNumber = "Celular inválido (09 + 8 dígitos).";
    if (!address.area.trim()) nextErrors.area = "Escribe la dirección.";
    if (!address.city.trim()) nextErrors.city = "Escribe la ciudad.";
    if (!address.state.trim()) nextErrors.state = "Escribe la provincia.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Revisa los campos marcados.");
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/user/add-address",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo guardar la dirección.");
      toast.success(data.message);
      router.push("/cart");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar la dirección.");
    }
  };

  const fields = [
    { name: "fullName", label: "Nombre completo", type: "text", autoComplete: "name" },
    { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
    { name: "idNumber", label: "Cédula o RUC", type: "text", autoComplete: "off" },
    { name: "phoneNumber", label: "Celular (09xxxxxxxx)", type: "tel", autoComplete: "tel" },
    { name: "city", label: "Ciudad", type: "text", autoComplete: "address-level2" },
    { name: "state", label: "Provincia", type: "text", autoComplete: "address-level1" },
  ];

  return (
    <main className="px-6 py-16 md:px-16 lg:px-32">
      <div className="flex flex-col justify-between gap-10 md:flex-row">
        <form onSubmit={onSubmitHandler} noValidate className="w-full max-w-lg">
          <h1 className="font-display text-3xl text-brand-ink md:text-4xl">Dirección de envío</h1>
          <p className="mt-3 text-sm text-brand-muted">Guarda tus datos de contacto para agilizar tus próximas compras.</p>

          <div className="mt-10 space-y-3">
            {fields.map(({ name, label, type, autoComplete }) => (
              <label key={name} className="block text-xs font-medium text-brand-muted" htmlFor={`address-${name}`}>
                {label}
                <input
                  id={`address-${name}`}
                  className={inputClass}
                  type={type}
                  autoComplete={autoComplete}
                  value={address[name]}
                  onChange={update(name)}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? `address-${name}-error` : undefined}
                />
                {errors[name] && <span id={`address-${name}-error`} role="alert" className="mt-1 block text-[11px] text-brand-sale">{errors[name]}</span>}
              </label>
            ))}
            <label className="block text-xs font-medium text-brand-muted" htmlFor="address-area">
              Dirección (sector)
              <textarea
                id="address-area"
                className={`${inputClass} resize-none`}
                rows={4}
                value={address.area}
                onChange={update("area")}
                aria-invalid={Boolean(errors.area)}
                aria-describedby={errors.area ? "address-area-error" : undefined}
              />
              {errors.area && <span id="address-area-error" role="alert" className="mt-1 block text-[11px] text-brand-sale">{errors.area}</span>}
            </label>
          </div>

          <button type="submit" className="mt-6 w-full bg-brand-accent py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">
            Guardar dirección
          </button>
        </form>

        <Image
          className="h-auto w-full md:mr-16 md:mt-0"
          src={assets.my_location_image}
          alt="Ilustración de una ubicación de entrega"
        />
      </div>
    </main>
  );
};

export default AddAddress;
