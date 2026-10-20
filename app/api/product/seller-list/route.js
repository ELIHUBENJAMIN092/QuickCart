import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, products: data.map(mapProduct) });
  } catch (error) {
    console.error("Error obteniendo el inventario:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el inventario." },
      { status: 500 }
    );
  }
}
