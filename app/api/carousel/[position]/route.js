import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { defaultSlides } from "@/lib/carousel";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

const LIMITS = { eyebrow: 80, title: 140, description: 300, primary_label: 40, secondary_label: 40 };

export async function PUT(request, { params }) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { position } = await params;
    const slide = defaultSlides.find((item) => String(item.position) === position);
    if (!slide) {
      return NextResponse.json({ success: false, message: "Diapositiva no válida." }, { status: 400 });
    }

    const body = await request.json();
    const values = {};
    for (const [field, max] of Object.entries(LIMITS)) {
      const value = String(body[field] ?? "").trim();
      if (!value || value.length > max) {
        return NextResponse.json({ success: false, message: `Revisa el campo ${field} (máximo ${max} caracteres).` }, { status: 400 });
      }
      values[field] = value;
    }

    if (body.imagePath) {
      values.image_url = await validateProductFile(
        supabase, user.id, body.imagePath, "carousel", 8 * 1024 * 1024, "image/"
      );
    } else if (body.resetImage) {
      values.image_url = "";
    }

    const { error } = await supabase.from("carousel_slides").upsert({
      position: slide.position,
      category: slide.category,
      ...values,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Diapositiva guardada." });
  } catch (error) {
    console.error("Error guardando diapositiva:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la diapositiva." }, { status: 500 });
  }
}
