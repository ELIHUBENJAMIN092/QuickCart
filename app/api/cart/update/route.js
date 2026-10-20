import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function POST(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  try {
    const { cartData } = await request.json();
    const valid =
      cartData &&
      typeof cartData === "object" &&
      !Array.isArray(cartData) &&
      Object.entries(cartData).every(
        ([id, quantity]) => id.length <= 64 && Number.isInteger(quantity) && quantity > 0
      );
    if (!valid) {
      return NextResponse.json({ success: false, message: "El carrito no es válido." }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ cart_items: cartData, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando carrito:", error);
    return NextResponse.json({ success: false, message: "No se pudo actualizar el carrito." }, { status: 500 });
  }
}
