"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgeCheck,
  CreditCard,
  GalleryHorizontal,
  LayoutGrid,
  List,
  LogOut,
  Megaphone,
  MessageSquare,
  PackagePlus,
  ShoppingBag,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";

const groups = [
  {
    label: "General",
    items: [{ name: "Resumen", path: "/seller/dashboard", icon: BarChart3 }],
  },
  {
    label: "Catálogo",
    items: [
      { name: "Añadir producto", path: "/seller", icon: PackagePlus },
      { name: "Productos", path: "/seller/product-list", icon: List },
      { name: "Categorías", path: "/seller/categories", icon: LayoutGrid },
    ],
  },
  {
    label: "Contenido",
    items: [
      { name: "Carrusel", path: "/seller/carousel", icon: GalleryHorizontal },
      { name: "Marcas de confianza", path: "/seller/marcas", icon: BadgeCheck },
      { name: "Banner", path: "/seller/banner", icon: Megaphone },
    ],
  },
  {
    label: "Tienda",
    items: [{ name: "Carrito y precios", path: "/seller/configuracion", icon: ShoppingCart }],
  },
  {
    label: "Ventas",
    items: [
      { name: "Órdenes", path: "/seller/orders", icon: ShoppingBag },
      { name: "Pagos confirmados", path: "/seller/pagos", icon: CreditCard },
      { name: "Asistente IA", path: "/seller/chat", icon: MessageSquare },
    ],
  },
];

const isActivePath = (pathname, path) =>
  pathname === path || (path === "/seller/product-list" && pathname.startsWith("/seller/edit-product"));

function NavLinks({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación de administración" className="space-y-5 px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.path);
              return (
                <Link
                  href={item.path}
                  key={item.name}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-brand-accent font-semibold text-white shadow-sm"
                      : "text-brand-charcoal hover:bg-brand-sand hover:text-brand-ink"
                  }`}
                >
                  <item.icon size={18} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AccountCard() {
  const { user, signOut } = useAppContext();
  const email = user?.email || "Cuenta de vendedor";
  const initial = email.slice(0, 1).toUpperCase();

  return (
    <div className="border-t border-brand-line p-3">
      <div className="flex items-center gap-3 rounded-lg bg-brand-sand px-3 py-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-accent text-sm font-semibold text-white">{initial}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-brand-ink">{email}</p>
          <p className="text-[10px] uppercase tracking-wider text-brand-muted">Administrador</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Link href="/" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-line px-2 py-2 text-[11px] font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent">
          <Store size={13} /> Ver tienda
        </Link>
        <button type="button" onClick={signOut} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-line px-2 py-2 text-[11px] font-medium text-brand-charcoal transition hover:border-brand-sale hover:text-brand-sale">
          <LogOut size={13} /> Salir
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-brand-line bg-white md:flex">
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <AccountCard />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú de administración">
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-brand-line px-4">
              <Image src={assets.logo} alt="COMPEL" className="h-auto w-24" />
              <button type="button" onClick={onClose} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-charcoal">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={onClose} />
            </div>
            <AccountCard />
          </aside>
        </div>
      )}
    </>
  );
}
