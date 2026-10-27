"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { getCategoryName, getSubcategoryName } from "@/lib/categories";
import Badge from "@/components/ui/Badge";
import Price from "@/components/ui/Price";

export default function ProductCard({ product }) {
  const { currency, addToCart } = useAppContext();
  const hasOffer = product.is_offer === true;
  const image = product.image?.[0];
  const secondaryImage = product.image?.[1] || image;
  const soldOut = Number(product.stock) <= 0;
  const isNew = product.is_new === true;

  const href = `/product/${product._id}`;
  const subtitle = product.subcategory ? getSubcategoryName(product.category, product.subcategory) : getCategoryName(product.category);

  return (
    <article className="group flex min-w-0 flex-col border border-brand-line bg-white transition duration-300 hover:border-brand-charcoal">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-brand-line bg-white px-4">
        <div className="flex h-9 min-w-0 flex-1 items-center">
          {product.brand_logo && (
            <Image src={product.brand_logo} alt="Marca" width={160} height={36} className="h-9 w-auto max-w-full object-contain object-left" />
          )}
        </div>
        <div className="shrink-0">
          {soldOut ? <Badge variant="sold-out">Agotado</Badge> : hasOffer ? <Badge variant="sale">Oferta</Badge> : isNew ? <Badge variant="new">Nuevo</Badge> : null}
        </div>
      </div>
      <Link href={href} className="relative block aspect-square overflow-hidden bg-brand-sand/60">
        {image && (
          <>
            <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className={`object-contain p-6 transition duration-500 group-hover:scale-105 ${product.image?.[1] ? "group-hover:opacity-0" : ""}`} />
            {product.image?.[1] && <Image src={secondaryImage} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-6 opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100" />}
          </>
        )}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink opacity-0 transition group-hover:opacity-100 max-lg:hidden">
          Ver producto
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-brand-ink md:text-lg">{product.name}</h3>
            <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">{subtitle}</p>
          </div>
        </div>
        <Price price={product.price} offerPrice={product.offerPrice} currency={currency} className="mt-4 text-base" />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => addToCart(product._id)}
            disabled={soldOut}
            className="flex-1 bg-brand-accent px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {soldOut ? "Agotado" : "Añadir al carrito"}
          </button>
          <Link href={href} aria-label={`Ver ${product.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center border border-brand-line text-brand-ink transition hover:border-brand-ink hover:bg-brand-ink hover:text-white">
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
