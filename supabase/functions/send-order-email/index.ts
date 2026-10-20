import { createClient } from "npm:@supabase/supabase-js@2";

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] as string);

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }
  const accessToken = authorization.replace(/^Bearer\s+/i, "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await request.json();
  const [{ data: order, error: orderError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("orders").select("id, amount, status, address, created_at, order_items(*)").eq("id", orderId).eq("user_id", user.id).single(),
    supabase.from("profiles").select("name, email").eq("id", user.id).single(),
  ]);
  if (orderError || profileError || !order || !profile) {
    return Response.json({ message: "Order details unavailable." }, { status: 404 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from || !profile.email) {
    return Response.json({ message: "Email delivery is not configured." }, { status: 503 });
  }

  const rows = (order.order_items || []).map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.product_name)}</td>
      <td style="padding:10px;text-align:center;border-bottom:1px solid #e5e7eb">${item.quantity}</td>
      <td style="padding:10px;text-align:right;border-bottom:1px solid #e5e7eb">$${Number(item.unit_price).toFixed(2)}</td>
    </tr>
  `).join("");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [profile.email],
      subject: "Confirmación de tu pedido",
      html: `
      <div style="font-family:Arial,sans-serif;color:#333;max-width:680px;margin:auto">
        <h2>Gracias por tu compra, ${escapeHtml(profile.name || "Cliente")}</h2>
        <p>Tu pedido fue registrado correctamente.</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
          <thead><tr><th align="left">Producto</th><th>Cantidad</th><th align="right">Precio</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right"><strong>Total (incluye IVA): $${Number(order.amount).toFixed(2)}</strong></p>
        <p>Estado: ${escapeHtml(order.status)}</p>
      </div>
    `,
    }),
  });
  if (!emailResponse.ok) {
    console.error("El proveedor de correo rechazó la confirmación:", emailResponse.status);
    return Response.json({ message: "Email delivery failed." }, { status: 502 });
  }

  return Response.json({ success: true });
});
