import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Orden registrada correctamente",
  description: "Confirmamos tu compra en COMPEL. Revisa el estado y los detalles de tu orden desde tu cuenta.",
  path: "/order-placed",
});

export default function Layout({ children }) {
  return children;
}
