"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { getCategoryName, getSubcategoryName } from "@/lib/categories";
import Badge from "@/components/ui/Badge";
import Price from "@/components/ui/Price";

export default function ProductCard({ product }) {
  const { currency, addToCart } = useAppContext();
  const hasOffer = Number(product.offerPrice) < Number(product.price);
  const image = product.image?.[0];
  const secondaryImage = product.image?.[1] || image;
  const soldOut = Number(product.stock) <= 0;
  const isNew = Number(product.date) > Date.now() - 30 * 24 * 60 * 60 * 1000;

  return (
    <article className="group min-w-0">
      <Link href={`/product/${product._id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-brand-sand">
          {image && (
            <>
              <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className={`object-contain p-5 transition duration-500 group-hover:scale-105 ${product.image?.[1] ? "group-hover:opacity-0" : ""}`} />
              {product.image?.[1] && <Image src={secondaryImage} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-5 opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />}
            </>
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {soldOut ? <Badge variant="sold-out">Agotado</Badge> : hasOffer ? <Badge variant="sale">Oferta</Badge> : isNew ? <Badge variant="new">Nuevo</Badge> : null}
          </div>
        </div>
        <p className="mt-4 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{getCategoryName(product.category)}{product.subcategory ? ` · ${getSubcategoryName(product.category, product.subcategory)}` : ""}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-brand-ink transition group-hover:text-brand-accent">{product.name}</h3>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Price price={product.price} offerPrice={product.offerPrice} currency={currency} className="text-sm" />
        <button
          type="button"
          onClick={() => addToCart(product._id)}
          disabled={soldOut}
          className="rounded-full border border-brand-line px-3 py-2 text-[11px] font-semibold text-brand-ink transition hover:border-brand-accent hover:bg-brand-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
        >
          {soldOut ? "Agotado" : "Añadir"}
        </button>
      </div>
    </article>
  );
}
