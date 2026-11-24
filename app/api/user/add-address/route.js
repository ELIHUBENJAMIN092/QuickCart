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
      email: String(address?.email || "").trim(),
      id_number: String(address?.idNumber || "").trim(),
      phone_number: String(address?.phoneNumber || "").trim(),
      area: String(address?.area || "").trim(),
      city: String(address?.city || "").trim(),
      state: String(address?.state || "").trim(),
    };
    if (
      !row.full_name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) ||
      !/^(\d{10}|\d{13})$/.test(row.id_number) ||
      !/^09\d{8}$/.test(row.phone_number) ||
      !row.area ||
      !row.city ||
      !row.state
    ) {
      return NextResponse.json(
        { success: false, message: "Completa los campos con un formato válido." },
        { status: 400 }
      );
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
        email: data.email,
        idNumber: data.id_number,
        phoneNumber: data.phone_number,
      },
    });
  } catch (error) {
    console.error("Error guardando dirección:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la dirección." }, { status: 500 });
  }
}
