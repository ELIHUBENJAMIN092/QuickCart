import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order"; // 🔥 IMPORTANTE
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db"; // Asegúrate de conectar a DB

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid data' });
    }

    await connectDB(); // 🔌 Conectar a DB

    // calcular monto total
    const amount = await items.reduce(async (accP, item) => {
      const acc = await accP;
      const product = await Product.findById(item.product);
      return acc + product.offerPrice * item.quantity;
    }, Promise.resolve(0));

    const tax = amount * 0.15;
    const total = parseFloat((amount + tax).toFixed(2));

    // guardar orden en MongoDB
    await Order.create({
      userId,
      address,
      items,
      amount: total,
      status: "Order Placed",
      date: Date.now()
    });

    // enviar evento a Inngest (opcional)
    await inngest.send({
      name: 'order/created',
      data: {
        userId,
        address,
        items,
        amount: total,
        date: Date.now()
      }
    });

    // limpiar carrito
    const user = await User.findById(userId);
    user.cartItems = {};
    await user.save();

    return NextResponse.json({ success: true, message: 'Orden Registrada' });
  } catch (error) {
    console.log("Error al guardar orden:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
