import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import {
  buildContacts,
  defaultContacts,
  isContactId,
  isValidContactPhone,
  normalizeContactPhone,
} from "@/lib/contacts";
import { createSupabasePublicClient, getAuthenticatedSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLE = "whatsapp_contacts";
const MIGRATION_FILE = "20261104171600_whatsapp_contacts.sql";
const noStore = { "Cache-Control": "no-store" };

const isMissingTable = (error) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  (/whatsapp_contacts/i.test(error?.message || "") && /find|exist|schema cache/i.test(error?.message || ""));

function parseName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > 80) return null;
  return name;
}

function parsePhone(value) {
  const phone = normalizeContactPhone(value);
  return isValidContactPhone(phone) ? phone : null;
}

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, name, phone, position, updated_at")
      .order("position");
    if (error) throw error;

    return NextResponse.json(
      { success: true, contacts: buildContacts(data) },
      { headers: noStore }
    );
  } catch (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        {
          success: true,
          pending: true,
          contacts: defaultContacts,
          message: `Aplica la migración ${MIGRATION_FILE} para administrar los contactos.`,
        },
        { headers: noStore }
      );
    }
    console.error("Error cargando los contactos de WhatsApp:", error);
    return NextResponse.json(
      { success: false, message: "No se pudieron cargar los contactos." },
      { status: 500, headers: noStore }
    );
  }
}

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }

    const name = parseName(body.name);
    const phone = parsePhone(body.phone);
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Ingresa un nombre y un celular de Ecuador de 10 dígitos." },
        { status: 400 }
      );
    }

    const { data: last, error: lastError } = await supabase
      .from(TABLE)
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ name, phone, position: (last?.position || 0) + 1 })
      .select("id, name, phone, position, updated_at")
      .single();
    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Contacto agregado.", contact: data },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Error agregando un contacto de WhatsApp:", error);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los contactos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudo agregar el contacto." }, { status: 500 });
  }
}

async function reorderContactsDirectly(supabase, order) {
  const { data: rows, error: listError } = await supabase.from(TABLE).select("id");
  if (listError) throw listError;

  const existing = new Set((rows || []).map((row) => row.id));
  if (existing.size !== order.length || order.some((id) => !existing.has(id))) {
    throw new Error("El orden de los contactos no coincide con los registros actuales.");
  }

  for (let index = 0; index < order.length; index += 1) {
    const { error } = await supabase
      .from(TABLE)
      .update({ position: -1000000 - (index + 1) })
      .eq("id", order[index]);
    if (error) throw error;
  }

  for (let index = 0; index < order.length; index += 1) {
    const { error } = await supabase
      .from(TABLE)
      .update({ position: index + 1, updated_at: new Date().toISOString() })
      .eq("id", order[index]);
    if (error) throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, phone, position, updated_at")
    .order("position");
  if (error) throw error;
  return data;
}

export async function PATCH(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }

    if (Array.isArray(body.order)) {
      const order = body.order;
      if (!order.length || order.some((id) => !isContactId(id)) || new Set(order).size !== order.length) {
        return NextResponse.json({ success: false, message: "El orden de los contactos no es válido." }, { status: 400 });
      }

      const { data: rpcData, error } = await supabase.rpc("reorder_whatsapp_contacts", { new_order: order });
      const data = error ? await reorderContactsDirectly(supabase, order) : rpcData;
      return NextResponse.json(
        { success: true, contacts: buildContacts(data), message: "Orden de contactos actualizado." },
        { headers: noStore }
      );
    }

    if (!isContactId(body.id)) {
      return NextResponse.json({ success: false, message: "El contacto seleccionado no es válido." }, { status: 400 });
    }

    const values = {};
    if (body.name !== undefined) {
      const name = parseName(body.name);
      if (!name) return NextResponse.json({ success: false, message: "El nombre del contacto no es válido." }, { status: 400 });
      values.name = name;
    }
    if (body.phone !== undefined) {
      const phone = parsePhone(body.phone);
      if (!phone) {
        return NextResponse.json(
          { success: false, message: "Ingresa un celular de Ecuador de 10 dígitos (ej. 0984617873)." },
          { status: 400 }
        );
      }
      values.phone = phone;
    }
    if (!Object.keys(values).length) {
      return NextResponse.json({ success: false, message: "No hay cambios para guardar." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select("id, name, phone, position, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, message: "El contacto ya no existe." }, { status: 404 });

    return NextResponse.json(
      { success: true, contact: data, message: "Contacto actualizado." },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Error actualizando los contactos de WhatsApp:", error);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los contactos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudieron actualizar los contactos." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON válido." }, { status: 400 });
    }
    if (!isContactId(body.id)) {
      return NextResponse.json({ success: false, message: "El contacto seleccionado no es válido." }, { status: 400 });
    }

    const { data: contact, error: lookupError } = await supabase
      .from(TABLE)
      .select("id")
      .eq("id", body.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!contact) return NextResponse.json({ success: false, message: "El contacto ya no existe." }, { status: 404 });

    const { error } = await supabase.from(TABLE).delete().eq("id", contact.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Contacto eliminado." });
  } catch (error) {
    console.error("Error eliminando un contacto de WhatsApp:", error);
    if (isMissingTable(error)) {
      return NextResponse.json(
        { success: false, message: `Aplica la migración ${MIGRATION_FILE} para administrar los contactos.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: "No se pudo eliminar el contacto." }, { status: 500 });
  }
}
