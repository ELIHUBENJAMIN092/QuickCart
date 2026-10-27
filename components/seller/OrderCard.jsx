"use client";

import { BadgeCheck, CalendarDays, CheckCircle2, Hash, Mail, MapPin, Package, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
};

const orderNumber = (id) => String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase() || "SIN CÓDIGO";

export default function OrderCard({ order, currency, paid = false, onConfirm, confirming = false }) {
  const items = order.items || [];
  const address = order.address || {};
  const phone = address.phoneNumber ? String(address.phoneNumber) : "";
  const whatsapp = phone ? `https://wa.me/593${phone.replace(/^0/, "")}` : "";
  const total = Number(order.amount || 0).toFixed(2);

  return (
    <article className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm transition hover:shadow md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-line pb-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-ink">
            <Hash size={13} /> Orden {orderNumber(order._id)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-muted">
            <CalendarDays size={12} /> {formatDate(order.date)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold ${paid ? "bg-brand-success/10 text-brand-success" : "bg-amber-50 text-amber-700"}`}>
          {paid ? <BadgeCheck size={13} /> : <Package size={13} />}
          {paid ? "Pago confirmado" : "Pago pendiente"}
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.15fr_1fr_auto]">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Productos ({items.length})</p>
          <ul className="mt-2 space-y-2">
            {items.map((item, index) => (
              <li key={`${item.product?._id || "item"}-${index}`} className="flex items-start justify-between gap-3 text-xs text-brand-charcoal">
                <span className="line-clamp-2">{item.product?.name || "Producto eliminado"}</span>
                <span className="shrink-0 rounded-full bg-brand-sand px-2 py-0.5 text-[10px] font-semibold text-brand-ink">x{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 border-t border-brand-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Cliente</p>
          <p className="mt-2 truncate text-sm font-semibold text-brand-ink">{address.fullName || "Sin nombre"}</p>
          {address.idNumber && <p className="mt-1 text-[11px] text-brand-muted">C.I / RUC: {address.idNumber}</p>}
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-brand-charcoal">
            <MapPin size={12} className="mt-1 shrink-0 text-brand-muted" />
            <span>{address.area || "Sin dirección"}{address.city ? `, ${address.city}` : ""}{address.state ? `, ${address.state}` : ""}</span>
          </p>
          {address.email && (
            <a href={`mailto:${address.email}`} className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-brand-accent hover:underline">
              <Mail size={12} className="shrink-0" /> {address.email}
            </a>
          )}
          {phone ? (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-green-600 hover:underline">
              <FaWhatsapp size={13} /> {phone}
            </a>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-sale"><Phone size={12} /> Sin teléfono</p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-brand-line pt-4 lg:min-w-[175px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Total</p>
            <p className="mt-1 font-display text-2xl text-brand-ink">{currency}{total}</p>
            <p className="mt-1 text-[11px] text-brand-muted">{paid ? "Contra entrega · cobrado" : "Contra entrega · por cobrar"}</p>
          </div>
          {paid ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-success/10 px-3 py-2 text-[11px] font-semibold text-brand-success">
              <CheckCircle2 size={14} /> Recibido
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onConfirm?.(order._id)}
              disabled={confirming}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60"
            >
              {confirming ? "Confirmando..." : "Confirmar pago"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
