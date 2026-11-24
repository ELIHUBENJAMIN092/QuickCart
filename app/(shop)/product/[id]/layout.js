import { createSupabasePublicClient } from "@/lib/supabase/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const path = `/product/${id}`;

  try {
    const supabase = createSupabasePublicClient();
    const { data: product, error } = await supabase.rpc("storefront_product", {
      p_product_id: id,
    });
    if (error || !product) throw error || new Error("Producto no encontrado.");

    const name = product.name || "Producto COMPEL";
    const rawDescription = String(product.description || "").replace(/\s+/g, " ").trim();
    const description = rawDescription
      ? rawDescription.length > 155
        ? `${rawDescription.slice(0, 155).trimEnd()}…`
        : rawDescription
      : "Descubre las especificaciones y aplicaciones de este producto en el catálogo de COMPEL.";

    return buildPageMetadata({
      title: name,
      description,
      path,
      type: "website",
    });
  } catch {
    return buildPageMetadata({
      title: "Producto COMPEL",
      description: "Explora el catálogo de soluciones de identificación, RFID y cómputo móvil de COMPEL.",
      path,
    });
  }
}

export default function Layout({ children }) {
  return children;
}
