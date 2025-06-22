import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";

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

    order.isPaid = true;
    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}
