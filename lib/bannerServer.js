import { unstable_cache } from "next/cache";
import { buildBanner } from "@/lib/banner";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Carga el banner en el servidor. Se cachea para no consultar Supabase en cada
// visita; la API del admin invalida la caché al guardar.
export const getSiteBanner = unstable_cache(
  async () => {
    try {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from("site_banner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return buildBanner(data);
    } catch {
      return buildBanner(null);
    }
  },
  ["site-banner"],
  { revalidate: 3600, tags: ["site-banner"] }
);
