"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CartIcon({ count = 0 }) {
  return (
    <Link href="/cart" className="relative inline-flex">
      {/* Icono carrito */}
      <ShoppingCart className="w-6 h-6 text-gray-500 hover:text-blue-600 transition-colors" />

      {/* Badge contador */}
      {count > 0 && (
        <span
          className="
            absolute -top-2 -right-2
            flex items-center justify-center
            w-5 h-5
            rounded-full
            bg-red-600
            text-white
            text-[10px]
            font-semibold
            leading-none
          "
        >
          {count}
        </span>
      )}
    </Link>
  );
}
