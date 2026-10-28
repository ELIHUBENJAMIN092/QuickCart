"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { getCategoryName, getSubcategoryName } from "@/lib/categories";
import Badge from "@/components/ui/Badge";
import Price from "@/components/ui/Price";

export default function ProductCard({ product }) {
  const { currency, addToCart, commerceEnabled, user } = useAppContext();
  const canShop = Boolean(commerceEnabled && user);
  const hasOffer = canShop && product.is_offer === true;
  const image = product.image?.[0];
  const secondaryImage = product.image?.[1] || image;
  const soldOut = Number(product.stock) <= 0;
  const isNew = product.is_new === true;

  const href = `/product/${product._id}`;
  const subtitle = product.subcategory ? getSubcategoryName(product.category, product.subcategory) : getCategoryName(product.category);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-line hover:shadow-xl hover:shadow-brand-ink/10">
      <div className="flex h-14 items-center justify-between gap-2 bg-white px-4">
        <div className="flex h-9 min-w-0 flex-1 items-center">
          {product.brand_logo && (
            <Image src={product.brand_logo} alt="Marca" width={160} height={36} className="h-9 w-auto max-w-full object-contain object-left" />
          )}
        </div>
        <div className="shrink-0">
          {canShop && soldOut ? <Badge variant="sold-out" className="rounded-full">Agotado</Badge> : hasOffer ? <Badge variant="sale" className="rounded-full">Oferta</Badge> : isNew ? <Badge variant="new" className="rounded-full">Nuevo</Badge> : null}
        </div>
      </div>
      <Link href={href} className="relative mx-2 block aspect-square overflow-hidden rounded-xl bg-brand-sand/40 sm:mx-3">
        {image && (
          <>
            <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className={`object-contain p-5 transition duration-500 group-hover:scale-105 sm:p-7 ${product.image?.[1] ? "group-hover:opacity-0" : ""}`} />
            {product.image?.[1] && <Image src={secondaryImage} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-5 opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100 sm:p-7" />}
          </>
        )}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-white/95 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink opacity-0 shadow-lg shadow-brand-ink/10 transition group-hover:opacity-100 max-lg:hidden">
          Ver producto
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-brand-ink transition-colors group-hover:text-brand-accent sm:text-base sm:leading-6 md:text-lg">{product.name}</h3>
            <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">{subtitle}</p>
          </div>
        </div>
        {canShop ? (
          <>
            <Price price={product.price} offerPrice={product.offerPrice} currency={currency} className="mt-4 text-base sm:text-lg" />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => addToCart(product._id)}
                disabled={soldOut}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-accent px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition duration-200 hover:bg-brand-ink hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-sm sm:px-4 sm:text-[11px] sm:tracking-[0.1em]"
              >
                {soldOut ? "Agotado" : "Añadir al carrito"}
              </button>
              <Link href={href} aria-label={`Ver ${product.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-white text-brand-ink transition duration-200 hover:border-brand-ink hover:bg-brand-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:scale-[0.98]">
                <Eye size={16} />
              </Link>
            </div>
          </>
        ) : commerceEnabled && !user ? (
          <Link href="/sign-in" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-accent transition hover:border-brand-accent hover:bg-brand-sand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:text-[11px] sm:tracking-[0.1em]">
            Inicia sesión para ver precios
          </Link>
        ) : null}
      </div>
    </article>
  );
}
