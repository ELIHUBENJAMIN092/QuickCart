"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
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

function AccountMenuItem({ icon: Icon, label, description, badge = 0, tone = "default", href, onSelect }) {
  const danger = tone === "danger";
  const className = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
    danger
      ? "text-brand-sale hover:bg-red-50"
      : "text-brand-charcoal hover:bg-brand-sand hover:text-brand-ink"
  }`;
  const content = (
    <>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
          danger
            ? "bg-red-50 text-brand-sale"
            : "bg-brand-sand text-brand-charcoal group-hover:bg-white group-hover:text-brand-accent"
        }`}
      >
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description && (
          <span className={`block truncate text-[11px] font-normal ${danger ? "text-brand-sale/70" : "text-brand-muted"}`}>
            {description}
          </span>
        )}
      </span>
      {badge > 0 ? (
        <span className="shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">{badge}</span>
      ) : (
        !danger && <ChevronRight size={15} className="shrink-0 text-brand-line transition group-hover:text-brand-muted" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} role="menuitem" onClick={onSelect} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" onClick={onSelect} className={className}>
      {content}
    </button>
  );
}

function MobileNavLink({ href, label, active, icon: Icon, onClick, trailing, showBadge = true }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-brand-accent-soft font-semibold text-brand-accent"
          : "font-medium text-brand-charcoal hover:bg-brand-sand hover:text-brand-ink"
      }`}
    >
      {Icon && (
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
            active
              ? "bg-white text-brand-accent"
              : "bg-brand-sand/80 text-brand-muted group-hover:bg-white group-hover:text-brand-accent"
          }`}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ??
        (active ? (
          showBadge ? (
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-accent ring-1 ring-brand-accent/20">
              Actual
            </span>
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden="true" />
          )
        ) : null)}
    </Link>
  );
}

function MobileSubLink({ href, label, active, onClick, showBadge = true }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? "bg-brand-accent-soft font-semibold text-brand-accent"
          : "font-medium text-brand-muted hover:bg-brand-sand/70 hover:text-brand-ink"
      }`}
    >
      <span
        className={`h-1 w-1 shrink-0 rounded-full ${active ? "bg-brand-accent" : "bg-brand-line"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">{label}</span>
      {active && showBadge && (
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-accent">Actual</span>
      )}
    </Link>
  );
}

const normalizePath = (value) => {
  const path = String(value || "/")
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
  return (path || "/").toLowerCase();
};

const subcategoryHref = (category, subcategory) =>
  subcategory?.href || `/categoria/${category.slug}${subcategory?.slug ? `/${subcategory.slug}` : ""}`;

const categoryIsActive = (pathname, category) => {
  const path = normalizePath(pathname);
  const base = `/categoria/${category.slug}`.toLowerCase();
  if (path === base || path.startsWith(`${base}/`)) return true;
  return category.subcategories.some((subcategory) => {
    const href = normalizePath(subcategoryHref(category, subcategory));
    return href !== "/" && (path === href || path.startsWith(`${href}/`));
  });
};

const pathIsActive = (pathname, target) => {
  const path = normalizePath(pathname);
  const href = normalizePath(target);
  return path === href || path.startsWith(`${href}/`);
};

export default function Navbar() {
  const { isSeller, user, signOut, products, cartItems, getCartCount, getCartAmount, commerceEnabled } =
    useAppContext();
  const canShop = Boolean(user && commerceEnabled);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategory, setMobileCategory] = useState(null);
  const [banner, setBanner] = useState(defaultBanner);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [menuLeft, setMenuLeft] = useState(0);
  const openAt = (slug, element) => {
    setMenuLeft(element.getBoundingClientRect().left + 10);
    setOpenMenu(slug);
  };
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "?";
  const currentPath = normalizePath(pathname);
  const activeCategorySlug = categories.find((category) => categoryIsActive(pathname, category))?.slug || null;
  const isHomeActive = currentPath === "/";
  const isCatalogActive = pathIsActive(pathname, "/all-products");
  const isAboutActive = pathIsActive(pathname, "/Acerca");
  const isSellerActive = pathIsActive(pathname, "/seller");
  const isOrdersActive = pathIsActive(pathname, "/my-orders");
  const closeMobile = () => setMobileOpen(false);
  const toggleMobileMenu = () => {
    if (!mobileOpen) setMobileCategory(activeCategorySlug);
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    fetch("/api/banner").then((res) => res.json()).then((data) => data.banner && setBanner(data.banner)).catch(() => {});
  }, []);

  const dismissBanner = () => setBannerDismissed(true);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setUserMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    const lockScroll = window.matchMedia("(max-width: 767px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
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

  useEffect(() => {
    if (!suggestOpen) return undefined;
    const close = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [suggestOpen]);

  const categoryHref = (slug, subcategory) =>
    `/categoria/${slug}${subcategory ? `/${subcategory}` : ""}`;

  return (
    <>
      <header className={`sticky top-0 ${userMenuOpen ? "z-[70]" : "z-40"}`}>
        {banner.enabled && !bannerDismissed && (
          <div style={{ backgroundColor: banner.bg_color, color: banner.text_color }} className="relative px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] md:text-xs">
            <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 pr-8 md:pl-8 md:pr-12 lg:pl-12 lg:pr-16">
              <BannerLink href={banner.left_url} className="hidden hover:underline md:block">{banner.left_label && `${banner.left_label} →`}</BannerLink>
              <BannerLink href={banner.message_url} className="flex-1 text-center hover:underline">{banner.message}</BannerLink>
              <BannerLink href={banner.right_url} className="hidden hover:underline md:block">{banner.right_label && `${banner.right_label} →`}</BannerLink>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Cerrar banner"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center transition hover:bg-white/15 md:right-4"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <nav className="relative border-b border-brand-line bg-white" onMouseLeave={() => setOpenMenu(null)}>
          <div className="mx-auto flex h-[80px] max-w-[1360px] items-center gap-5 px-5 md:px-8 lg:gap-4 lg:px-12">
            <Link href="/" aria-label="COMPEL, inicio" className="shrink-0">
              <Image className="w-28 md:w-32" src={assets.logo} alt="COMPEL" priority />
            </Link>

            <div className="mr-auto hidden items-center text-[14px] font-medium xl:flex">
              {categories.map((category) => {
                const active = categoryIsActive(pathname, category);
                const expanded = openMenu === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onMouseEnter={(event) => openAt(category.slug, event.currentTarget)}
                    onClick={(event) => (expanded ? setOpenMenu(null) : openAt(category.slug, event.currentTarget))}
                    aria-expanded={expanded}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-1 whitespace-nowrap rounded-none px-3 py-7 transition-colors focus:outline-none focus-visible:text-brand-accent xl:px-3.5 ${active ? "text-brand-accent" : expanded ? "text-brand-ink" : "text-brand-charcoal hover:text-brand-ink"}`}
                  >
                    {category.name}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors xl:inset-x-3.5 ${active ? "bg-brand-accent" : expanded ? "bg-brand-charcoal" : "bg-transparent group-hover:bg-brand-line"}`}
                    />
                  </button>
                );
              })}
              <Link
                href="/Acerca"
                onMouseEnter={() => setOpenMenu(null)}
                aria-current={isAboutActive ? "page" : undefined}
                style={{ borderRadius: 0 }}
                className={`group relative whitespace-nowrap rounded-none px-3 py-7 transition-colors focus:outline-none focus-visible:text-brand-accent xl:px-3.5 ${isAboutActive ? "text-brand-accent" : "text-brand-charcoal hover:text-brand-ink"}`}
              >
                Nosotros
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors xl:inset-x-3.5 ${isAboutActive ? "bg-brand-accent" : "bg-transparent group-hover:bg-brand-line"}`}
                />
              </Link>
            </div>
            <div className="flex-1 xl:hidden" />

            <div className="flex shrink-0 items-center gap-4 text-brand-charcoal md:gap-5">
              <button onClick={() => setSearchOpen(true)} aria-label="Buscar" className="flex items-center gap-2 text-[14px] font-medium transition hover:text-brand-accent">
                <span className="hidden 2xl:inline">Buscar</span><Search size={20} />
              </button>
              {canShop && (
                <button onClick={() => setCartOpen(true)} aria-label="Abrir carrito" className="relative transition hover:text-brand-accent">
                  <ShoppingCart size={20} />
                  {getCartCount() > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-brand-accent px-1 text-[9px] text-white">{getCartCount()}</span>}
                </button>
              )}
              <div className="relative" ref={menuRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen((open) => !open)}
                      aria-label="Menú de cuenta"
                      aria-haspopup="menu"
                      aria-expanded={userMenuOpen}
                      aria-controls="account-menu"
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-brand-accent text-sm font-semibold text-white transition ${
                        userMenuOpen
                          ? "border-brand-accent ring-4 ring-brand-accent/15"
                          : "border-white ring-1 ring-brand-line hover:ring-brand-accent/40"
                      }`}
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </button>

                    {userMenuOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Cerrar menú de cuenta"
                          onClick={() => setUserMenuOpen(false)}
                          className="fixed inset-0 z-[75] cursor-default bg-brand-ink/40 backdrop-blur-[2px] md:hidden"
                        />
                        <div
                          id="account-menu"
                          role="menu"
                          aria-label="Mi cuenta"
                          className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] overflow-y-auto rounded-t-3xl border border-brand-line bg-white shadow-[0_-20px_60px_-15px_rgba(11,13,18,0.35)] animate-sheet-in md:absolute md:inset-auto md:right-0 md:top-[calc(100%+12px)] md:max-h-none md:w-[340px] md:overflow-hidden md:rounded-2xl md:shadow-[0_24px_60px_-12px_rgba(11,13,18,0.3)] md:animate-menu-in"
                        >
                          <div className="flex justify-center pt-2.5 md:hidden">
                            <span className="h-1 w-10 rounded-full bg-brand-line" />
                          </div>

                          <div className="flex items-start gap-3 bg-gradient-to-br from-brand-accent-soft via-white to-brand-sand px-5 pb-4 pt-4 md:px-4 md:pt-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-accent text-base font-semibold text-white ring-2 ring-white">
                              {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                              ) : (
                                displayName.charAt(0).toUpperCase()
                              )}
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="truncate text-sm font-semibold text-brand-ink">{displayName}</p>
                              <p className="truncate text-xs text-brand-muted">{user.email}</p>
                              {isSeller && (
                                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent ring-1 ring-brand-accent/20">
                                  <LayoutDashboard size={10} /> Vendedor
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setUserMenuOpen(false)}
                              aria-label="Cerrar menú"
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-muted transition hover:bg-white hover:text-brand-ink md:hidden"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="px-2 py-2">
                            <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Mi cuenta</p>
                            {isSeller && (
                              <AccountMenuItem
                                href="/seller"
                                icon={LayoutDashboard}
                                label="Panel de administración"
                                description="Gestiona tu tienda"
                                onSelect={() => setUserMenuOpen(false)}
                              />
                            )}
                            {canShop && (
                              <AccountMenuItem
                                icon={ShoppingCart}
                                label="Carrito"
                                description="Revisa tus productos"
                                badge={getCartCount()}
                                onSelect={() => { setUserMenuOpen(false); setCartOpen(true); }}
                              />
                            )}
                            <AccountMenuItem
                              href="/my-orders"
                              icon={ShoppingBag}
                              label="Mis órdenes"
                              description="Consulta tus compras"
                              onSelect={() => setUserMenuOpen(false)}
                            />
                          </div>

                          <div className="border-t border-brand-line p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                            <AccountMenuItem
                              icon={LogOut}
                              label="Cerrar sesión"
                              tone="danger"
                              onSelect={() => { setUserMenuOpen(false); signOut(); }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <Link href="/sign-in" aria-label="Cuenta" className="flex items-center gap-2 text-[14px] font-medium transition hover:text-brand-accent"><span className="hidden 2xl:inline">Cuenta</span> <User size={20} /></Link>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg p-1 transition hover:text-brand-accent xl:hidden"
                onClick={toggleMobileMenu}
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-drawer"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {categories.map((category) => openMenu === category.slug && (
            <div key={category.slug} className="absolute inset-x-0 top-full z-50 hidden border-t border-brand-line bg-white shadow-lg xl:block">
              <div className="flex flex-wrap gap-x-16 gap-y-8 py-8 pr-6" style={{ paddingLeft: menuLeft }}>
                {(() => {
                  const leaves = category.subcategories.filter((item) => !item.parent && !category.subcategories.some((child) => child.parent === item.slug));
                  const parents = category.subcategories.filter((item) => category.subcategories.some((child) => child.parent === item.slug));
                  return (
                    <>
                      {leaves.length > 0 && (
                        <div>
                          <Link href={categoryHref(category.slug)} onClick={() => setOpenMenu(null)} className="text-base font-semibold text-brand-ink hover:text-brand-accent">{category.name}</Link>
                          <ul className="mt-4 space-y-3">
                            {leaves.map((item) => (
                              <li key={item.slug}><Link href={item.href || categoryHref(category.slug, item.slug)} onClick={() => setOpenMenu(null)} className="text-sm font-semibold text-brand-accent hover:text-brand-ink">{item.name}</Link></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parents.map((parent) => (
                        <div key={parent.slug}>
                          <Link href={categoryHref(category.slug, parent.slug)} onClick={() => setOpenMenu(null)} className="text-base font-semibold text-brand-ink hover:text-brand-accent">{parent.name}</Link>
                          <ul className="mt-4 space-y-3">
                            {category.subcategories.filter((child) => child.parent === parent.slug).map((child) => (
                              <li key={child.slug}><Link href={categoryHref(category.slug, child.slug)} onClick={() => setOpenMenu(null)} className="text-sm font-semibold text-brand-accent hover:text-brand-ink">{child.name}</Link></li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}

        </nav>
      </header>

      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="fixed inset-0 z-[70] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-default rounded-none bg-brand-ink/45 backdrop-blur-[2px] animate-fade-in motion-reduce:animate-none"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(90vw,400px)] max-w-full flex-col rounded-none bg-white shadow-[-24px_0_60px_-20px_rgba(11,13,18,0.35)] animate-drawer-in motion-reduce:animate-none">
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-brand-line px-4">
              <Link href="/" onClick={closeMobile} aria-label="COMPEL, inicio" className="shrink-0">
                <Image className="w-24" src={assets.logo} alt="COMPEL" />
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Cerrar menú"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-line text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent focus:outline-none focus-visible:border-brand-accent focus-visible:text-brand-accent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted/80">Navegación</p>
              <div className="space-y-0.5">
                <MobileNavLink href="/" label="Inicio" icon={Home} active={isHomeActive} onClick={closeMobile} />
                <MobileNavLink
                  href="/all-products"
                  label="Todo el catálogo"
                  icon={LayoutGrid}
                  active={isCatalogActive}
                  onClick={closeMobile}
                />
              </div>

              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted/80">Categorías</p>
              <div className="space-y-1">
                {categories.map((category) => {
                  const active = categoryIsActive(pathname, category);
                  const expanded = mobileCategory === category.slug;
                  const leaves = category.subcategories.filter(
                    (item) => !item.parent && !category.subcategories.some((child) => child.parent === item.slug)
                  );
                  const parents = category.subcategories.filter((item) =>
                    category.subcategories.some((child) => child.parent === item.slug)
                  );
                  return (
                    <div
                      key={category.slug}
                      className="overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setMobileCategory(expanded ? null : category.slug)}
                        aria-expanded={expanded}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:text-brand-accent ${
                          active
                            ? "bg-brand-accent-soft font-semibold text-brand-accent"
                            : "font-medium text-brand-charcoal hover:bg-brand-sand/70 hover:text-brand-ink"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{category.name}</span>
                        {active && (
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-accent ring-1 ring-brand-accent/20">
                            Actual
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded && (
                        <div className="space-y-0.5 px-2 pb-2 pt-1">
                          <MobileSubLink
                            href={`/categoria/${category.slug}`}
                            label={`Ver todo ${category.name}`}
                            active={currentPath === normalizePath(`/categoria/${category.slug}`)}
                            onClick={closeMobile}
                            showBadge={false}
                          />
                          {leaves.map((subcategory) => (
                            <MobileSubLink
                              key={subcategory.slug}
                              href={subcategoryHref(category, subcategory)}
                              label={subcategory.name}
                              active={currentPath === normalizePath(subcategoryHref(category, subcategory))}
                              onClick={closeMobile}
                            />
                          ))}
                          {parents.map((parent) => {
                            const children = category.subcategories.filter((child) => child.parent === parent.slug);
                            const parentActive =
                              currentPath === normalizePath(subcategoryHref(category, parent)) ||
                              children.some((child) => currentPath === normalizePath(subcategoryHref(category, child)));
                            return (
                              <div key={parent.slug} className="pt-1">
                                <MobileSubLink
                                  href={subcategoryHref(category, parent)}
                                  label={parent.name}
                                  active={parentActive}
                                  onClick={closeMobile}
                                />
                                <div className="ml-3 border-l border-brand-line pl-1.5">
                                  {children.map((child) => (
                                    <MobileSubLink
                                      key={child.slug}
                                      href={subcategoryHref(category, child)}
                                      label={child.name}
                                      active={currentPath === normalizePath(subcategoryHref(category, child))}
                                      onClick={closeMobile}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted/80">Compañía</p>
              <MobileNavLink href="/Acerca" label="Nosotros" icon={Info} active={isAboutActive} onClick={closeMobile} />
            </div>

            <div className="shrink-0 border-t border-brand-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {user ? (
                <>
                  <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-brand-sand/60 p-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-accent text-xs font-semibold text-white ring-2 ring-white">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-brand-ink">{displayName}</p>
                      <p className="truncate text-[11px] text-brand-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    {isSeller && (
                      <MobileNavLink
                        href="/seller/dashboard"
                        label="Panel de administración"
                        icon={LayoutDashboard}
                        active={isSellerActive}
                        onClick={closeMobile}
                        showBadge={false}
                      />
                    )}
                    <MobileNavLink
                      href="/my-orders"
                      label="Mis órdenes"
                      icon={ShoppingBag}
                      active={isOrdersActive}
                      onClick={closeMobile}
                      showBadge={false}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        closeMobile();
                        signOut();
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-brand-sale transition-colors hover:bg-red-50"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-50 text-brand-sale">
                        <LogOut size={15} aria-hidden="true" />
                      </span>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={closeMobile}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink"
                >
                  <User size={17} aria-hidden="true" /> Iniciar sesión
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {((cartOpen && canShop) || searchOpen) && (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => { setCartOpen(false); setSearchOpen(false); }}>
          {cartOpen && canShop && (
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
                <Link href="/cart" onClick={() => setCartOpen(false)} className="block bg-brand-accent py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Ver carrito / Checkout</Link>
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
