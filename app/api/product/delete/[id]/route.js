import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "No autorizado" });
    }

    await connectDB();

    // Buscar el producto antes de eliminarlo
    const product = await Product.findOne({
      _id: params.id,
      userId,
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        message: "Producto no encontrado o no te pertenece",
      });
    }

    // Eliminar imágenes de Cloudinary (si las URLs tienen public_id)
    for (const imageUrl of product.image) {
      // Extraer public_id de la URL
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];
      const publicId = fileName.split('.')[0]; // quita .jpg, .png, etc.

      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
        });
      } catch (error) {
        console.warn(`Error eliminando imagen Cloudinary (${publicId}):`, error.message);
      }
    }

    // Eliminar el producto de la base de datos
    await Product.findByIdAndDelete(product._id);

    return NextResponse.json({ success: true, message: "Producto e imágenes eliminadas correctamente" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
