import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getCommerceEnabled } from "@/lib/commerce";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const enabled = await getCommerceEnabled();
    return NextResponse.json(
      { success: true, enabled },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error cargando la configuración del carrito:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar la configuración de la tienda." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PUT(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "La solicitud no contiene JSON válido." },
        { status: 400 }
      );
    }
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { success: false, message: "El estado del carrito no es válido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("commerce_settings")
      .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select("enabled")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      enabled: data.enabled,
      message: body.enabled
        ? "Precios y carrito visibles solo para clientes con sesión iniciada."
        : "Precios y carrito ocultos en la tienda.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error actualizando la configuración del carrito:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo guardar la configuración de la tienda." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
