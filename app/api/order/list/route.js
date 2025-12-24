import connectDB from "@/config/db";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    await connectDB();

    const orders = await Order.find({ userId })
      .populate({
        path: "items.product",
        select: "name price offerPrice",
      })
      .sort({ date: -1 });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error in /api/order/list:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
