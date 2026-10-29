import { NextResponse } from "next/server";
import {
  createSupabasePublicClient,
  getAuthenticatedSupabase,
} from "@/lib/supabase/server";
import { validateFeedback } from "@/lib/ai/feedback";
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

  const { feedback, error } = validateFeedback(body);
  if (error) return jsonError(error, 400, "INVALID_FEEDBACK");

  let auth = { supabase: null, user: null };
  try {
    auth = await getAuthenticatedSupabase(request);
  } catch (authError) {
    console.error("No se pudo validar la sesión del feedback:", authError.message);
  }

  const rateLimit = await checkRateLimit(getClientKey(request, auth.user), {
    ...RATE_LIMITS.feedback,
    prefix: "feedback",
  });
  if (rateLimit.unavailable) {
    return jsonError("El servicio está temporalmente indisponible.", 503, "RATE_LIMIT_UNAVAILABLE");
  }
  if (!rateLimit.allowed) {
    return jsonError("Recibimos varias opiniones seguidas. Intenta más tarde.", 429, "RATE_LIMITED");
  }

  let supabase = auth.supabase;
  if (!supabase) {
    try {
      supabase = createSupabasePublicClient();
    } catch (clientError) {
      console.error("No se pudo inicializar el cliente para feedback:", clientError.message);
      return jsonError("No se pudo registrar tu opinión.", 503, "FEEDBACK_UNAVAILABLE");
    }
  }

  const { error: insertError } = await supabase.from("chat_feedback").insert({
    user_id: auth.user?.id || null,
    session_id: isValidSessionId(body.sessionId) ? body.sessionId : null,
    rating: feedback.rating,
    comment: feedback.comment,
    message_excerpt: feedback.messageExcerpt,
  });

  if (insertError) {
    console.error("No se pudo guardar el feedback del chat:", insertError.message);
    return jsonError("No se pudo registrar tu opinión.", 500, "FEEDBACK_FAILED");
  }

  return NextResponse.json(
    { success: true, message: "Gracias por tu opinión." },
    { headers: { "Cache-Control": "no-store" } }
  );
}
