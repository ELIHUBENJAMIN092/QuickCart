import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Dirección de envío",
  description:
    "Registra o actualiza la dirección de entrega de tus pedidos en COMPEL para recibir tus productos donde lo necesites.",
  path: "/add-address",
});

export default function Layout({ children }) {
  return children;
}
