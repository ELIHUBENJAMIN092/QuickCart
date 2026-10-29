import { NextResponse } from "next/server";
import {
  createSupabasePublicClient,
  getAuthenticatedSupabase,
} from "@/lib/supabase/server";
import { validateLead } from "@/lib/ai/lead";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { RATE_LIMITS } from "@/lib/ai/limits";
import { getClientKey } from "@/lib/ai/request";
import { isValidSessionId } from "@/lib/ai/session";

export const dynamic = "force-dynamic";

function jsonError(message, status, code) {
  return NextResponse.json(
    { success: false, code, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("La solicitud no contiene JSON válido.", 400, "INVALID_JSON");
  }

  const { lead, error } = validateLead(body);
  if (error) return jsonError(error, 400, "INVALID_LEAD");

  let auth = { supabase: null, user: null };
  try {
    auth = await getAuthenticatedSupabase(request);
  } catch (authError) {
    console.error("No se pudo validar la sesión del formulario:", authError.message);
  }

  const rateLimit = await checkRateLimit(getClientKey(request, auth.user), {
    ...RATE_LIMITS.lead,
    prefix: "lead",
  });
  if (rateLimit.unavailable) {
    return jsonError("El formulario está temporalmente indisponible.", 503, "RATE_LIMIT_UNAVAILABLE");
  }
  if (!rateLimit.allowed) {
    return jsonError(
      "Has enviado varias solicitudes. Espera un momento o escríbenos por WhatsApp.",
      429,
      "RATE_LIMITED"
    );
  }

  let supabase = auth.supabase;
  if (!supabase) {
    try {
      supabase = createSupabasePublicClient();
    } catch (clientError) {
      console.error("No se pudo inicializar el cliente para leads:", clientError.message);
      return jsonError("El formulario no está disponible en este momento.", 503, "LEAD_UNAVAILABLE");
    }
  }

  const sessionId = isValidSessionId(body.sessionId) ? body.sessionId : null;
  const { error: insertError } = await supabase.from("chat_leads").insert({
    user_id: auth.user?.id || null,
    session_id: sessionId,
    ...lead,
  });

  if (insertError) {
    console.error("No se pudo guardar la solicitud de asesoría:", insertError.message);
    return jsonError(
      "No se pudo enviar la solicitud. Intenta de nuevo o escríbenos por WhatsApp.",
      500,
      "LEAD_FAILED"
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Recibimos tu solicitud. Un asesor se pondrá en contacto contigo.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
