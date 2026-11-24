import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/supabase/records";

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit"));
  const requestedOffset = Number(searchParams.get("offset"));
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 50;
  const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, 1_000_000) : 0;

  const columns =
    "id, user_id, amount, is_paid, status, address, created_at, updated_at, order_items(id, product_id, product_name, product_image, unit_price, quantity)";

  let { data, error, count } = await supabase
    .from("orders")
    .select(columns, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error?.code === "42703") {
    ({ data, error, count } = await supabase
      .from("orders")
      .select(
        "id, user_id, amount, is_paid, address, created_at, updated_at, order_items(id, product_id, product_name, product_image, unit_price, quantity)",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1));
  }
  if (error) {
    console.error("Error cargando órdenes:", error.message);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las órdenes." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orders: (data || []).map(mapOrder),
    total: count ?? (data || []).length,
    limit,
    offset,
  });
}
