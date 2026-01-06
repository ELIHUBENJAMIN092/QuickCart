import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!address || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Datos inválidos",
      });
    }

    await connectDB();

    // 🔹 Calcular total validando productos
    const amount = await items.reduce(async (accP, item) => {
      const acc = await accP;
      const product = await Product.findById(item.product);

      if (!product) {
        console.warn(`⚠️ Producto no encontrado: ${item.product}`);
        return acc;
      }

      const price =
        product.offerPrice !== undefined
          ? product.offerPrice
          : product.price || 0;

      return acc + price * item.quantity;
    }, Promise.resolve(0));

    const tax = amount * 0.15;
    const total = parseFloat((amount + tax).toFixed(2));

    // 🔹 Guardar orden
    const newOrder = await Order.create({
      userId,
      address,
      items,
      amount: total,
      status: "Order Placed",
      date: Date.now(),
    });

    // 🔹 Evento Inngest
    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount: total,
        date: Date.now(),
      },
    });

    // 🔹 Limpiar carrito
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    // 🔹 Enviar correo
    if (user?.email) {
      let productRows = "";

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        const price =
          product.offerPrice !== undefined
            ? product.offerPrice
            : product.price || 0;

        productRows += `
          <tr>
            <td style="padding:10px; border-bottom:1px solid #e5e7eb;">
              ${product.name}
            </td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #e5e7eb;">
              ${item.quantity}
            </td>
            <td style="padding:10px; text-align:right; border-bottom:1px solid #e5e7eb;">
              $${price.toFixed(2)}
            </td>
            <td style="padding:10px; text-align:right; border-bottom:1px solid #e5e7eb;">
              $${(price * item.quantity).toFixed(2)}
            </td>
          </tr>
        `;
      }

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f9fafb; padding:20px; color:#111827;">
          <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

            <h2 style="margin-top:0;">
              🛍 Gracias por tu compra, ${user.name || "Cliente"}
            </h2>

            <p style="font-size:14px; color:#374151;">
              Tu pedido ha sido registrado exitosamente. A continuación el detalle:
            </p>

            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-top:16px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:12px; text-align:left; border-bottom:2px solid #e5e7eb;">
                    Producto
                  </th>
                  <th style="padding:12px; text-align:center; border-bottom:2px solid #e5e7eb;">
                    Cant.
                  </th>
                  <th style="padding:12px; text-align:right; border-bottom:2px solid #e5e7eb;">
                    Precio
                  </th>
                  <th style="padding:12px; text-align:right; border-bottom:2px solid #e5e7eb;">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody style="font-size:14px; color:#374151;">
                ${productRows}
              </tbody>
            </table>

            <div style="margin-top:20px; text-align:right;">
              <p style="font-size:14px; margin:4px 0;">
                <strong>Total (incluye impuestos):</strong>
                <span style="font-size:16px; color:#16a34a;">
                  $${total}
                </span>
              </p>
              <p style="font-size:13px; color:#6b7280;">
                Estado del pedido: <strong>${newOrder.status}</strong>
              </p>
            </div>

            <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />

            <p style="font-size:13px; color:#6b7280;">
              Te notificaremos cuando tu pedido sea enviado.
            </p>

            <p style="font-size:13px; color:#6b7280;">
              Gracias por comprar en <strong>Mi Tienda</strong>
            </p>

          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Mi Tienda <onboarding@resend.dev>",
        to: user.email,
        subject: "🛍 Confirmación de compra",
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Orden registrada y correo enviado",
    });
  } catch (error) {
    console.error("❌ Error al guardar orden:", error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}
