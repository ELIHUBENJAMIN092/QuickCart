"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { assets } from "@/assets/assets";
import { categories } from "@/lib/categories";
import { useAppContext } from "@/context/AppContext";
import { COOKIE_CONSENT_OPEN_EVENT } from "@/lib/cookieConsent";
import toast from "react-hot-toast";

export default function Footer() {
  useAppContext();
  const [showPDF, setShowPDF] = useState(false);
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const privacyButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!showPDF) return undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setShowPDF(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      privacyButtonRef.current?.focus();
    };
  }, [showPDF]);

  const subscribe = async (event) => {
    event.preventDefault();
    if (subscribing) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }
    if (!accepted) {
      toast.error("Debes aceptar recibir comunicaciones.");
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accepted, website: "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "No se pudo completar la suscripción.");
      toast.success(data.message || "¡Gracias por suscribirte!");
      setEmail("");
      setAccepted(false);
    } catch (error) {
      toast.error(error.message || "No se pudo completar la suscripción.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <footer className="border-t border-brand-line bg-brand-sand">
        <div className="border-b border-brand-line bg-white">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-7 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Hablemos de tu operación</p>
              <h2 className="mt-3 font-display text-3xl leading-[0.98] text-brand-ink md:text-5xl">¿Listo para dar el siguiente paso?</h2>
            </div>
            <Link href="/acerca#contacto" className="inline-flex shrink-0 items-center justify-center bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Contactar a un especialista</Link>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 md:px-8 lg:px-12">
          <div>
            <Link href="/" aria-label="COMPEL, inicio"><Image className="w-32" src={assets.logo} alt="COMPEL" sizes="128px" /></Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-brand-muted">Soluciones profesionales de identificación, impresión y captura de datos para empresas en Ecuador.</p>
            <div className="mt-5 flex gap-4">
              <a href="https://www.facebook.com/CompelEcuadorImpresorasSuministrosEtiquetasNylon" target="_blank" rel="noreferrer" aria-label="Facebook"><Image src={assets.facebook_icon} alt="" width={20} height={20} /></a>
              <a href="https://www.instagram.com/compelecuador/" target="_blank" rel="noreferrer" aria-label="Instagram"><Image src={assets.instagram_icon} alt="" width={20} height={20} /></a>
              <a href="https://www.youtube.com/@compelecuador7211" target="_blank" rel="noreferrer" aria-label="YouTube"><Image src={assets.youtube_icon} alt="" width={20} height={20} /></a>
            </div>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink">Categorías</h2>
            <ul className="space-y-3">
              {categories.map((category) => <li key={category.slug}><Link href={`/categoria/${category.slug}`} className="text-sm text-brand-muted transition hover:text-brand-accent">{category.name}</Link></li>)}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink">Empresa y soporte</h2>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li><Link href="/acerca" className="transition hover:text-brand-accent">Nosotros y contacto</Link></li>
              <li><button ref={privacyButtonRef} onClick={() => setShowPDF(true)} className="transition hover:text-brand-accent">Política de privacidad</button></li>
              <li><Link href="/politica-de-cookies" className="transition hover:text-brand-accent">Política de cookies</Link></li>
              <li><button onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))} className="transition hover:text-brand-accent">Configurar cookies</button></li>
              <li><a href="https://wa.me/593984617873" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-brand-accent"><FaWhatsapp /> +(593) 98 461 7873</a></li>
              <li><a href="mailto:info@compelecuador.com" className="transition hover:text-brand-accent">info@compelecuador.com</a></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink">Novedades COMPEL</h2>
            <p className="mb-4 text-sm leading-6 text-brand-muted">Recibe novedades, soluciones y ofertas de nuestros productos.</p>
            <form onSubmit={subscribe}>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="newsletter-website">No completar</label>
                <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="flex border-b border-brand-ink">
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
                <button type="submit" disabled={subscribing} className="px-2 text-sm font-semibold text-brand-accent disabled:opacity-60">{subscribing ? "Enviando…" : "Enviar →"}</button>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-brand-muted">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-brand-accent" />
                Acepto recibir comunicaciones de COMPEL.
              </label>
            </form>
          </div>
        </div>
        <div className="bg-brand-ink px-5 py-5 text-center text-xs text-white">
          <p>© {new Date().getFullYear()} COMPEL · Tecnología e identificación en Ecuador. Todos los derechos reservados.</p>
          <p className="mt-2">Pago contra entrega y confirmación manual · Consulta condiciones con nuestro equipo.</p>
        </div>
      </footer>

      {showPDF && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Política de privacidad">
          <div className="relative h-[80vh] w-full max-w-4xl bg-white">
            <button ref={closeButtonRef} onClick={() => setShowPDF(false)} className="absolute right-3 top-2 z-10 bg-white px-3 py-1 text-xl" aria-label="Cerrar">×</button>
            <iframe title="Política de privacidad COMPEL" src="/docs/Politica-de-Privacidad-COMPEL.pdf" className="h-full w-full" />
          </div>
        </div>
      )}
    </>
  );
}
