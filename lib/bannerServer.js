import { buildBanner } from "@/lib/banner";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Carga el banner en el servidor para que el primer render ya muestre el
// mensaje configurado y no el texto por defecto durante un instante.
export async function getSiteBanner() {
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
}
