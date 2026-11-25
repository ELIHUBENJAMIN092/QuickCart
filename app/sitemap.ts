import type { MetadataRoute } from "next";
import { categories } from "@/lib/categories";
import { loadCategoryRows } from "@/lib/categoryServer";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const publicPaths = [
    "/",
    "/all-products",
    "/acerca",
    "/kioscos-punto-de-venta",
    "/impresoras-etiquetas",
    "/politica-de-cookies",
  ];

  let categorySlugs = categories.map((category) => category.slug);
  try {
    const rows = await loadCategoryRows(createSupabasePublicClient());
    const fromDatabase = rows.map((row) => row.slug).filter(Boolean);
    if (fromDatabase.length) categorySlugs = [...new Set(fromDatabase)];
  } catch {
    // Si Supabase no responde se publican las categorías por defecto.
  }

  return [...publicPaths, ...categorySlugs.map((slug) => `/categoria/${slug}`)].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));
}
