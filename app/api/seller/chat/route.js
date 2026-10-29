import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LEAD_STATUSES = ["new", "contacted", "closed"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !supabase || !(await authSeller(supabase, user.id))) {
    return jsonError("No autorizado.", 401);
  }

  const [
    leadsResult,
    feedbackResult,
    leadCount,
    newLeadCount,
    conversationCount,
    upCount,
    downCount,
    eventCounts,
  ] = await Promise.all([
      supabase.from("chat_leads").select("*").order("created_at", { ascending: false }).limit(100),
      supabase
        .from("chat_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("chat_leads").select("id", { count: "exact", head: true }),
      supabase.from("chat_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("chat_conversations").select("id", { count: "exact", head: true }),
      supabase.from("chat_feedback").select("id", { count: "exact", head: true }).eq("rating", "up"),
      supabase.from("chat_feedback").select("id", { count: "exact", head: true }).eq("rating", "down"),
      supabase.rpc("chat_event_counts"),
    ]);
  const eventStats = Object.fromEntries(
    (eventCounts.data || []).map(({ event_type, event_count }) => [event_type, event_count])
  );

  const firstError =
    leadsResult.error ||
    feedbackResult.error ||
    leadCount.error ||
    newLeadCount.error ||
    conversationCount.error ||
    upCount.error ||
    downCount.error ||
    eventCounts.error;

  if (firstError) {
    console.error("No se pudo cargar la bandeja del asistente:", firstError.message);
    return jsonError("No se pudo cargar la bandeja del asistente.", 500);
  }

  return NextResponse.json(
    {
      success: true,
      leads: leadsResult.data || [],
      feedback: feedbackResult.data || [],
      stats: {
        leads: leadCount.count || 0,
        newLeads: newLeadCount.count || 0,
        conversations: conversationCount.count || 0,
        feedbackUp: upCount.count || 0,
        feedbackDown: downCount.count || 0,
        messageSent: eventStats.message_sent || 0,
        productImpressions: eventStats.product_impression || 0,
        productClicks: eventStats.product_click || 0,
        addToCart: eventStats.add_to_cart || 0,
        handoffs: eventStats.handoff || 0,
        leadEvents: eventStats.lead_submitted || 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !supabase || !(await authSeller(supabase, user.id))) {
    return jsonError("No autorizado.", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("La solicitud no contiene JSON válido.", 400);
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!uuidPattern.test(leadId) || !LEAD_STATUSES.includes(status)) {
    return jsonError("Datos de la solicitud no válidos.", 400);
  }

  const { data, error } = await supabase
    .from("chat_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("No se pudo actualizar el lead:", error.message);
    return jsonError("No se pudo actualizar la solicitud.", 500);
  }
  if (!data) return jsonError("Solicitud no encontrada.", 404);

  return NextResponse.json(
    { success: true, lead: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}
