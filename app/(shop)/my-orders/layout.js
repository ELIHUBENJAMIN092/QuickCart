import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Mis órdenes",
  description:
    "Consulta el estado, los productos y los detalles de las órdenes que has realizado en la tienda de COMPEL.",
  path: "/my-orders",
});

export default function Layout({ children }) {
  return children;
}
