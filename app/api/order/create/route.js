import { NextResponse } from "next/server";
import { getCommerceEnabled } from "@/lib/commerce";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import {
  isBoundedText,
  isEcuadorPhone,
  isEmail,
  isIdNumber,
  isSafeIdempotencyKey,
  isUuid,
} from "@/lib/validation";

const MAX_ITEMS = 20;
const MAX_QUANTITY = 99;

function isValidAddress(address) {
  return (
    address &&
    typeof address === "object" &&
    !Array.isArray(address) &&
    isBoundedText(address.fullName, 160) &&
    isEmail(address.email) &&
    isEcuadorPhone(address.phoneNumber) &&
    isIdNumber(address.idNumber) &&
    isBoundedText(address.area, 300) &&
    isBoundedText(address.city, 100) &&
    isBoundedText(address.state, 100)
  );
}

function isValidItems(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.length <= MAX_ITEMS &&
    items.every(
      (item) =>
        item &&
        isUuid(item.product) &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= MAX_QUANTITY
    )
  );
}

async function findOrderByIdempotencyKey(supabase, user, key) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) {
    // Columna aún no migrada: se continúa sin idempotencia.
    if (error.code === "42703") return { unsupported: true };
    throw error;
  }
  return { order: data };
}

function existingOrderResponse(order) {
  return NextResponse.json({
    success: true,
    orderId: order.id,
    emailSent: false,
    alreadyCreated: true,
    message: "La orden ya fue registrada anteriormente.",
  });
}

export async function POST(request) {
  const { supabase, user } = await getAuthenticatedSupabase(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Inicia sesión para crear una orden." }, { status: 401 });
  }

  try {
    if (!(await getCommerceEnabled(supabase))) {
      return NextResponse.json({ success: false, message: "Las compras están deshabilitadas temporalmente." }, { status: 403 });
    }

    const body = await request.json();
    const { address, items } = body;
    if (!isValidAddress(address) || !isValidItems(items)) {
      return NextResponse.json({ success: false, message: "Datos de la orden inválidos." }, { status: 400 });
    }

    const idempotencyKeyHeader = request.headers.get("idempotency-key");
    const idempotencyKey = isSafeIdempotencyKey(idempotencyKeyHeader) ? idempotencyKeyHeader : "";

    if (idempotencyKey) {
      const existing = await findOrderByIdempotencyKey(supabase, user, idempotencyKey);
      if (existing.order) return existingOrderResponse(existing.order);
    }

    const ids = [...new Set(items.map((item) => item.product))];
    try {
      const { data: catalog, error: catalogError } = await supabase
        .from("products")
        .select("id, stock, is_active")
        .in("id", ids);
      if (!catalogError && catalog) {
        const byId = new Map(catalog.map((product) => [product.id, product]));
        for (const item of items) {
          const product = byId.get(item.product);
          if (product && (product.is_active === false || Number(product.stock) < item.quantity)) {
            return NextResponse.json(
              { success: false, message: "Uno de los productos no está disponible o no tiene stock suficiente." },
              { status: 400 }
            );
          }
        }
      }
    } catch (error) {
      // La validación definitiva de stock debe hacerla create_order en transacción.
      console.error("No se pudo prevalidar el stock:", error.message);
    }

    const { data, error } = await supabase.rpc("create_order", {
      p_address: address,
      p_items: items,
    });
    if (error) {
      logError("Error guardando orden en Supabase:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear la orden. Verifica el stock y vuelve a intentarlo." },
        { status: 400 }
      );
    }

    if (idempotencyKey) {
      try {
        const { error: idemError } = await supabase
          .from("orders")
          .update({ idempotency_key: idempotencyKey })
          .eq("id", data.id)
          .eq("user_id", user.id);
        if (idemError?.code === "23505") {
          const existing = await findOrderByIdempotencyKey(supabase, user, idempotencyKey);
          if (existing.order) return existingOrderResponse(existing.order);
        }
        if (idemError && idemError.code !== "42703") {
          console.error("No se pudo registrar la clave de idempotencia:", idemError.message);
        }
      } catch (idemError) {
        console.error("No se pudo registrar la clave de idempotencia:", idemError.message);
      }
    }

    let emailSent = false;
    try {
      const { error: emailError } = await supabase.functions.invoke("send-order-email", {
        body: { orderId: data.id },
      });
      if (emailError) throw emailError;
      emailSent = true;
    } catch (emailError) {
      logError("La orden se guardó, pero falló el correo de confirmación:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      emailSent,
      message: emailSent
        ? "Orden registrada y correo enviado."
        : "Orden registrada; el correo de confirmación no pudo enviarse.",
    });
  } catch (error) {
    logError("Error procesando orden:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo procesar la orden." },
      { status: 500 }
    );
  }
}
