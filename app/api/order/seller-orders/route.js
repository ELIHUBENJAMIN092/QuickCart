import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Not authorized",
      });
    }

    await connectDB();
    Product.length;
    const orders = await Order.find({})
      .populate("items.product")
      .sort({ date: -1 });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Seller order error:", error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}
