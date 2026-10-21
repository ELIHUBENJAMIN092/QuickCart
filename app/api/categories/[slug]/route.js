import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { defaultCategoryRows, validateCategoryBody } from "@/lib/categoryServer";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

async function authorize(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !(await authSeller(supabase, user.id))) return {};
  return { supabase, user };
}

export async function PUT(request, { params }) {
  try {
    const { supabase, user } = await authorize(request);
    if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    const { slug } = await params;
    const body = await request.json();
    const { values, error: invalid } = validateCategoryBody(body);
    if (invalid) return NextResponse.json({ success: false, message: invalid }, { status: 400 });

    const update = { ...values, updated_at: new Date().toISOString() };
    if (body.imagePath) {
      update.image_url = await validateProductFile(supabase, user.id, body.imagePath, "categories", 8 * 1024 * 1024, "image/");
    } else if (body.resetImage) {
      update.image_url = "";
    }

    // Si la categoría aún no está guardada en la base (usa valores por defecto), se crea.
    const { data: existing, error: readError } = await supabase.from("categories").select("slug").eq("slug", slug).maybeSingle();
    if (readError) throw readError;
    if (!existing && !defaultCategoryRows().some((row) => row.slug === slug)) {
      return NextResponse.json({ success: false, message: "Categoría no encontrada." }, { status: 404 });
    }
    const { error } = existing
      ? await supabase.from("categories").update(update).eq("slug", slug)
      : await supabase.from("categories").insert({ slug, image_url: "", ...update });
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Categoría guardada." });
  } catch (error) {
    console.error("Error guardando categoría:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la categoría." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { supabase } = await authorize(request);
    if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    const { slug } = await params;

    const { count, error: countError } = await supabase
      .from("products").select("id", { count: "exact", head: true }).eq("category", slug);
    if (countError) throw countError;
    if (count > 0) {
      return NextResponse.json({ success: false, message: `No se puede eliminar: tiene ${count} producto(s). Muévelos a otra categoría primero.` }, { status: 409 });
    }
    const { error } = await supabase.from("categories").delete().eq("slug", slug);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Categoría eliminada." });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    return NextResponse.json({ success: false, message: "No se pudo eliminar la categoría." }, { status: 500 });
  }
}
