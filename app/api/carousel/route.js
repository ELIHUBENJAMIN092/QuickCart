import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { buildSlides } from "@/lib/carousel";
import { validateSlideBody } from "@/lib/carouselServer";
import { loadCategoryRows } from "@/lib/categoryServer";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("carousel_slides").select("*").order("position");
    if (error) throw error;
    return NextResponse.json({ success: true, slides: buildSlides(data) });
  } catch (error) {
    console.error("Error cargando el carrusel:", error);
    return NextResponse.json({ success: true, slides: buildSlides([]) });
  }
}

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
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
    }

    const { data: last, error: lastError } = await supabase
      .from("carousel_slides")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;

    const { data, error } = await supabase
      .from("carousel_slides")
      .insert({ position: (last?.position || 0) + 1, ...values })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Diapositiva creada.", slide: data });
  } catch (error) {
    console.error("Error creando diapositiva:", error);
    if (error?.code === "23514") {
      return NextResponse.json({
        success: false,
        message: "La base de datos aún limita el carrusel a 4 diapositivas. Aplica la migración 20261027130000_carousel_add_reorder.sql.",
      }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "No se pudo crear la diapositiva." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const order = Array.isArray(body.order) ? body.order.map(Number) : [];
    if (!order.length || order.some((position) => !Number.isInteger(position))) {
      return NextResponse.json({ success: false, message: "El orden no es válido." }, { status: 400 });
    }

    const { data: rows, error: rowsError } = await supabase.from("carousel_slides").select("position");
    if (rowsError) throw rowsError;

    const current = (rows || []).map((row) => row.position).sort((a, b) => a - b);
    const next = [...order].sort((a, b) => a - b);
    if (current.length !== next.length || current.some((position, index) => position !== next[index])) {
      return NextResponse.json({ success: false, message: "El orden no coincide con las diapositivas actuales." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("reorder_carousel_slides", { new_order: order });
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Orden actualizado.", slides: buildSlides(data) });
  } catch (error) {
    console.error("Error reordenando el carrusel:", error);
    return NextResponse.json({ success: false, message: "No se pudo reordenar el carrusel." }, { status: 500 });
  }
}
