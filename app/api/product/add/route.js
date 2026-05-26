import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

// CONFIGURAR CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {

    try {

        // OBTENER USUARIO
        const { userId } = getAuth(request)

        // VALIDAR SI ES SELLER
        const isSeller = await authSeller(userId)

        if (!isSeller) {

            return NextResponse.json({
                success: false,
                message: 'not authorized'
            })

        }

        // OBTENER FORMDATA
        const formData = await request.formData()

        // DATOS
        const name = formData.get('name')

        const description = formData.get('description')

        const category = formData.get('category')

        const price = formData.get('price')

        const offerPrice = formData.get('offerPrice')

        // 🔥 STOCK
        const stock = formData.get('stock')

        // IMÁGENES
        const files = formData.getAll('images')

        // VIDEO
        const videoFile = formData.get('video')

        // VALIDAR IMÁGENES
        if (!files || files.length === 0) {

            return NextResponse.json({
                success: false,
                message: 'No files uploaded'
            })

        }

        // SUBIR IMÁGENES A CLOUDINARY
        const result = await Promise.all(

            files.map(async (file) => {

                const arrayBuffer = await file.arrayBuffer()

                const buffer = Buffer.from(arrayBuffer)

                return new Promise((resolve, reject) => {

                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'auto'
                        },
                        (error, result) => {

                            if (error) {

                                reject(error)

                            } else {

                                resolve(result)

                            }

                        }
                    )

                    stream.end(buffer)

                })

            })

        )

        // URLS DE IMÁGENES
        const image = result.map(result => result.secure_url)

        // 🔥 SUBIR VIDEO
        let videoUrl = ""

        if (videoFile && videoFile.size > 0) {

            const arrayBuffer = await videoFile.arrayBuffer()

            const buffer = Buffer.from(arrayBuffer)

            const videoResult = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "products/videos"
                    },
                    (error, result) => {

                        if (error) {

                            reject(error)

                        } else {

                            resolve(result)

                        }

                    }
                )

                stream.end(buffer)

            })

            videoUrl = videoResult.secure_url

        }

        // CONECTAR MONGODB
        await connectDB()

        // CREAR PRODUCTO
        const newProduct = await Product.create({

            userId,

            name,

            description,

            category,

            price: Number(price),

            offerPrice: Number(offerPrice),

            // 🔥 GUARDAR STOCK
            stock: Number(stock),

            image,

            // 🔥 VIDEO
            video: videoUrl,

            date: Date.now()

        })

        // RESPUESTA
        return NextResponse.json({
            success: true,
            message: 'Producto Agregado',
            newProduct
        })

    } catch (error) {

        return NextResponse.json({
            success: false,
            message: error.message
        })

    }

}