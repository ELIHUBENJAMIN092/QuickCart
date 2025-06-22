import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function DELETE(request, context) {
  try {
    const { params } = context;
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "No autorizado" });
    }

    await connectDB();

    const deletedProduct = await Product.findOneAndDelete({
      _id: params.id,
      userId,
    });

    if (!deletedProduct) {
      return NextResponse.json({ success: false, message: "Producto no encontrado" });
    }

    return NextResponse.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
