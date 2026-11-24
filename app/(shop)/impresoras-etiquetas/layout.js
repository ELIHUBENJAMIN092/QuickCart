import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Impresoras de etiquetas",
  description:
    "Impresoras de etiquetas portátiles, de escritorio e industriales para retail, logística e industria. Encuentra el modelo ideal en COMPEL.",
  path: "/impresoras-etiquetas",
});

export default function Layout({ children }) {
  return children;
}
