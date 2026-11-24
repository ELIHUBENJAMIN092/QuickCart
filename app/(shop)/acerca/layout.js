import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Quiénes somos y contacto",
  description:
    "Conoce a COMPEL: soluciones de identificación, captura de datos e impresión para empresas en Ecuador. Misión, visión y canales de contacto.",
  path: "/acerca",
});

export default function Layout({ children }) {
  return children;
}
