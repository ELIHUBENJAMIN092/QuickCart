import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getClientIp, isLikelyBot } from "@/lib/visits";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { hasTrustedOrigin } from "@/lib/csrf";
import { visitBodySchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { getClientKey } from "@/lib/ai/request";

const MIGRATION_FILE = "20261106120000_site_visits.sql";
const MAX_LIMIT = 1000;

function migrationError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return code === "42P01" || message.includes("does not exist") || message.includes("could not find the function");
}

async function authorize(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!supabase || !user || !(await authSeller(supabase, user.id))) return null;
  return supabase;
}

// Registro público de visitas. La función SQL decide si la IP está bloqueada.
export async function POST(request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: "Origen no permitido." }, { status: 403 });
  }

  try {
    const parsedBody = visitBodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json({ success: false, message: "Datos de la visita no válidos." }, { status: 400 });
    }
    const body = parsedBody.data;

    const ip = getClientIp(request);
    if (!ip) return NextResponse.json({ success: true });

    const userAgent = String(request.headers.get("user-agent") || "");
    if (isLikelyBot(userAgent)) return NextResponse.json({ success: true });

    const rateLimit = await checkRateLimit(getClientKey(request), {
      prefix: "visits",
      limit: 60,
      windowMs: 60 * 1000,
    });
    // El registro de visitas es best-effort: si el limitador compartido falla,
    // no bloqueamos el registro (el resto de la ruta tampoco falla).
    if (!rateLimit.unavailable && !rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, message: "Demasiadas solicitudes." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("record_site_visit", {
      p_ip: ip,
      p_path: String(body.path || "/").slice(0, 300),
      p_referrer: String(body.referrer || "").slice(0, 1000),
      p_user_agent: userAgent.slice(0, 500),
      p_country: String(request.headers.get("x-vercel-ip-country") || "").slice(0, 80),
      p_city: String(request.headers.get("x-vercel-ip-city") || "").slice(0, 80),
    });

    if (error) {
      if (migrationError(error)) {
        return NextResponse.json({ success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` }, { status: 503 });
      }
      console.error("Error registrando visita:", error.message);
      return NextResponse.json({ success: true });
    }

    if (data === true) {
      return NextResponse.json({ success: false, blocked: true, message: "Acceso bloqueado." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registrando visita:", error);
    return NextResponse.json({ success: true });
  }
}

export async function GET(request) {
  const supabase = await authorize(request);
  if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 7, 1), 90);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 300, 1), MAX_LIMIT);
  const search = String(searchParams.get("search") || "")
    .replace(/[%,()]/g, " ")
    .trim()
    .slice(0, 80);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("site_visits")
    .select("id, ip, path, referrer, user_agent, country, city, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) query = query.or(`ip.ilike.%${search}%,path.ilike.%${search}%`);

  const [visitsResult, blockedResult] = await Promise.all([
    query,
    supabase.from("blocked_ips").select("ip, reason, created_at").order("created_at", { ascending: false }),
  ]);

  const error = visitsResult.error || blockedResult.error;
  if (error) {
    if (migrationError(error)) {
      return NextResponse.json(
        { success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` },
        { status: 503 }
      );
    }
    console.error("Error cargando visitas:", error.message);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las visitas." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    visits: visitsResult.data || [],
    blocked: blockedResult.data || [],
    days,
    limit,
  });
}

export async function DELETE(request) {
  const supabase = await authorize(request);
  if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days"));

  let query = supabase.from("site_visits").delete();
  query = days > 0
    ? query.lt("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    : query.gte("created_at", "1970-01-01T00:00:00.000Z");

  const { error } = await query;
  if (error) {
    if (migrationError(error)) {
      return NextResponse.json(
        { success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` },
        { status: 503 }
      );
    }
    console.error("Error limpiando visitas:", error.message);
    return NextResponse.json({ success: false, message: "No se pudo limpiar el historial." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: days > 0 ? `Se eliminaron las visitas de hace más de ${days} días.` : "Historial de visitas eliminado." });
}
