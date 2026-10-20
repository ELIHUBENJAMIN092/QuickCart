"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import { assets } from "@/assets/assets";
import { defaultBanner } from "@/lib/banner";
import { categories } from "@/lib/categories";
import { useAppContext } from "@/context/AppContext";

function BannerLink({ href, className, children }) {
  if (!href) return <span className={className.replace("hover:underline", "")}>{children}</span>;
  return href.startsWith("/")
    ? <Link href={href} className={className}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

export default function Navbar() {
  const { isSeller, user, signOut, products, cartItems, getCartCount, getCartAmount } =
    useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [banner, setBanner] = useState(defaultBanner);
  const [openMenu, setOpenMenu] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "?";

  useEffect(() => {
    fetch("/api/banner").then((res) => res.json()).then((data) => data.banner && setBanner(data.banner)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userMenuOpen]);

  const cartProducts = Object.entries(cartItems)
    .map(([id, quantity]) => ({
      product: products.find((item) => item._id === id),
      quantity,
    }))
    .filter(({ product, quantity }) => product && quantity > 0);
  const matches = search.trim()
    ? products.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase())
      ).slice(0, 5)
    : [];

  const submitSearch = (event) => {
    event.preventDefault();
    setSuggestOpen(false);
    router.push(`/all-products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  };

  useEffect(() => {
    if (!suggestOpen) return undefined;
    const close = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [suggestOpen]);

  const categoryHref = (slug, subcategory) =>
    `/all-products?category=${slug}${subcategory ? `/${subcategory}` : ""}`;

  return (
    <>
      <header className="sticky top-0 z-40">
        {banner.enabled && (
          <div style={{ backgroundColor: banner.bg_color, color: banner.text_color }} className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] md:text-xs">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:px-8 lg:px-12">
              <BannerLink href={banner.left_url} className="hidden hover:underline md:block">{banner.left_label && `${banner.left_label} →`}</BannerLink>
              <BannerLink href={banner.message_url} className="flex-1 text-center hover:underline">{banner.message}</BannerLink>
              <BannerLink href={banner.right_url} className="hidden hover:underline md:block">{banner.right_label && `${banner.right_label} →`}</BannerLink>
            </div>
          </div>
        )}
        <nav className="border-b border-brand-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-4 md:px-8 lg:px-12">
            <Link href="/" aria-label="COMPEL, inicio" className="shrink-0">
              <Image className="w-28 md:w-32" src={assets.logo} alt="COMPEL" priority />
            </Link>

            <div className="relative mx-auto hidden w-full max-w-2xl md:block" ref={searchRef}>
              <form onSubmit={submitSearch} role="search" className="flex items-center gap-3 rounded-full border border-brand-line bg-white px-5 py-2.5 focus-within:border-brand-accent">
                <button type="submit" aria-label="Buscar" className="text-brand-ink"><Search size={18} /></button>
                <input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setSuggestOpen(true); }}
                  onFocus={() => setSuggestOpen(true)}
                  placeholder="¿Qué producto estás buscando?"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-brand-muted"
                />
              </form>
              {suggestOpen && search.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xl">
                  {matches.map((product) => (
                    <Link key={product._id} href={`/product/${product._id}`} onClick={() => { setSuggestOpen(false); setSearch(""); }} className="flex items-center gap-3 border-b border-brand-line px-4 py-2.5 text-sm hover:bg-brand-sand">
                      <span className="relative h-10 w-10 shrink-0 bg-brand-sand">
                        {product.image?.[0] && <Image src={product.image[0]} alt="" fill sizes="40px" className="object-contain p-1" />}
                      </span>
                      <span className="line-clamp-1">{product.name}</span>
                    </Link>
                  ))}
                  {matches.length === 0 && <p className="px-4 py-3 text-sm text-brand-muted">No encontramos productos con ese nombre.</p>}
                  <Link href={`/all-products?search=${encodeURIComponent(search.trim())}`} onClick={() => setSuggestOpen(false)} className="block px-4 py-3 text-sm font-medium text-brand-accent hover:bg-brand-sand">Ver todos los resultados →</Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-brand-ink">
              <button onClick={() => setSearchOpen(true)} aria-label="Buscar" className="hover:text-brand-accent md:hidden">
                <Search size={20} />
              </button>
              <button onClick={() => setCartOpen(true)} aria-label="Abrir carrito" className="relative hover:text-brand-accent">
                <ShoppingCart size={20} />
                {getCartCount() > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] text-white">{getCartCount()}</span>}
              </button>
              <div className="hidden md:block">
                {user ? (
                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setUserMenuOpen((open) => !open)} aria-label="Menú de cuenta" aria-expanded={userMenuOpen} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-brand-line bg-brand-accent text-sm font-semibold text-white">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-12 z-[70] w-72 overflow-hidden rounded-xl border border-brand-line bg-white text-sm shadow-xl">
                        <div className="flex items-center gap-3 border-b border-brand-line p-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-accent font-semibold text-white">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold uppercase text-brand-ink">{displayName}</p>
                            <p className="truncate text-xs text-brand-muted">{user.email}</p>
                          </div>
                        </div>
                        {isSeller && (
                          <Link href="/seller" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 border-b border-brand-line px-4 py-3 hover:bg-brand-sand"><LayoutDashboard size={16} /> Panel de administración</Link>
                        )}
                        <button onClick={() => { setUserMenuOpen(false); setCartOpen(true); }} className="flex w-full items-center gap-3 border-b border-brand-line px-4 py-3 text-left hover:bg-brand-sand"><ShoppingCart size={16} /> Carrito</button>
                        <Link href="/my-orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 border-b border-brand-line px-4 py-3 hover:bg-brand-sand"><ShoppingBag size={16} /> Mis órdenes</Link>
                        <button onClick={() => { setUserMenuOpen(false); signOut(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-sand"><LogOut size={16} /> Cerrar sesión</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/sign-in" className="text-sm hover:text-brand-accent">Cuenta</Link>
                )}
              </div>
              <button className="lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          <div className="hidden border-t border-brand-line lg:block">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-8 text-sm font-medium text-brand-charcoal">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(category.slug)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    onClick={() => setOpenMenu((current) => (current === category.slug ? null : category.slug))}
                    aria-expanded={openMenu === category.slug}
                    className={`flex items-center gap-1 border-b-2 py-3 hover:text-brand-accent ${openMenu === category.slug ? "border-brand-accent text-brand-accent" : "border-transparent"}`}
                  >
                    {category.name} <ChevronDown size={14} />
                  </button>
                  {openMenu === category.slug && (
                    <div className="absolute left-0 top-full z-50 min-w-60 border border-brand-line bg-white py-2 shadow-xl">
                      {category.subcategories.map((subcategory) => (
                        <Link key={subcategory.slug} href={categoryHref(category.slug, subcategory.slug)} onClick={() => setOpenMenu(null)} className="block px-5 py-2.5 text-sm font-normal hover:bg-brand-sand hover:text-brand-accent">{subcategory.name}</Link>
                      ))}
                      <Link href={categoryHref(category.slug)} onClick={() => setOpenMenu(null)} className="block px-5 py-2.5 text-sm font-semibold text-brand-accent hover:bg-brand-sand">Ver todo</Link>
                    </div>
                  )}
                </div>
              ))}
              <Link href="/Productos" className="py-3 hover:text-brand-accent">Soluciones</Link>
              <Link href="/Acerca" className="py-3 hover:text-brand-accent">Nosotros</Link>
              <Link href="/Contactos" className="py-3 hover:text-brand-accent">Contacto</Link>
              {isSeller && <Link href="/seller" className="py-3 text-xs font-semibold text-brand-accent">Administración</Link>}
            </div>
          </div>

          {mobileOpen && (
            <div className="max-h-[calc(100vh-100px)] overflow-y-auto border-t border-brand-line bg-white px-5 py-5 lg:hidden">
              <Link className="block border-b border-brand-line py-3" href="/" onClick={() => setMobileOpen(false)}>Inicio</Link>
              <Link className="block border-b border-brand-line py-3" href="/all-products" onClick={() => setMobileOpen(false)}>Todo el catálogo</Link>
              {categories.map((category) => (
                <details key={category.slug} className="border-b border-brand-line py-3">
                  <summary className="cursor-pointer list-none font-medium text-brand-ink">{category.name}</summary>
                  <div className="space-y-2 pb-2 pl-3 pt-3">
                    <Link className="block text-sm text-brand-muted" href={categoryHref(category.slug)} onClick={() => setMobileOpen(false)}>Ver categoría</Link>
                    {category.subcategories.map((subcategory) => (
                      <Link key={subcategory.slug} className="block text-sm text-brand-muted" href={categoryHref(category.slug, subcategory.slug)} onClick={() => setMobileOpen(false)}>{subcategory.name}</Link>
                    ))}
                  </div>
                </details>
              ))}
              <Link className="block border-b border-brand-line py-3" href="/Productos" onClick={() => setMobileOpen(false)}>Soluciones</Link>
              <Link className="block border-b border-brand-line py-3" href="/Acerca" onClick={() => setMobileOpen(false)}>Nosotros</Link>
              <Link className="block py-3" href="/Contactos" onClick={() => setMobileOpen(false)}>Contacto</Link>
              {user ? (
                <>
                  <Link className="block py-3" href="/my-orders" onClick={() => setMobileOpen(false)}>Mis órdenes</Link>
                  <button className="py-3" onClick={signOut}>Cerrar sesión</button>
                </>
              ) : <Link className="block py-3" href="/sign-in" onClick={() => setMobileOpen(false)}>Iniciar sesión</Link>}
            </div>
          )}
        </nav>
      </header>

      {(cartOpen || searchOpen) && (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => { setCartOpen(false); setSearchOpen(false); }}>
          {cartOpen && (
            <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-brand-cream p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between border-b border-brand-line pb-4">
                <h2 className="font-display text-2xl text-brand-ink">Tu carrito ({getCartCount()})</h2>
                <button onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto">
                {cartProducts.length === 0 ? (
                  <p className="py-12 text-center text-sm text-brand-muted">Tu carrito está vacío.</p>
                ) : cartProducts.map(({ product, quantity }) => (
                  <div key={product._id} className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 bg-brand-sand">
                      {product.image?.[0] && <Image src={product.image[0]} alt={product.name} fill sizes="80px" className="object-contain p-2" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-brand-ink">{product.name}</p>
                      <p className="mt-1 text-xs text-brand-muted">Cantidad: {quantity}</p>
                      <p className="mt-2 text-sm font-semibold text-brand-ink">{process.env.NEXT_PUBLIC_CURRENCY || "$"}{(Number(product.offerPrice ?? product.price) * quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-brand-line pt-5">
                <div className="mb-4 flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{process.env.NEXT_PUBLIC_CURRENCY || "$"}{getCartAmount().toFixed(2)}</span></div>
                <Link href="/cart" onClick={() => setCartOpen(false)} className="block rounded-full bg-brand-accent py-3 text-center text-sm font-semibold text-white hover:bg-brand-accent-hover">Ver carrito / Checkout</Link>
              </div>
            </aside>
          )}
          {searchOpen && (
            <div className="mx-auto mt-24 w-[min(650px,calc(100%-32px))] bg-brand-cream p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center gap-3 border-b border-brand-line pb-3">
                <Search className="text-brand-muted" size={20} />
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos..." className="flex-1 bg-transparent outline-none" />
                <button onClick={() => { setSearchOpen(false); setSearch(""); }} aria-label="Cerrar búsqueda"><X size={20} /></button>
              </div>
              <div className="pt-4">
                {matches.map((product) => (
                  <Link key={product._id} href={`/product/${product._id}`} onClick={() => { setSearchOpen(false); setSearch(""); }} className="block border-b border-brand-line py-3 text-sm hover:text-brand-accent">{product.name}</Link>
                ))}
                {search.trim() && matches.length === 0 && <p className="py-4 text-sm text-brand-muted">No encontramos productos con ese nombre.</p>}
                <Link href={`/all-products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`} onClick={() => setSearchOpen(false)} className="mt-4 inline-block text-sm font-medium text-brand-accent">Buscar en todo el catálogo →</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
