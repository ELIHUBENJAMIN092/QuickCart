const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.compelecuador.com";

// Sin barra final para poder concatenar rutas y generar URLs absolutas.
export const siteUrl = SITE_URL.replace(/\/$/, "");
export const metadataBase = new URL(siteUrl);

const DEFAULT_TITLE = "COMPEL | Tecnología para identificar y optimizar tu negocio";
const DEFAULT_DESCRIPTION =
  "Soluciones profesionales de código de barras, RFID, identificación PVC y cómputo móvil en Ecuador.";

export function buildPageMetadata({ title, description, path, type = "website", image }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "COMPEL",
      locale: "es_EC",
      type,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const siteMetadata = {
  metadataBase,
  title: {
    default: DEFAULT_TITLE,
    template: "%s | COMPEL",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "COMPEL",
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "/",
    siteName: "COMPEL",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};
