import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDB from "@/config/db";

export async function PUT(request, { params }) {

  try {

    await connectDB();

    // ✅ NEXT 15
    const id = (await params).id;

    const body = await request.json();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: body.name,
        category: body.category,
        offerPrice: body.offerPrice,
        stock: body.stock,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error.message,
    });

  }

}