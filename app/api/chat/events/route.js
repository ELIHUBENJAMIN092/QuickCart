import { NextResponse } from "next/server";
import {
  createSupabasePublicClient,
  getAuthenticatedSupabase,
} from "@/lib/supabase/server";
import { validateEvent } from "@/lib/ai/events";
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

  const { event, error } = validateEvent(body);
  if (error) return jsonError(error, 400, "INVALID_EVENT");

  let auth = { supabase: null, user: null };
  try {
    auth = await getAuthenticatedSupabase(request);
  } catch {
    // La analítica no debe fallar por una sesión inválida.
  }

  const rateLimit = await checkRateLimit(getClientKey(request, auth.user), {
    ...RATE_LIMITS.events,
    prefix: "events",
  });
  if (rateLimit.unavailable) {
    return jsonError("El registro de eventos está temporalmente indisponible.", 503, "RATE_LIMIT_UNAVAILABLE");
  }
  if (!rateLimit.allowed) {
    return jsonError("Demasiados eventos.", 429, "RATE_LIMITED");
  }

  let supabase = auth.supabase;
  if (!supabase) {
    try {
      supabase = createSupabasePublicClient();
    } catch {
      return NextResponse.json({ success: true, skipped: true }, { status: 202 });
    }
  }

  const { error: insertError } = await supabase.from("chat_events").insert({
    user_id: auth.user?.id || null,
    session_id: isValidSessionId(body.sessionId) ? body.sessionId : null,
    event_type: event.type,
    metadata: event.metadata,
  });

  if (insertError) {
    console.error("No se pudo guardar el evento del chat:", insertError.message);
    return jsonError("No se pudo registrar el evento.", 500, "EVENT_FAILED");
  }

  return NextResponse.json(
    { success: true },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
}
