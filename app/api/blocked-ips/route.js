import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { isValidIp } from "@/lib/visits";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";

const MIGRATION_FILE = "20261106120000_site_visits.sql";

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

export async function GET(request) {
  const supabase = await authorize(request);
  if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

  const { data, error } = await supabase
    .from("blocked_ips")
    .select("ip, reason, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (migrationError(error)) {
      return NextResponse.json(
        { success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` },
        { status: 503 }
      );
    }
    console.error("Error cargando IPs bloqueadas:", error.message);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las IPs bloqueadas." }, { status: 500 });
  }

  return NextResponse.json({ success: true, blocked: data || [] });
}

export async function POST(request) {
  const supabase = await authorize(request);
  if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ip = String(body.ip || "").trim();
  const reason = String(body.reason || "").trim().slice(0, 200);

  if (!isValidIp(ip)) {
    return NextResponse.json({ success: false, message: "Ingresa una dirección IP válida." }, { status: 400 });
  }

  const { error } = await supabase
    .from("blocked_ips")
    .upsert({ ip, reason }, { onConflict: "ip" });

  if (error) {
    if (migrationError(error)) {
      return NextResponse.json(
        { success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` },
        { status: 503 }
      );
    }
    console.error("Error bloqueando IP:", error.message);
    return NextResponse.json({ success: false, message: "No se pudo bloquear la IP." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `La IP ${ip} fue bloqueada.` });
}

export async function DELETE(request) {
  const supabase = await authorize(request);
  if (!supabase) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ip = String(body.ip || new URL(request.url).searchParams.get("ip") || "").trim();

  if (!isValidIp(ip)) {
    return NextResponse.json({ success: false, message: "Ingresa una dirección IP válida." }, { status: 400 });
  }

  const { error } = await supabase.from("blocked_ips").delete().eq("ip", ip);

  if (error) {
    if (migrationError(error)) {
      return NextResponse.json(
        { success: false, code: "MIGRATION_REQUIRED", message: `Aplica la migración ${MIGRATION_FILE}.` },
        { status: 503 }
      );
    }
    console.error("Error desbloqueando IP:", error.message);
    return NextResponse.json({ success: false, message: "No se pudo desbloquear la IP." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `La IP ${ip} fue desbloqueada.` });
}
