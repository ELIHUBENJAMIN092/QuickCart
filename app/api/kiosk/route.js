import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { buildKiosk } from "@/lib/kiosk";
import { validateKioskBody } from "@/lib/kioskServer";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("kiosk_page").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, kiosk: buildKiosk(data) });
  } catch (error) {
    console.error("Error cargando la página de kioscos:", error);
    return NextResponse.json({ success: true, kiosk: buildKiosk(null) });
  }
}

export async function PUT(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { values, error: invalid } = validateKioskBody(body);
    if (invalid) {
      return NextResponse.json({ success: false, message: invalid }, { status: 400 });
    }

    if (body.videoPath) {
      values.video_url = await validateProductFile(
        supabase, user.id, body.videoPath, "kiosks", 100 * 1024 * 1024, "video/"
      );
    }

    const { data, error } = await supabase
      .from("kiosk_page")
      .upsert({ id: 1, ...values, updated_at: new Date().toISOString() })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Página de kioscos guardada.", kiosk: buildKiosk(data) });
  } catch (error) {
    console.error("Error guardando la página de kioscos:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la página de kioscos." }, { status: 500 });
  }
}
