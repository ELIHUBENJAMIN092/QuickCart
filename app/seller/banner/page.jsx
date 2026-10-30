"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, Megaphone } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { defaultBanner } from "@/lib/banner";

const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

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
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Banner superior"
          description="Franja que aparece sobre el menú de toda la tienda. Úsala para ofertas, avisos o promociones. Los enlaces pueden ser internos (/all-products) o externos (https://…)."
        />

        <section className="mt-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-line px-4 py-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              <Megaphone size={14} className="text-brand-accent" /> Vista previa
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${form.enabled ? "bg-brand-success/10 text-brand-success" : "bg-brand-sand text-brand-muted"}`}>
              {form.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
              {form.enabled ? "Visible en la tienda" : "Oculto"}
            </span>
          </div>
          <div className="p-3 sm:p-4">
            <div
              style={{ backgroundColor: form.bg_color, color: form.text_color }}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] sm:px-4 sm:text-xs sm:tracking-[0.12em] ${form.enabled ? "" : "opacity-40"}`}
            >
              <span className="shrink-0 truncate">{form.left_label}</span>
              <span className="min-w-0 flex-1 truncate text-center">{form.message}</span>
              <span className="shrink-0 truncate">{form.right_label}</span>
            </div>
          </div>
        </section>

        <form onSubmit={save} className="mt-5 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-brand-line bg-brand-sand/40 p-4">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-brand-ink">Mostrar el banner en la tienda</span>
              <span className="mt-1 block text-xs text-brand-muted">Si lo desactivas, no se mostrará a ningún visitante.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label="Mostrar el banner en la tienda"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              className="peer sr-only"
            />
            <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-brand-line transition peer-checked:bg-brand-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-accent after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          </label>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-brand-charcoal md:col-span-2">Mensaje central
              <input maxLength={160} value={form.message} onChange={update("message")} className={inputClass} placeholder="Ej: 15% de descuento en impresoras RFID" />
            </label>
            <label className="block text-sm font-medium text-brand-charcoal md:col-span-2">Enlace del mensaje <span className="font-normal text-brand-muted">(opcional)</span>
              <input maxLength={300} value={form.message_url} onChange={update("message_url")} className={inputClass} placeholder="/all-products?category=rfid" />
            </label>

            <div className="rounded-xl border border-brand-line bg-brand-sand/30 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Lado izquierdo</p>
              <label className="mt-2 block text-xs font-medium text-brand-charcoal">Texto
                <input maxLength={40} value={form.left_label} onChange={update("left_label")} className={inputClass} />
              </label>
              <label className="mt-3 block text-xs font-medium text-brand-charcoal">Enlace
                <input maxLength={300} value={form.left_url} onChange={update("left_url")} className={inputClass} />
              </label>
            </div>

            <div className="rounded-xl border border-brand-line bg-brand-sand/30 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Lado derecho</p>
              <label className="mt-2 block text-xs font-medium text-brand-charcoal">Texto
                <input maxLength={40} value={form.right_label} onChange={update("right_label")} className={inputClass} />
              </label>
              <label className="mt-3 block text-xs font-medium text-brand-charcoal">Enlace
                <input maxLength={300} value={form.right_url} onChange={update("right_url")} className={inputClass} />
              </label>
            </div>

            <label className="block text-sm font-medium text-brand-charcoal">Color de fondo
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-brand-line bg-white p-2">
                <input type="color" value={form.bg_color} onChange={update("bg_color")} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-brand-line bg-white" aria-label="Color de fondo del banner" />
                <span className="truncate font-mono text-xs uppercase text-brand-muted">{form.bg_color}</span>
              </span>
            </label>
            <label className="block text-sm font-medium text-brand-charcoal">Color del texto
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-brand-line bg-white p-2">
                <input type="color" value={form.text_color} onChange={update("text_color")} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-brand-line bg-white" aria-label="Color del texto del banner" />
                <span className="truncate font-mono text-xs uppercase text-brand-muted">{form.text_color}</span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-brand-line pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setForm(defaultBanner)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-5 py-3 text-sm font-medium text-brand-charcoal transition hover:bg-brand-sand">Restaurar valores</button>
            <button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">{saving ? "Guardando..." : "Guardar banner"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
