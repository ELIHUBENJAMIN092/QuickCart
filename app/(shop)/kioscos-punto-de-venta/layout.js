import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Kioscos y punto de venta",
  description:
    "Kioscos de autoservicio y terminales punto de venta para pedidos, pagos y atención al cliente, con integración e instalación en Ecuador.",
  path: "/kioscos-punto-de-venta",
});

export default function Layout({ children }) {
  return children;
}
