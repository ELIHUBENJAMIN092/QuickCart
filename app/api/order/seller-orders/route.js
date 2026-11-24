import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/supabase/records";

const ORDER_COLUMNS =
  "id, user_id, amount, is_paid, status, paid_at, paid_by, payment_ref, address, created_at, updated_at, order_items(id, product_id, product_name, product_image, unit_price, quantity)";
const BASE_COLUMNS =
  "id, user_id, amount, is_paid, address, created_at, updated_at, order_items(id, product_id, product_name, product_image, unit_price, quantity)";
const MAX_LIMIT = 100;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
}

export async function GET(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user || !(await authSeller(supabase, user.id))) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = clamp(searchParams.get("limit"), 1, MAX_LIMIT, 50);
  const offset = clamp(searchParams.get("offset"), 0, 1_000_000, 0);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const safeSearch = search.replace(/[%,()]/g, " ").trim().slice(0, 80);

  const buildQuery = (columns) => {
    let query = supabase
      .from("orders")
      .select(columns, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "paid") query = query.eq("is_paid", true);
    if (status === "pending") query = query.eq("is_paid", false);
    if (process.env.SELLER_ORDER_SCOPE === "own") query = query.eq("user_id", user.id);
    if (safeSearch) {
      query = query.or(
        [
          `address->>fullName.ilike.%${safeSearch}%`,
          `address->>idNumber.ilike.%${safeSearch}%`,
          `address->>email.ilike.%${safeSearch}%`,
          `address->>phoneNumber.ilike.%${safeSearch}%`,
        ].join(",")
      );
    }
    return query;
  };

  let result = await buildQuery(ORDER_COLUMNS);
  if (result.error?.code === "42703") {
    // Compatibilidad con proyectos que aún no aplicaron la migración de pagos.
    result = await buildQuery(BASE_COLUMNS);
  }
  if (result.error) {
    console.error("Error cargando órdenes de administración:", result.error.message);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las órdenes." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orders: (result.data || []).map(mapOrder),
    total: result.count ?? (result.data || []).length,
    limit,
    offset,
  });
}
