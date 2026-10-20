import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { BANNER_LIMITS, buildBanner, isValidLink } from "@/lib/banner";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("site_banner").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, banner: buildBanner(data) });
  } catch (error) {
    console.error("Error cargando el banner:", error);
    return NextResponse.json({ success: true, banner: buildBanner(null) });
  }
}

export async function PUT(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const values = { enabled: Boolean(body.enabled) };
    for (const [field, max] of Object.entries(BANNER_LIMITS)) {
      const value = String(body[field] ?? "").trim();
      if (value.length > max || (field.endsWith("_url") && !isValidLink(value))) {
        return NextResponse.json({ success: false, message: `Revisa el campo ${field}.` }, { status: 400 });
      }
      values[field] = value;
    }
    if (!HEX.test(body.bg_color) || !HEX.test(body.text_color)) {
      return NextResponse.json({ success: false, message: "Colores no válidos." }, { status: 400 });
    }
    values.bg_color = body.bg_color;
    values.text_color = body.text_color;

    const { error } = await supabase.from("site_banner").upsert({
      id: 1, ...values, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Banner guardado." });
  } catch (error) {
    console.error("Error guardando banner:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar el banner." }, { status: 500 });
  }
}
