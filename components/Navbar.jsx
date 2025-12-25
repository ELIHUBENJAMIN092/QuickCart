"use client";

import React, { useState } from "react";
import { assets, BagIcon, CartIcon as ClerkCartIcon } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

import CartIcon from "@/components/CartIcon"; // 👈 carrito con contador

const Navbar = () => {
  const { isSeller, router, user, getCartCount } = useAppContext();
  const { openSignIn } = useClerk();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      {/* Logo */}
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="logo"
        priority
      />

      {/* Menú grande (desktop) */}
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">Inicio</Link>
        <Link href="/Productos" className="hover:text-gray-900 transition">Productos</Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">Tienda 🛒</Link>
        <Link href="/Acerca" className="hover:text-gray-900 transition">Nosotros</Link>
        <Link href="/Contactos" className="hover:text-gray-900 transition">Contactos</Link>

        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-4 py-1.5 rounded-full"
          >
            Administrador
          </button>
        )}
      </div>

      {/* Acciones usuario (desktop) */}
      <ul className="hidden md:flex items-center gap-4">
        {/* 🔴 ICONO CARRITO VISIBLE */}
        <CartIcon count={getCartCount()} />

        {/* CLERK (se mantiene igual) */}
        {user ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Carrito"
                labelIcon={<ClerkCartIcon />}
                onClick={() => router.push("/cart")}
              />
            </UserButton.MenuItems>

            <UserButton.MenuItems>
              <UserButton.Action
                label="Mis Ordenes"
                labelIcon={<BagIcon />}
                onClick={() => router.push("/my-orders")}
              />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 hover:text-gray-900 transition"
          >
            <Image src={assets.user_icon} alt="user icon" />
            Cuenta
          </button>
        )}
      </ul>

      {/* Vista móvil */}
      <div className="md:hidden flex items-center gap-3">
        {/* 🔴 ICONO CARRITO MÓVIL */}
        <CartIcon count={getCartCount()} />

        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-3 py-1 rounded-full"
          >
            Administrador
          </button>
        )}

        {/* Botón menú */}
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Clerk móvil (igual que antes) */}
        {user ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Carrito"
                labelIcon={<ClerkCartIcon />}
                onClick={() => router.push("/cart")}
              />
            </UserButton.MenuItems>

            <UserButton.MenuItems>
              <UserButton.Action
                label="Mis Ordenes"
                labelIcon={<BagIcon />}
                onClick={() => router.push("/my-orders")}
              />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button onClick={openSignIn}>
            <Image src={assets.user_icon} alt="user icon" />
          </button>
        )}
      </div>

      {/* Menú desplegable móvil */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md border-t border-gray-200 flex flex-col items-start px-6 py-4 space-y-4 md:hidden z-50">
          <Link href="/" onClick={() => setIsOpen(false)}>Inicio</Link>
          <Link href="/Productos" onClick={() => setIsOpen(false)}>Productos</Link>
          <Link href="/all-products" onClick={() => setIsOpen(false)}>Tienda 🛒</Link>
          <Link href="/Acerca" onClick={() => setIsOpen(false)}>Sobre Nosotros</Link>
          <Link href="/Contactos" onClick={() => setIsOpen(false)}>Contactos</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
