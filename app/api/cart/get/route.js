import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("cart_items")
    .eq("id", user.id)
    .single();
  if (error) {
    console.error("Error cargando carrito:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar el carrito." }, { status: 500 });
  }

  return NextResponse.json({ success: true, cartItems: data.cart_items || {} });
}
