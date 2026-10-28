import { NextResponse } from "next/server";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { supabase: authenticatedClient, user } = await getAuthenticatedSupabase(request);
    const supabase = user ? authenticatedClient : createSupabasePublicClient();
    const { data, error } = await supabase.rpc("storefront_product", {
      p_product_id: id,
    });
    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, product: mapProduct(data) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Error cargando producto:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el producto." },
      { status: 500 }
    );
  }
}
