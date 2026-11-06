import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const order = Array.isArray(body?.order) ? body.order : [];
    if (!order.length || order.some((id) => typeof id !== "string" || !UUID.test(id)) || new Set(order).size !== order.length) {
      return NextResponse.json({ success: false, message: "El orden no es válido." }, { status: 400 });
    }

    const { error } = await supabase.rpc("reorder_products", { new_order: order });
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Orden actualizado." });
  } catch (error) {
    console.error("Error reordenando productos:", error);
    const missing = ["PGRST202", "42P01"].includes(error?.code);
    return NextResponse.json({
      success: false,
      message: missing
        ? "Aplica la migración 20261106150000_product_order.sql para guardar el orden."
        : "No se pudo guardar el orden de los productos.",
    }, { status: missing ? 409 : 500 });
  }
}
