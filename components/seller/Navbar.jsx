"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Store } from "lucide-react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";

export default function Navbar({ onMenu }) {
  const { router } = useAppContext();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-brand-line bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú de administración"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-line text-brand-charcoal md:hidden"
        >
          <Menu size={20} />
        </button>
        <Image
          onClick={() => router.push("/seller/dashboard")}
          className="h-auto w-24 cursor-pointer sm:w-28 lg:w-32"
          src={assets.logo}
          alt="COMPEL"
          priority
        />
        <span className="hidden border-l border-brand-line pl-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted sm:block">
          Panel de administración
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/seller/dashboard" className="hidden rounded-full px-3 py-2 text-xs font-medium text-brand-charcoal transition hover:bg-brand-sand hover:text-brand-accent lg:block">
          Resumen
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-2 text-xs font-semibold text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent sm:px-4 sm:text-sm"
        >
          <Store size={15} />
          <span className="hidden sm:inline">Ver tienda</span>
        </Link>
      </div>
    </header>
  );
}
