import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function PUT(req, context) {

  try {

    // Conectar MongoDB
    await connectDB();

    // Obtener params correctamente
    const params = await context.params;

    // Obtener body
    const body = await req.json();

    // Actualizar producto
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        category: body.category,
        offerPrice: body.offerPrice,
        stock: body.stock,
      },
      {
        new: true,
      }
    );

    // Validar producto
    if (!updatedProduct) {

      return NextResponse.json({
        success: false,
        message: "Producto no encontrado",
      });

    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "Producto actualizado",
      product: updatedProduct,
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error.message,
    });

  }

}