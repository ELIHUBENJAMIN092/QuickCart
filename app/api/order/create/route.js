import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function POST(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión para crear una orden." }, { status: 401 });
  }

  try {
    const { address, items } = await request.json();
    const requiredAddressFields = ["fullName", "email", "phoneNumber", "idNumber", "area", "city", "state"];
    if (
      !address ||
      requiredAddressFields.some((field) => typeof address[field] !== "string" || !address[field].trim()) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.some((item) => !item || typeof item.product !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1)
    ) {
      return NextResponse.json({ success: false, message: "Datos de la orden inválidos." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("create_order", {
      p_address: address,
      p_items: items,
    });
    if (error) {
      console.error("Error guardando orden en Supabase:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear la orden. Verifica el stock y vuelve a intentarlo." },
        { status: 400 }
      );
    }

    let emailSent = false;
    try {
      const { error: emailError } = await supabase.functions.invoke("send-order-email", {
        body: { orderId: data.id },
      });
      if (emailError) throw emailError;
      emailSent = true;
    } catch (emailError) {
      console.error("La orden se guardó, pero falló el correo de confirmación:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      emailSent,
      message: emailSent
        ? "Orden registrada y correo enviado."
        : "Orden registrada; el correo de confirmación no pudo enviarse.",
    });
  } catch (error) {
    console.error("Error procesando orden:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo procesar la orden." },
      { status: 500 }
    );
  }
}
