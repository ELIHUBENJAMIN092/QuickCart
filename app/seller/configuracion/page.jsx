"use client";

import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/seller/PageHeader";
import { useAppContext } from "@/context/AppContext";

export default function CommerceSettingsPage() {
  const { commerceEnabled, commerceSettingsError, commerceSettingsLoading, fetchCommerceSettings, getToken, isSeller } = useAppContext();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (event) => {
    const enabled = event.target.checked;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data } = await axios.put(
        "/api/commerce-settings",
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo guardar la configuración.");
      if (await fetchCommerceSettings()) toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (!isSeller) {
    return (
      <main className="p-6 md:p-8">
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">No tienes permiso para administrar esta configuración.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          className="mb-7"
          eyebrow="Administración · Tienda"
          title="Carrito y precios"
          description="Controla si los clientes pueden ver precios y usar las funciones de compra."
        />

        <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-sand text-brand-accent">
              <ShoppingCart size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl text-brand-ink">Visibilidad de precios y carrito</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Al ocultarlos, el catálogo conserva las fotos, descripciones y detalles de los productos. Los precios, el acceso al carrito y las acciones para comprar dejan de estar disponibles en toda la tienda. La preferencia se aplica también a las solicitudes de compra.
              </p>

              <label className="mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-brand-line bg-brand-sand/40 p-4">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-brand-ink">
                    {commerceSettingsLoading
                      ? "Cargando configuración..."
                      : commerceEnabled
                        ? "Precios y carrito visibles para clientes registrados"
                        : "Precios y carrito ocultos"}
                  </span>
                  <span className="mt-1 block text-xs text-brand-muted">
                    {commerceEnabled
                      ? "Los visitantes sin sesión no ven precios ni pueden comprar."
                      : "La tienda muestra solo el catálogo informativo."}
                  </span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Mostrar precios y habilitar el carrito para clientes registrados"
                  checked={commerceEnabled}
                  onChange={handleToggle}
                  disabled={saving || commerceSettingsLoading}
                  className="peer sr-only"
                />
                <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-brand-line transition peer-checked:bg-brand-success peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-accent peer-disabled:opacity-50 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
              </label>

              {saving && <p role="status" className="mt-3 text-xs text-brand-muted">Guardando configuración...</p>}
              {commerceSettingsError && (
                <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-sale">
                  <span>{commerceSettingsError}</span>
                  <button type="button" onClick={fetchCommerceSettings} className="font-semibold underline">Reintentar</button>
                </div>
              )}
              <p className="mt-5 flex items-center gap-2 text-xs text-brand-muted">
                {commerceEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                El precio solo se entrega a usuarios autenticados y cuando esta opción está activa.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
