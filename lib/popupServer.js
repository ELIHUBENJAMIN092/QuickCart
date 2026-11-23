import { unstable_cache } from "next/cache";
import { buildPopup } from "@/lib/popup";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Carga la ventana emergente en el servidor. La API del admin invalida la
// caché con el tag "site-popup" cuando se guarda o desactiva.
export const getSitePopup = unstable_cache(
  async () => {
    try {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from("site_popup")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return buildPopup(data);
    } catch {
      return buildPopup(null);
    }
  },
  ["site-popup"],
  { revalidate: 3600, tags: ["site-popup"] }
);
