import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import authSeller from "@/lib/authSeller";
import { POPUP_LIMITS, buildPopup, clampVolume, isValidLink } from "@/lib/popup";
import { popupAudioVolumeSchema } from "@/lib/schemas";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { validateProductFile } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

// Pista de audio de fondo: MP3 de máximo 3 minutos. 8 MB cubren sobra a 320 kbps.
const AUDIO_MAX_BYTES = 8 * 1024 * 1024;
const AUDIO_ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/x-mpeg", "audio/mpeg3", "audio/x-mp3", "audio/mpga"];

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("site_popup").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, popup: buildPopup(data) });
  } catch (error) {
    console.error("Error cargando la ventana emergente:", error);
    return NextResponse.json({ success: true, popup: buildPopup(null) });
  }
}

export async function PUT(request) {
  revalidateTag("site-popup");
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    // El esquema usa volumen normalizado 0..1, pero la UI actual envía 0..100.
    // Se convierte para validar y se sigue persistiendo con clampVolume (0..100).
    const volumeCheck = popupAudioVolumeSchema.safeParse({
      audio_volume: clampVolume(body.audio_volume) / 100,
    });
    if (!volumeCheck.success) {
      return NextResponse.json({ success: false, message: "Revisa el volumen del audio." }, { status: 400 });
    }

    const values = {
      enabled: Boolean(body.enabled),
      audio_enabled: Boolean(body.audio_enabled),
      audio_volume: clampVolume(body.audio_volume),
    };

    for (const [field, max] of Object.entries(POPUP_LIMITS)) {
      const value = String(body[field] ?? "").trim();
      if (value.length > max || (field.endsWith("_url") && !isValidLink(value))) {
        return NextResponse.json({ success: false, message: `Revisa el campo ${field}.` }, { status: 400 });
      }
      values[field] = value;
    }

    if (body.imagePath) {
      values.image_url = await validateProductFile(
        supabase, user.id, body.imagePath, "popup", 8 * 1024 * 1024, "image/"
      );
    } else if (body.resetImage) {
      values.image_url = "";
    } else {
      const imageUrl = String(body.image_url ?? "").trim();
      if (imageUrl.length > 1000 || !isValidLink(imageUrl)) {
        return NextResponse.json({ success: false, message: "La imagen no es válida." }, { status: 400 });
      }
      values.image_url = imageUrl;
    }

    if (body.audioPath) {
      values.audio_url = await validateProductFile(
        supabase, user.id, body.audioPath, "popup-audio", AUDIO_MAX_BYTES, "audio/", AUDIO_ALLOWED_TYPES
      );
    } else if (body.resetAudio) {
      values.audio_url = "";
      values.audio_enabled = false;
    } else {
      const audioUrl = String(body.audio_url ?? "").trim();
      if (audioUrl.length > 1000 || !isValidLink(audioUrl)) {
        return NextResponse.json({ success: false, message: "La pista de audio no es válida." }, { status: 400 });
      }
      values.audio_url = audioUrl;
    }

    const { error } = await supabase.from("site_popup").upsert({
      id: 1, ...values, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Ventana emergente guardada." });
  } catch (error) {
    console.error("Error guardando ventana emergente:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la ventana emergente." }, { status: 500 });
  }
}
