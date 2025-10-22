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
      return NextResponse.json({ success: false, message: "Datos inválidos" });
    }

    await connectDB();

    // 🔹 Calcular monto total validando productos existentes
    const amount = await items.reduce(async (accP, item) => {
      const acc = await accP;
      const product = await Product.findById(item.product);

      // Si no existe el producto, lo omitimos del cálculo
      if (!product) {
        console.warn(`⚠️ Producto no encontrado en BD: ${item.product}`);
        return acc;
      }

      // Usa offerPrice o, si no existe, price o 0
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

    // 🔹 Enviar evento a Inngest (opcional)
    await inngest.send({
      name: "order/created",
      data: { userId, address, items, amount: total, date: Date.now() },
    });

    // 🔹 Limpiar carrito del usuario
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    // 🔹 Enviar correo de confirmación
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
            <td>${product.name}</td>
            <td>${item.quantity}</td>
            <td>$${price.toFixed(2)}</td>
            <td>$${(price * item.quantity).toFixed(2)}</td>
          </tr>`;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>🛍 ¡Gracias por tu compra, ${user.name || "cliente"}!</h2>
          <p>Hemos registrado tu pedido con éxito. Aquí tienes los detalles:</p>
          <table width="100%" border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          <p><strong>Dirección de envío:</strong> ${address}</p>
          <p><strong>Total (incluye impuestos):</strong> $${total}</p>
          <p>📦 Estado actual: <b>${newOrder.status}</b></p>
          <br/>
          <p>Te avisaremos cuando tu pedido sea enviado.</p>
          <p>Gracias por comprar en <b>Mi Tienda</b> 🛒</p>
        </div>`;

      await resend.emails.send({
        from: "Mi Tienda <onboarding@resend.dev>",
        to: user.email,
        subject: "✅ Compra registrada - Comprobante de tu pedido",
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Orden registrada y correo enviado",
    });
  } catch (error) {
    console.error("Error al guardar orden:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
