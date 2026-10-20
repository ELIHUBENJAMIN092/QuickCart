import React from 'react';
import Link from 'next/link';
import { BarChart3, CreditCard, GalleryHorizontal, List, PackagePlus, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';

const SideBar = () => {
    const pathname = usePathname()
    const menuItems = [
        { name: 'Resumen', path: '/seller/dashboard', icon: BarChart3 },
        { name: 'Añadir producto', path: '/seller', icon: PackagePlus },
        { name: 'Productos', path: '/seller/product-list', icon: List },
        { name: 'Carrusel', path: '/seller/carousel', icon: GalleryHorizontal },
        { name: 'Órdenes', path: '/seller/orders', icon: ShoppingBag },
        { name: 'Pagos confirmados', path: '/seller/pagos', icon: CreditCard },
    ];

    return (
        <nav aria-label="Navegación de administración" className='sticky top-[65px] flex min-h-[calc(100vh-65px)] w-14 shrink-0 flex-col border-r border-brand-line bg-white py-3 text-sm md:w-60'>
            {menuItems.map((item) => {

                const isActive = pathname === item.path || (item.path === "/seller/product-list" && pathname.startsWith("/seller/edit-product"));

                return (
                    <Link href={item.path} key={item.name} aria-current={isActive ? "page" : undefined}>
                        <div
                            title={item.name}
                            className={`flex items-center gap-3 border-r-[3px] px-4 py-3 transition ${isActive
                                ? "border-brand-accent bg-brand-sand text-brand-accent"
                                : "border-transparent text-brand-charcoal hover:bg-brand-cream"
                            }`}
                        >
                            <item.icon size={19} aria-hidden="true" />
                            <p className='hidden md:block'>{item.name}</p>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
};

export default SideBar;
