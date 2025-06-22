import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";

// Ruta: PUT /api/order/update-payment/:id
export async function PUT(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ success: false, message: "Orden no encontrada" }, { status: 404 });
    }

    // Marcar la orden como pagada
    order.isPaid = true;
    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
