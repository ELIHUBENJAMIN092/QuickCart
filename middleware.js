import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/visits";

const CACHE_TTL = 60 * 1000;
const cache = new Map();

async function isBlocked(ip) {
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.blocked;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/is_ip_blocked`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_ip: ip }),
      cache: "no-store",
    });
    if (!response.ok) return false;

    const blocked = (await response.json()) === true;
    if (cache.size > 5000) cache.clear();
    cache.set(ip, { blocked, at: Date.now() });
    return blocked;
  } catch {
    // Si la consulta falla, no se bloquea a nadie.
    return false;
  }
}

const blockedPage = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Acceso restringido | COMPEL</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #eef1f7; color: #0b0d12; font-family: Arial, Helvetica, sans-serif; }
      main { width: 100%; max-width: 480px; background: #fff; border: 1px solid #e0e3ea; padding: 36px 28px; text-align: center; }
      span { display: inline-block; background: #eaf3ff; color: #0069ff; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; padding: 6px 10px; }
      h1 { margin: 18px 0 10px; font-size: 26px; }
      p { margin: 0; color: #6f7480; font-size: 14px; line-height: 1.7; }
      a { display: inline-block; margin-top: 24px; background: #0069ff; color: #fff; padding: 12px 22px; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <span>Acceso restringido</span>
      <h1>No podemos mostrar esta página</h1>
      <p>El acceso desde tu conexión fue restringido por el administrador del sitio. Si crees que es un error, contáctanos para revisarlo.</p>
      <a href="/Contactos">Contactar</a>
    </main>
  </body>
</html>`;

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/seller") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  if (!ip) return NextResponse.next();

  if (await isBlocked(ip)) {
    return new NextResponse(blockedPage, {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
