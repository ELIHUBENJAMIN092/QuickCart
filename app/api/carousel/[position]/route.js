import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { validateSlideBody } from "@/lib/carouselServer";
import { loadCategoryRows } from "@/lib/categoryServer";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

export async function PUT(request, { params }) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { position } = await params;
    const target = Number(position);
    if (!Number.isInteger(target) || target < 1) {
      return NextResponse.json({ success: false, message: "Diapositiva no válida." }, { status: 400 });
    }

    const body = await request.json();
    const { values, error: invalid } = validateSlideBody(body, await loadCategoryRows(supabase));
    if (invalid) {
      return NextResponse.json({ success: false, message: invalid }, { status: 400 });
    }

    if (body.imagePath) {
      values.image_url = await validateProductFile(
        supabase, user.id, body.imagePath, "carousel", 8 * 1024 * 1024, "image/"
      );
    } else if (body.resetImage) {
      values.image_url = "";
    }

    const { error } = await supabase.from("carousel_slides").upsert({
      position: target,
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
