import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDB from "@/config/db";

export async function GET(request, { params }) {

  try {

    await connectDB();

    // ✅ NEXT 15
    const id = (await params).id;

    const product = await Product.findById(id);

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error.message,
    });

  }

}