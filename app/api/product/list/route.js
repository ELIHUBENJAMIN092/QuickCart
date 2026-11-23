import { NextResponse } from "next/server";
import { gzipSync } from "node:zlib";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";
import { loadPositions, sortByPosition } from "@/lib/productOrder";

export async function GET(request) {
  try {
    const { supabase: authenticatedClient, user } = await getAuthenticatedSupabase(request);
    const supabase = user ? authenticatedClient : createSupabasePublicClient();
    const { data, error } = await supabase.rpc("storefront_products");
    if (error) throw error;

    const positions = await loadPositions(supabase);
    const products = sortByPosition(data.map(mapProduct), positions);
    const body = JSON.stringify({ success: true, products });
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Accept-Encoding",
    };

    if ((request.headers.get("accept-encoding") || "").includes("gzip")) {
      return new NextResponse(gzipSync(body), {
        headers: { ...headers, "Content-Encoding": "gzip" },
      });
    }
    return new NextResponse(body, { headers });
  } catch (error) {
    console.error("Error cargando productos:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo cargar el catálogo." },
      { status: 500 }
    );
  }
}
