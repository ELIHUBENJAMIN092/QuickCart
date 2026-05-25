'use client'
import React, { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2
} from "lucide-react";

import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const ProductList = () => {

  const { router, getToken, user } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // OBTENER PRODUCTOS
  const fetchSellerProduct = async () => {

    try {

      const token = await getToken();

      const { data } = await axios.get(
        '/api/product/seller-list',
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );

      if (data.success) {

        setProducts(data.products);
        setLoading(false);

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(error.message);

    }
  };

  // ELIMINAR PRODUCTO
  const handleDelete = async (productId) => {

    try {

      const confirmDelete = confirm(
        "¿Estás seguro de eliminar este producto?"
      );

      if (!confirmDelete) return;

      const token = await getToken();

      const { data } = await axios.delete(
        `/api/product/delete/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );

      if (data.success) {

        toast.success("Producto eliminado");

        setProducts(
          products.filter((p) => p._id !== productId)
        );

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error("Error al eliminar producto");

    }
  };

  useEffect(() => {

    if (user) {
      fetchSellerProduct();
    }

  }, [user]);

  return (

    <div className="flex-1 min-h-screen flex flex-col justify-between">

      {loading ? (

        <Loading />

      ) : (

        <div className="w-full md:p-8 p-3">

          <h2 className="pb-4 text-xl font-semibold text-gray-800">
            Todos los Productos
          </h2>

          <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden">

            {/* ========================= */}
            {/* TABLA DESKTOP */}
            {/* ========================= */}

            <div className="hidden md:block overflow-x-auto">

              <table className="w-full min-w-[900px]">

                {/* HEADER */}
                <thead className="bg-gray-50 text-gray-700 text-sm">

                  <tr>

                    <th className="text-left px-4 py-4 font-semibold">
                      Producto
                    </th>

                    <th className="text-left px-4 py-4 font-semibold">
                      Categoría
                    </th>

                    <th className="text-left px-4 py-4 font-semibold">
                      Precio
                    </th>

                    <th className="text-left px-4 py-4 font-semibold">
                      Stock
                    </th>

                    <th className="text-center px-4 py-4 font-semibold w-[160px]">
                      Acciones
                    </th>

                  </tr>

                </thead>

                {/* BODY */}
                <tbody>

                  {products.map((product, index) => (

                    <tr
                      key={index}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >

                      {/* PRODUCTO */}
                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <div className="bg-gray-100 rounded-lg p-2 min-w-[70px]">

                            <Image
                              src={product.image[0]}
                              alt="Producto"
                              className="w-14 h-14 object-cover rounded"
                              width={100}
                              height={100}
                            />

                          </div>

                          <div className="max-w-[260px]">

                            <p className="font-medium text-gray-800 truncate">
                              {product.name}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CATEGORÍA */}
                      <td className="px-4 py-4 text-gray-600">
                        {product.category}
                      </td>

                      {/* PRECIO */}
                      <td className="px-4 py-4 font-medium text-gray-800">
                        ${product.offerPrice}
                      </td>

                      {/* STOCK */}
                      <td className="px-4 py-4">

                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${product.stock > 10
                            ? 'bg-green-100 text-green-700'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }
                        `}>
                          {product.stock || 0}
                        </span>

                      </td>

                      {/* ACCIONES */}
                      <td className="px-4 py-4">

                        <div className="flex items-center justify-center gap-2">

                          {/* VER */}
                          <button
                            onClick={() =>
                              router.push(`/product/${product._id}`)
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDITAR */}
                          <button
                            onClick={() =>
                              router.push(`/seller/edit-product/${product._id}`)
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
                          >
                            <Pencil size={18} />
                          </button>

                          {/* ELIMINAR */}
                          <button
                            onClick={() =>
                              handleDelete(product._id)
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* ========================= */}
            {/* CARDS MOBILE */}
            {/* ========================= */}

            <div className="md:hidden">

              {products.map((product, index) => (

                <div
                  key={index}
                  className="border-b border-gray-100 p-4"
                >

                  <div className="flex gap-3">

                    {/* IMAGEN */}
                    <div className="bg-gray-100 rounded-xl p-2 min-w-[72px] h-[72px] flex items-center justify-center">

                      <Image
                        src={product.image[0]}
                        alt="Producto"
                        className="w-14 h-14 object-cover rounded"
                        width={100}
                        height={100}
                      />

                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">

                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {product.category}
                      </p>

                      <div className="flex items-center justify-between mt-3">

                        <p className="font-bold text-gray-800">
                          ${product.offerPrice}
                        </p>

                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${product.stock > 10
                            ? 'bg-green-100 text-green-700'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }
                        `}>
                          Stock: {product.stock || 0}
                        </span>

                      </div>

                      {/* ACCIONES */}
                      <div className="flex items-center gap-2 mt-4">

                        {/* VER */}
                        <button
                          onClick={() =>
                            router.push(`/product/${product._id}`)
                          }
                          className="flex-1 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white"
                        >
                          <Eye size={18} />
                        </button>

                        {/* EDITAR */}
                        <button
                          onClick={() =>
                            router.push(`/seller/edit-product/${product._id}`)
                          }
                          className="flex-1 h-10 flex items-center justify-center rounded-lg bg-yellow-500 text-white"
                        >
                          <Pencil size={18} />
                        </button>

                        {/* ELIMINAR */}
                        <button
                          onClick={() =>
                            handleDelete(product._id)
                          }
                          className="flex-1 h-10 flex items-center justify-center rounded-lg bg-red-600 text-white"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

      <Footer />

    </div>
  );
};

export default ProductList;