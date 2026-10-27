import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { slugify } from "@/lib/categories";
import { loadCategoryRows, validateCategoryBody } from "@/lib/categoryServer";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

export async function GET() {
  const rows = await loadCategoryRows(createSupabasePublicClient());
  return NextResponse.json({ success: true, categories: rows });
}

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }
    const body = await request.json();
    const { values, error: invalid } = validateCategoryBody(body);
    if (invalid) return NextResponse.json({ success: false, message: invalid }, { status: 400 });

    const slug = slugify(values.name);
    if (!slug) return NextResponse.json({ success: false, message: "El título no es válido." }, { status: 400 });
    const imageUrl = body.imagePath
      ? await validateProductFile(supabase, user.id, body.imagePath, "categories", 8 * 1024 * 1024, "image/")
      : "";
    if (body.resetHeroImage) {
      values.hero = { ...(values.hero || {}), image_url: "" };
    }
    if (body.heroImagePath) {
      values.hero = {
        ...(values.hero || {}),
        image_url: await validateProductFile(supabase, user.id, body.heroImagePath, "categories", 8 * 1024 * 1024, "image/"),
      };
    }
    if (body.videoPath) {
      values.hero = {
        ...(values.hero || {}),
        video_url: await validateProductFile(supabase, user.id, body.videoPath, "categories", 100 * 1024 * 1024, "video/"),
      };
    }

    const { error } = await supabase.from("categories").insert({ slug, ...values, image_url: imageUrl });
    if (error) {
      const duplicated = error.code === "23505";
      return NextResponse.json(
        { success: false, message: duplicated ? "Ya existe una categoría con ese título." : "No se pudo crear la categoría." },
        { status: duplicated ? 409 : 500 }
      );
    }
    return NextResponse.json({ success: true, message: "Categoría creada." });
  } catch (error) {
    console.error("Error creando categoría:", error);
    if (String(error?.message || "").toLowerCase().includes("hero")) {
      return NextResponse.json({
        success: false,
        message: "Aplica la migración 20261027160000_category_heroes.sql para guardar la portada con video.",
      }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "No se pudo crear la categoría." }, { status: 500 });
  }
}
