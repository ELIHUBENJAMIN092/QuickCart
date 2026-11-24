import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";
import { isUuid } from "@/lib/validation";

// Devuelve el producto completo (incluidos los precios) sin depender del interruptor de la tienda.
export async function GET(request, { params }) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ success: false, message: "Identificador de producto inválido." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, product: mapProduct(data) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Error cargando producto para edición:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar el producto." }, { status: 500 });
  }
}
