"use client"
import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import React from "react";
import BrandCarousel from "@/components/BrandLogos";

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart, user } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [productData, setProductData] = useState(null);

    const fetchProductData = async () => {
        const product = products.find(product => product._id === id);
        setProductData(product);
    }

    useEffect(() => {
        fetchProductData();
    }, [id, products.length])

    return productData ? (<>

        <Navbar />

        <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                {/* ================= IMÁGENES + VIDEO ================= */}
                <div className="px-5 lg:px-16 xl:px-20">

                    {/* ================= VISOR PRINCIPAL ================= */}
                    <div className="rounded-xl overflow-hidden bg-gray-500/10 mb-4">

                        {isVideo && productData.video ? (

                            <video
                                src={productData.video}
                                className="w-full h-auto rounded-xl"
                                controls
                                playsInline
                                preload="metadata"
                            />

                        ) : (

                            <Image
                                src={mainImage || productData.image[0]}
                                alt="product"
                                className="w-full h-auto object-cover mix-blend-multiply"
                                width={1280}
                                height={720}
                            />

                        )}

                    </div>

                    {/* ================= MINIATURAS ================= */}
                    <div className="grid grid-cols-4 gap-4">

                        {/* ================= IMÁGENES ================= */}
                        {productData.image.slice(0, 3).map((image, index) => (

                            <div
                                key={index}
                                onClick={() => {
                                    setMainImage(image);
                                    setIsVideo(false);
                                }}
                                className={`
                                    cursor-pointer
                                    rounded-xl
                                    overflow-hidden
                                    bg-gray-500/10
                                    aspect-square
                                    border-2
                                    transition-all
                                    duration-200
                                    hover:border-blue-500
                                    ${mainImage === image && !isVideo
                                        ? "border-blue-600"
                                        : "border-transparent"}
                                `}
                            >

                                <Image
                                    src={image}
                                    alt="thumb"
                                    className="w-full h-full object-cover mix-blend-multiply"
                                    width={300}
                                    height={300}
                                />

                            </div>

                        ))}

                        {/* ================= VIDEO MINIATURA ================= */}
                        {productData.video && (

                            <div
                                onClick={() => {
                                    setIsVideo(true);
                                    setMainImage(null);
                                }}
                                className={`
                                    cursor-pointer
                                    rounded-xl
                                    overflow-hidden
                                    relative
                                    aspect-square
                                    border-2
                                    transition-all
                                    duration-200
                                    group
                                    bg-gray-500/10
                                    hover:border-blue-500
                                    ${isVideo
                                        ? "border-blue-600"
                                        : "border-transparent"}
                                `}
                            >

                                {/* PREVIEW DEL VIDEO */}
                                <video
                                    src={productData.video}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all"></div>

                                {/* BOTÓN PLAY RESPONSIVE */}
                                <div className="absolute inset-0 flex items-center justify-center">

                                    <div className="
                                        w-8 h-8
                                        sm:w-10 sm:h-10
                                        md:w-12 md:h-12
                                        rounded-full
                                        bg-black/65
                                        backdrop-blur-sm
                                        flex items-center justify-center
                                        shadow-xl
                                        transition-transform
                                        duration-200
                                        group-hover:scale-110
                                    ">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="white"
                                            className="
                                                w-3.5 h-3.5
                                                sm:w-4 sm:h-4
                                                md:w-5 md:h-5
                                                ml-0.5
                                            "
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>

                                    </div>

                                </div>

                            </div>

                        )}

                    </div>

                </div>

                {/* ================= INFO PRODUCTO ================= */}
                <div className="flex flex-col">

                    <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
                        {productData.name}
                    </h1>

                    <div className="flex items-center gap-2">

                        <div className="flex items-center gap-0.5">
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star" />
                            <Image className="h-4 w-4" src={assets.star_dull_icon} alt="star" />
                        </div>

                        <p>(4.5)</p>

                    </div>

                    <p className="text-gray-600 mt-3">
                        {productData.description}
                    </p>

                    <p className="text-3xl font-medium mt-6">
                        ${productData.offerPrice}

                        <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                            ${productData.price}
                        </span>
                    </p>

                    <hr className="bg-gray-600 my-6" />

                    <div className="overflow-x-auto">

                        <table className="table-auto border-collapse w-full max-w-72">

                            <tbody>

                                <tr>
                                    <td className="text-gray-600 font-medium">
                                        Marca
                                    </td>

                                    <td className="text-gray-800/50">
                                        Zebra
                                    </td>
                                </tr>

                                <tr>
                                    <td className="text-gray-600 font-medium">
                                        Color
                                    </td>

                                    <td className="text-gray-800/50">
                                        Blanco
                                    </td>
                                </tr>

                                <tr>
                                    <td className="text-gray-600 font-medium">
                                        Categoria
                                    </td>

                                    <td className="text-gray-800/50">
                                        {productData.category}
                                    </td>
                                </tr>

                            </tbody>

                        </table>

                    </div>

                    {/* ================= BOTONES ================= */}
                    <div className="flex items-center mt-10 gap-4">

                        <button
                            onClick={() => addToCart(productData._id)}
                            className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
                        >
                            Añadir al carrito
                        </button>

                        <button
                            onClick={() => {
                                addToCart(productData._id);
                                router.push(user ? '/cart' : '')
                            }}
                            className="w-full py-3.5 bg-blue-700 text-white hover:bg-blue-800 transition"
                        >
                            Comprar ahora
                        </button>

                    </div>

                </div>

            </div>

            {/* ================= DESTACADOS ================= */}
            <div className="flex flex-col items-center">

                <div className="flex flex-col items-center mb-4 mt-16">

                    <p className="text-3xl font-medium">
                        Productos <span className="text-blue-600">Destacados</span>
                    </p>

                    <div className="w-28 h-0.5 bg-blue-600 mt-2"></div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">

                    {products.slice(0, 5).map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))}

                </div>

                <button className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
                    Ver más
                </button>

            </div>

        </div>

        <BrandCarousel />
        <Footer />

    </>) : <Loading />
};

export default Product;