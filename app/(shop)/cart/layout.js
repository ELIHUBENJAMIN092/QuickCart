import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Carrito de compra",
  description:
    "Revisa los productos que has seleccionado, ajusta las cantidades y prepara tu pedido en la tienda de COMPEL.",
  path: "/cart",
});

export default function Layout({ children }) {
  return children;
}
