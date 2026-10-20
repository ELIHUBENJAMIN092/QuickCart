import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/supabase/records";

export async function PUT(request, context) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !(await authSeller(supabase, user.id))) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const { data, error } = await supabase
    .from("orders")
    .update({ is_paid: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, order_items(*)")
    .maybeSingle();
  if (error) {
    console.error("Error confirmando pago:", error);
    return NextResponse.json({ success: false, message: "No se pudo confirmar el pago." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: mapOrder(data) });
}
