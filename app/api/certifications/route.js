import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { buildCertifications, CERTIFICATION_HEIGHT, defaultCertifications, isCertificationId } from "@/lib/certifications";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { removeProductMedia, validateProductFile } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const MIGRATION_FILE = "20261104130000_certifications.sql";
const noStore = { "Cache-Control": "no-store" };

const isMissingTable = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01" || /certifications/i.test(error?.message || "") && /find|exist|schema cache/i.test(error?.message || "");

async function removeOwnedUpload(supabase, user, path) {
  if (!path || !path.startsWith(`${user.id}/certifications/`)) return;
  const { error } = await supabase.storage.from("product-media").remove([path]);
  if (error) console.error("No se pudo limpiar el sello que no se guardó:", error);
}

function parseName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > 80) return null;
  return name;
}

function parseHeight(value, fallback = CERTIFICATION_HEIGHT.default) {
  const height = Number(value ?? fallback);
  if (!Number.isFinite(height)) return null;
  const rounded = Math.round(height);
  if (rounded < CERTIFICATION_HEIGHT.min || rounded > CERTIFICATION_HEIGHT.max) return null;
  return rounded;
}

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("certifications").select("*").order("position");
    if (error) throw error;

    return NextResponse.json(
      { success: true, certifications: buildCertifications(data) },
      { headers: noStore }
    );
  } catch (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        {
          success: true,
          pending: true,
          certifications: defaultCertifications,
          message: `Aplica la migración ${MIGRATION_FILE} para administrar los sellos.`,
        },
        { headers: noStore }
      );
    }
    console.error("Error cargando las certificaciones:", error);
    return NextResponse.json(
      { success: false, message: "No se pudieron cargar las certificaciones." },
      { status: 500, headers: noStore }
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
    const name = parseName(body.name);
    const height = parseHeight(body.height);
    if (!name || !imagePath || height === null) {
      await removeOwnedUpload(supabase, user, imagePath);
      return NextResponse.json({ success: false, message: "Ingresa un nombre, el sello y un tamaño válido." }, { status: 400 });
    }

    const imageUrl = await validateProductFile(
      supabase, user.id, imagePath, "certifications", 8 * 1024 * 1024, "image/", allowedImageTypes
    );

    const { data: last, error: lastError } = await supabase
      .from("certifications")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;

    const { data, error } = await supabase
      .from("certifications")
      .insert({ name, image_url: imageUrl, height, position: (last?.position || 0) + 1 })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Sello agregado al carrusel.", certification: data },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Error agregando una certificación:", error);
    if (supabase && user) await removeOwnedUpload(supabase, user, imagePath);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los sellos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudo agregar el sello." }, { status: 500 });
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

    if (Array.isArray(body.order)) {
      const order = body.order;
      if (!order.length || order.some((id) => !isCertificationId(id)) || new Set(order).size !== order.length) {
        return NextResponse.json({ success: false, message: "El orden de los sellos no es válido." }, { status: 400 });
      }

      const { data, error } = await supabase.rpc("reorder_certifications", { new_order: order });
      if (error) throw error;
      return NextResponse.json(
        { success: true, certifications: buildCertifications(data), message: "Orden de sellos actualizado." },
        { headers: noStore }
      );
    }

    if (!isCertificationId(body.id)) {
      return NextResponse.json({ success: false, message: "El sello seleccionado no es válido." }, { status: 400 });
    }

    const values = {};
    if (body.name !== undefined) {
      const name = parseName(body.name);
      if (!name) return NextResponse.json({ success: false, message: "El nombre del sello no es válido." }, { status: 400 });
      values.name = name;
    }
    if (body.height !== undefined) {
      const height = parseHeight(body.height, null);
      if (height === null) return NextResponse.json({ success: false, message: "El tamaño del sello no es válido." }, { status: 400 });
      values.height = height;
    }
    if (!Object.keys(values).length) {
      return NextResponse.json({ success: false, message: "No hay cambios para guardar." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("certifications")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, message: "El sello ya no existe." }, { status: 404 });

    return NextResponse.json(
      { success: true, certification: data, message: "Sello actualizado." },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Error actualizando las certificaciones:", error);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los sellos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudieron actualizar los sellos." }, { status: 500 });
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
    if (!isCertificationId(body.id)) {
      return NextResponse.json({ success: false, message: "El sello seleccionado no es válido." }, { status: 400 });
    }

    const { data: certification, error: lookupError } = await supabase
      .from("certifications")
      .select("id, image_url")
      .eq("id", body.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!certification) return NextResponse.json({ success: false, message: "El sello ya no existe." }, { status: 404 });

    const { error } = await supabase.from("certifications").delete().eq("id", certification.id);
    if (error) throw error;

    let cleanupWarning = false;
    try {
      await removeProductMedia(supabase, [certification.image_url]);
    } catch (cleanupError) {
      cleanupWarning = true;
      console.error("El sello se eliminó, pero no se pudo borrar su archivo:", cleanupError);
    }

    return NextResponse.json({
      success: true,
      cleanupWarning,
      message: cleanupWarning
        ? "El sello se eliminó, pero no se pudo borrar su archivo."
        : "Sello eliminado.",
    });
  } catch (error) {
    console.error("Error eliminando una certificación:", error);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los sellos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudo eliminar el sello." }, { status: 500 });
  }
}
