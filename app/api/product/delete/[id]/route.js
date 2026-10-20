import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { removeProductMedia } from "@/lib/supabase/storage";

export async function DELETE(request, context) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { id } = await context.params;
    const { data: product, error: readError } = await supabase
      .from("products")
      .select("id, image_urls, video")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!product) {
      return NextResponse.json({ success: false, message: "Producto no encontrado." }, { status: 404 });
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    let cleanupPending = false;
    try {
      await removeProductMedia(supabase, [...(product.image_urls || []), product.video].filter(Boolean));
    } catch (cleanupError) {
      cleanupPending = true;
      console.error("No se pudieron eliminar algunos archivos del producto:", cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: cleanupPending
        ? "Producto eliminado; algunos archivos requieren limpieza."
        : "Producto e imágenes eliminados correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo eliminar el producto." },
      { status: 500 }
    );
  }
}
