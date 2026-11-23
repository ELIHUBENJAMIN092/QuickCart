import { buildPopup } from "@/lib/popup";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Carga la ventana emergente en el servidor para que el primer render ya la
// muestre sin parpadeo y sin depender de una petición extra del cliente.
export async function getSitePopup() {
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
}
