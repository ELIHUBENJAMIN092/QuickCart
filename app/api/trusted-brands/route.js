import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { removeProductMedia, validateProductFile } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function removeOwnedUpload(supabase, user, path) {
  if (!path || !path.startsWith(`${user.id}/brands/`)) return;
  const { error } = await supabase.storage.from("product-media").remove([path]);
  if (error) console.error("No se pudo limpiar el logo que no se guardó:", error);
}

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("trusted_brands")
      .select("id, name, logo_url, position")
      .order("position");
    if (error) throw error;

    return NextResponse.json(
      { success: true, brands: data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error cargando las marcas de confianza:", error);
    return NextResponse.json(
      { success: false, message: "No se pudieron cargar las marcas." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request) {
  let supabase;
  let user;
  let imagePath = "";
  try {
    ({ supabase, user } = await getAuthenticatedSupabase(request));
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }
    imagePath = typeof body.imagePath === "string" ? body.imagePath : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60 || typeof body.imagePath !== "string" || !body.imagePath) {
      await removeOwnedUpload(supabase, user, imagePath);
      return NextResponse.json({ success: false, message: "Ingresa un nombre y carga el logo de la marca." }, { status: 400 });
    }

    const logoUrl = await validateProductFile(
      supabase, user.id, imagePath, "brands", 8 * 1024 * 1024, "image/", allowedImageTypes
    );
    const { data: last, error: lastError } = await supabase
      .from("trusted_brands")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;

    const { data, error } = await supabase
      .from("trusted_brands")
      .insert({ name, logo_url: logoUrl, position: (last?.position || 0) + 1 })
      .select("id, name, logo_url, position")
      .single();
    if (error?.code === "23505") {
      await removeOwnedUpload(supabase, user, imagePath);
      return NextResponse.json({ success: false, message: "Ya existe una marca con ese nombre." }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Marca agregada al carrusel.", brand: data });
  } catch (error) {
    console.error("Error agregando una marca de confianza:", error);
    if (supabase && user) await removeOwnedUpload(supabase, user, imagePath);
    return NextResponse.json({ success: false, message: "No se pudo agregar la marca." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }
    if (!Array.isArray(body.order) || body.order.some((id) => typeof id !== "string" || !uuidPattern.test(id)) || new Set(body.order).size !== body.order.length) {
      return NextResponse.json({ success: false, message: "El orden de las marcas no es válido." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("reorder_trusted_brands", { new_order: body.order });
    if (error) throw error;
    return NextResponse.json({ success: true, brands: data, message: "Orden de marcas actualizado." });
  } catch (error) {
    console.error("Error reordenando las marcas de confianza:", error);
    return NextResponse.json({ success: false, message: "No se pudo actualizar el orden de las marcas." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }
    if (typeof body.id !== "string" || !uuidPattern.test(body.id)) {
      return NextResponse.json({ success: false, message: "La marca seleccionada no es válida." }, { status: 400 });
    }

    const { data: brand, error: lookupError } = await supabase
      .from("trusted_brands")
      .select("id, logo_url")
      .eq("id", body.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!brand) return NextResponse.json({ success: false, message: "La marca ya no existe." }, { status: 404 });

    const { error } = await supabase.from("trusted_brands").delete().eq("id", brand.id);
    if (error) throw error;

    let cleanupWarning = false;
    try {
      await removeProductMedia(supabase, [brand.logo_url]);
    } catch (cleanupError) {
      cleanupWarning = true;
      console.error("La marca se eliminó, pero no se pudo borrar su archivo:", cleanupError);
    }

    return NextResponse.json({
      success: true,
      cleanupWarning,
      message: cleanupWarning
        ? "La marca se eliminó, pero no se pudo borrar el archivo del logo."
        : "Marca eliminada.",
    });
  } catch (error) {
    console.error("Error eliminando una marca de confianza:", error);
    return NextResponse.json({ success: false, message: "No se pudo eliminar la marca." }, { status: 500 });
  }
}
