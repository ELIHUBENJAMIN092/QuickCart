import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Política de cookies",
  description:
    "Conoce qué cookies usa COMPEL, para qué sirven, cómo gestionar tus preferencias y cómo ejercer tus derechos de protección de datos.",
  path: "/politica-de-cookies",
});

export default function Layout({ children }) {
  return children;
}
