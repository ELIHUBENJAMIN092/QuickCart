import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/supabase/records";

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !(await authSeller(supabase, user.id))) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error cargando órdenes de administración:", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las órdenes." }, { status: 500 });
  }

  return NextResponse.json({ success: true, orders: data.map(mapOrder) });
}
