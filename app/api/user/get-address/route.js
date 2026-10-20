import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error cargando direcciones:", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las direcciones." }, { status: 500 });
  }

  const addresses = data.map((address) => ({
    ...address,
    _id: address.id,
    fullName: address.full_name,
    phoneNumber: address.phone_number,
  }));
  return NextResponse.json({ success: true, addresses });
}
