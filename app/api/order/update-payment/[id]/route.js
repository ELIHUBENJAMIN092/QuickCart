import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/supabase/records";
import { isBoundedText, isUuid } from "@/lib/validation";
import { logError } from "@/lib/logger";

export async function PUT(request, context) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !(await authSeller(supabase, user.id))) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ success: false, message: "Identificador de orden inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentRef = isBoundedText(body.paymentRef, 80) ? body.paymentRef.trim() : null;

  try {
    const { data: current, error: readError } = await supabase
      .from("orders")
      .select("id, is_paid, status")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) {
      return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });
    }
    if (current.is_paid) {
      return NextResponse.json({ success: false, message: "Esta orden ya tiene el pago confirmado." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("orders")
      .update({
        is_paid: true,
        status: "paid",
        paid_at: now,
        paid_by: user.id,
        payment_ref: paymentRef,
        updated_at: now,
      })
      .eq("id", id)
      .eq("is_paid", false)
      .select("*, order_items(*)")
      .maybeSingle();
    if (error) {
      if (error.code === "42703") {
        return NextResponse.json(
          { success: false, message: "Aplica la migración 20261124150000_order_payment_audit.sql." },
          { status: 409 }
        );
      }
      throw error;
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "La orden fue confirmada por otro usuario." }, { status: 409 });
    }

    try {
      await supabase.from("order_payment_events").insert({
        order_id: id,
        actor: user.id,
        previous_status: current.status || "pending",
        new_status: "paid",
        payment_ref: paymentRef,
      });
    } catch (auditError) {
      console.error("No se pudo registrar el evento de pago:", auditError.message);
    }

    return NextResponse.json({ success: true, order: mapOrder(data) });
  } catch (error) {
    logError("Error confirmando pago:", error);
    return NextResponse.json({ success: false, message: "No se pudo confirmar el pago." }, { status: 500 });
  }
}
