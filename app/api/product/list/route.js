import { NextResponse } from "next/server";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";

export async function GET(request) {
  try {
    const { supabase: authenticatedClient, user } = await getAuthenticatedSupabase(request);
    const supabase = user ? authenticatedClient : createSupabasePublicClient();
    const { data, error } = await supabase.rpc("storefront_products");
    if (error) throw error;

    const products = data.map(mapProduct);
    return NextResponse.json(
      { success: true, products },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Error cargando productos:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el catálogo." },
      { status: 500 }
    );
  }
}
