import { createSupabasePublicClient } from "@/lib/supabase/server";
import { hideProductPrices } from "@/lib/productVisibility";

export async function getCommerceEnabled(supabase = createSupabasePublicClient()) {
  const { data, error } = await supabase
    .from("commerce_settings")
    .select("enabled")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data.enabled === true;
}

export { hideProductPrices };
