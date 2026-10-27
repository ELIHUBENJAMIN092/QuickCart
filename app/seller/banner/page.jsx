"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { defaultBanner } from "@/lib/banner";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

export default function BannerAdmin() {
  const { getToken } = useAppContext();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get("/api/banner").then(({ data }) => setForm(data.banner)).catch(() => toast.error("No se pudo cargar el banner."));
  }, []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.put("/api/banner", form, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      toast.success("Banner guardado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="w-full flex-1 p-8 text-sm text-brand-muted">Cargando...</div>;

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <PageHeader
        eyebrow="Administración · Contenido"
        title="Banner superior"
        description="Franja que aparece sobre el menú de toda la tienda. Úsala para ofertas, avisos o promociones. Los enlaces pueden ser internos (/all-products) o externos (https://…)."
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-brand-line">
        <p className="bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">Vista previa</p>
        <div style={{ backgroundColor: form.bg_color, color: form.text_color }} className={`flex items-center justify-between gap-4 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] ${form.enabled ? "" : "opacity-40"}`}>
          <span>{form.left_label}</span>
          <span className="text-center">{form.message}</span>
          <span>{form.right_label}</span>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-xl border border-brand-line bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm text-brand-charcoal md:col-span-2">
          <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4" />
          Mostrar el banner en la tienda
        </label>
        <label className="text-sm text-brand-charcoal md:col-span-2">Mensaje central<input maxLength={160} value={form.message} onChange={update("message")} className={inputClass} placeholder="Ej: 15% de descuento en impresoras RFID" /></label>
        <label className="text-sm text-brand-charcoal md:col-span-2">Enlace del mensaje (opcional)<input maxLength={300} value={form.message_url} onChange={update("message_url")} className={inputClass} placeholder="/all-products?category=rfid" /></label>
        <label className="text-sm text-brand-charcoal">Texto izquierdo<input maxLength={40} value={form.left_label} onChange={update("left_label")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Enlace izquierdo<input maxLength={300} value={form.left_url} onChange={update("left_url")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Texto derecho<input maxLength={40} value={form.right_label} onChange={update("right_label")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Enlace derecho<input maxLength={300} value={form.right_url} onChange={update("right_url")} className={inputClass} /></label>
        <label className="text-sm text-brand-charcoal">Color de fondo<input type="color" value={form.bg_color} onChange={update("bg_color")} className="mt-2 block h-11 w-full cursor-pointer rounded-lg border border-brand-line bg-white" /></label>
        <label className="text-sm text-brand-charcoal">Color del texto<input type="color" value={form.text_color} onChange={update("text_color")} className="mt-2 block h-11 w-full cursor-pointer rounded-lg border border-brand-line bg-white" /></label>
        <div className="flex gap-3 md:col-span-2">
          <button disabled={saving} className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">{saving ? "Guardando..." : "Guardar banner"}</button>
          <button type="button" onClick={() => setForm(defaultBanner)} className="rounded-full border border-brand-line px-6 py-3 text-sm text-brand-charcoal hover:bg-brand-sand">Restaurar valores</button>
        </div>
      </form>
    </main>
  );
}
