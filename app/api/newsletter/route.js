import { NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { getClientKey } from "@/lib/ai/request";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

const MIGRATION_FILE = "20261124170000_newsletter.sql";

function migrationError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

export async function POST(request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: "Origen no permitido." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    // Honeypot: los bots rellenan este campo oculto.
    if (body.website) return NextResponse.json({ success: true });

    const email = String(body.email || "").trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Ingresa un correo electrónico válido." }, { status: 400 });
    }
    if (body.accepted !== true) {
      return NextResponse.json({ success: false, message: "Debes aceptar recibir comunicaciones." }, { status: 400 });
    }

    const rateLimit = await checkRateLimit(getClientKey(request), {
      prefix: "newsletter",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimit.unavailable) {
      return NextResponse.json({ success: false, message: "El servicio no está disponible, intenta más tarde." }, { status: 503 });
    }
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, message: "Demasiados intentos. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const supabase = createSupabasePublicClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) {
      if (migrationError(error)) {
        return NextResponse.json(
          { success: false, message: `Aplica la migración ${MIGRATION_FILE}.` },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: "¡Gracias por suscribirte!" });
  } catch (error) {
    logError("Error suscribiendo al boletín:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo completar la suscripción." },
      { status: 500 }
    );
  }
}
