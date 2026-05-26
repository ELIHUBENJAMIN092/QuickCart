'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'

const EditProduct = () => {

  const { id } = useParams()

  const { getToken, router } = useAppContext()

  // Categorías disponibles
  const categories = [
    'Código de Barras',
    'Identificación PVC',
    'RFID',
    'Lectores',
    'Suministros',
    'Etiquetas',
    'Etiquetas RFID Tags',
    'Brazaletes',
    'PDA'
  ]

  // Estado del producto
  const [product, setProduct] = useState({
    name: '',
    category: '',
    offerPrice: '',
    stock: '',
  })

  // Obtener producto
  const fetchProduct = async () => {

    try {

      const token = await getToken()

      const { data } = await axios.get(
        `/api/product/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        setProduct({
          name: data.product.name || '',
          category: data.product.category || '',
          offerPrice: data.product.offerPrice || '',
          stock: data.product.stock || '',
        })

      }

    } catch (error) {

      toast.error(error.message)

    }

  }

  // Guardar cambios
  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      const token = await getToken()

      const { data } = await axios.put(
        `/api/product/update/${id}`,
        {
          name: product.name,
          category: product.category,
          offerPrice: Number(product.offerPrice),
          stock: Number(product.stock),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        toast.success('Producto actualizado')

        router.push('/seller/product-list')

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        error.message
      )

    }

  }

  useEffect(() => {

    fetchProduct()

  }, [])

  return (

    <div className="p-4 md:p-10">

      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Editar Producto
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white border rounded-2xl shadow-sm p-6 flex flex-col gap-5"
      >

        {/* Nombre */}
        <div className="flex flex-col gap-2">

          <label className="font-medium text-gray-700">
            Nombre
          </label>

          <input
            type="text"
            value={product.name}
            onChange={(e) =>
              setProduct({
                ...product,
                name: e.target.value
              })
            }
            className="border rounded-lg p-3 outline-none focus:border-blue-500"
          />

        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-2">

          <label className="font-medium text-gray-700">
            Categoría
          </label>

          <select
            value={product.category}
            onChange={(e) =>
              setProduct({
                ...product,
                category: e.target.value
              })
            }
            className="border rounded-lg p-3 outline-none focus:border-blue-500"
          >

            <option value="">
              Seleccionar categoría
            </option>

            {categories.map((category, index) => (

              <option
                key={index}
                value={category}
              >
                {category}
              </option>

            ))}

          </select>

        </div>

        {/* Precio */}
        <div className="flex flex-col gap-2">

          <label className="font-medium text-gray-700">
            Precio
          </label>

          <input
            type="number"
            value={product.offerPrice}
            onChange={(e) =>
              setProduct({
                ...product,
                offerPrice: e.target.value
              })
            }
            className="border rounded-lg p-3 outline-none focus:border-blue-500"
          />

        </div>

        {/* Stock */}
        <div className="flex flex-col gap-2">

          <label className="font-medium text-gray-700">
            Stock
          </label>

          <input
            type="number"
            value={product.stock}
            onChange={(e) =>
              setProduct({
                ...product,
                stock: e.target.value
              })
            }
            className="border rounded-lg p-3 outline-none focus:border-blue-500"
          />

        </div>

        {/* Botón */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-medium"
        >
          Guardar Cambios
        </button>

      </form>

    </div>

  )

}

export default EditProduct