import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export async function POST(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  try {
    const { address } = await request.json();
    const row = {
      user_id: user.id,
      full_name: String(address?.fullName || "").trim(),
      phone_number: String(address?.phoneNumber || "").trim(),
      area: String(address?.area || "").trim(),
      city: String(address?.city || "").trim(),
      state: String(address?.state || "").trim(),
    };
    if (!row.full_name || !row.area || !row.city || !row.state) {
      return NextResponse.json({ success: false, message: "Completa los campos obligatorios." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Dirección añadida satisfactoriamente.",
      newAddress: {
        ...data,
        _id: data.id,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
      },
    });
  } catch (error) {
    console.error("Error guardando dirección:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la dirección." }, { status: 500 });
  }
}
