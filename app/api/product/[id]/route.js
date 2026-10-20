import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product: mapProduct(data) });
  } catch (error) {
    console.error("Error cargando producto:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el producto." },
      { status: 500 }
    );
  }
}
