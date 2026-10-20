import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, products: data.map(mapProduct) });
  } catch (error) {
    console.error("Error cargando productos:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el catálogo." },
      { status: 500 }
    );
  }
}
