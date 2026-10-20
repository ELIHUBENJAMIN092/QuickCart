"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { assets } from "@/assets/assets";
import { categories } from "@/lib/categories";
import toast from "react-hot-toast";

export default function Footer() {
  const [showPDF, setShowPDF] = useState(false);
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);

  const subscribe = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }
    if (!accepted) {
      toast.error("Debes aceptar recibir comunicaciones.");
      return;
    }
    toast.success("¡Gracias por suscribirte!");
    setEmail("");
    setAccepted(false);
  };

  return (
    <>
      <footer className="border-t border-brand-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
          <div>
            <Link href="/" aria-label="COMPEL, inicio"><Image className="w-32" src={assets.logo} alt="COMPEL" /></Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-brand-muted">Soluciones profesionales de identificación, impresión y captura de datos para empresas en Ecuador.</p>
            <div className="mt-5 flex gap-4">
              <a href="https://www.facebook.com/CompelEcuadorImpresorasSuministrosEtiquetasNylon" target="_blank" rel="noreferrer" aria-label="Facebook"><Image src={assets.facebook_icon} alt="" width={20} height={20} /></a>
              <a href="https://www.instagram.com/compelecuador/" target="_blank" rel="noreferrer" aria-label="Instagram"><Image src={assets.instagram_icon} alt="" width={20} height={20} /></a>
              <a href="https://www.youtube.com/@compelecuador7211" target="_blank" rel="noreferrer" aria-label="YouTube"><Image src={assets.youtube_icon} alt="" width={20} height={20} /></a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Categorías</h2>
            <ul className="space-y-3">
              {categories.map((category) => <li key={category.slug}><Link href={`/all-products?category=${category.slug}`} className="text-sm text-brand-muted hover:text-brand-accent">{category.name}</Link></li>)}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Empresa y soporte</h2>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li><Link href="/Acerca" className="hover:text-brand-accent">Sobre COMPEL</Link></li>
              <li><Link href="/Contactos" className="hover:text-brand-accent">Contacto y asesoría</Link></li>
              <li><button onClick={() => setShowPDF(true)} className="hover:text-brand-accent">Política de privacidad</button></li>
              <li><a href="https://wa.me/593984617873" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-brand-accent"><FaWhatsapp /> +(593) 98 461 7873</a></li>
              <li><a href="mailto:soporte@compelecuador.com" className="hover:text-brand-accent">soporte@compelecuador.com</a></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Novedades COMPEL</h2>
            <p className="mb-4 text-sm leading-6 text-brand-muted">Recibe novedades, soluciones y ofertas de nuestros productos.</p>
            <form onSubmit={subscribe}>
              <div className="flex border-b border-brand-ink">
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
                <button type="submit" aria-label="Suscribirme" className="px-2 text-sm font-semibold text-brand-accent">Enviar →</button>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-brand-muted">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-brand-accent" />
                Acepto recibir comunicaciones de COMPEL.
              </label>
            </form>
          </div>
        </div>
        <div className="border-t border-brand-line px-5 py-5 text-center text-xs text-brand-muted">
          <p>© {new Date().getFullYear()} COMPEL · Tecnología e identificación en Ecuador. Todos los derechos reservados.</p>
          <p className="mt-2">Pago contra entrega y confirmación manual · Consulta condiciones con nuestro equipo.</p>
        </div>
      </footer>

      {showPDF && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Política de privacidad">
          <div className="relative h-[80vh] w-full max-w-4xl bg-white">
            <button onClick={() => setShowPDF(false)} className="absolute right-3 top-2 z-10 rounded-full bg-white px-3 py-1 text-xl" aria-label="Cerrar">×</button>
            <iframe title="Política de privacidad COMPEL" src="/docs/Politica-de-Privacidad-COMPEL.pdf" className="h-full w-full" />
          </div>
        </div>
      )}
    </>
  );
}
