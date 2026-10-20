"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import OrderSummary from "@/components/OrderSummary";
import { useAppContext } from "@/context/AppContext";
import Container from "@/components/ui/Container";
import Price from "@/components/ui/Price";

export default function Cart() {
  const { currency, products, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();
  const cartProducts = Object.entries(cartItems)
    .map(([id, quantity]) => ({ product: products.find((item) => item._id === id), quantity }))
    .filter(({ product, quantity }) => product && quantity > 0);

  return (
    <>
      <main className="min-h-[55vh]">
        <Container className="py-12 md:py-16">
          <div className="mb-8 flex items-end justify-between border-b border-brand-line pb-6">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Tu selección</p><h1 className="font-display text-4xl text-brand-ink">Carrito de compra</h1></div>
            <span className="text-sm text-brand-muted">{getCartCount()} artículos</span>
          </div>
          {cartProducts.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto text-brand-muted" size={42} strokeWidth={1.2} />
              <h2 className="mt-5 font-display text-2xl text-brand-ink">Tu carrito está esperando.</h2>
              <p className="mt-2 text-sm text-brand-muted">Explora soluciones COMPEL y encuentra lo que necesitas.</p>
              <Link href="/all-products" className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover">Explorar catálogo</Link>
            </div>
          ) : (
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px]">
              <div className="divide-y divide-brand-line">
                {cartProducts.map(({ product, quantity }) => (
                  <article key={product._id} className="grid grid-cols-[88px_1fr] gap-4 py-5 sm:grid-cols-[112px_1fr_auto] sm:gap-6">
                    <Link href={`/product/${product._id}`} className="relative aspect-square bg-white">
                      {product.image?.[0] && <Image src={product.image[0]} alt={product.name} fill sizes="112px" className="object-contain p-2" />}
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/product/${product._id}`} className="line-clamp-2 text-sm font-medium text-brand-ink hover:text-brand-accent">{product.name}</Link>
                      <Price price={product.price} offerPrice={product.offerPrice} currency={currency} className="mt-2 text-sm" />
                      <button onClick={() => updateCartQuantity(product._id, 0)} className="mt-3 inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-sale"><Trash2 size={13} /> Eliminar</button>
                    </div>
                    <div className="col-start-2 flex items-center justify-between sm:col-start-auto sm:flex-col sm:items-end sm:justify-between">
                      <div className="inline-flex items-center rounded-full border border-brand-line">
                        <button onClick={() => updateCartQuantity(product._id, quantity - 1)} className="p-2.5 text-brand-ink" aria-label="Disminuir cantidad"><Minus size={13} /></button>
                        <span className="min-w-7 text-center text-xs">{quantity}</span>
                        <button onClick={() => addToCart(product._id)} className="p-2.5 text-brand-ink" aria-label="Aumentar cantidad"><Plus size={13} /></button>
                      </div>
                      <p className="text-sm font-semibold text-brand-ink">{currency}{(Number(product.offerPrice ?? product.price) * quantity).toFixed(2)}</p>
                    </div>
                  </article>
                ))}
                <Link href="/all-products" className="mt-5 inline-block text-sm font-medium text-brand-accent hover:underline">← Continuar comprando</Link>
              </div>
              <OrderSummary />
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
