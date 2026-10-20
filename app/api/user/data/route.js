import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, role, cart_items")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error cargando perfil:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar el perfil." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, message: "No existe el perfil de usuario." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      ...data,
      _id: data.id,
      imageUrl: data.avatar_url,
      cartItems: data.cart_items,
    },
  });
}
