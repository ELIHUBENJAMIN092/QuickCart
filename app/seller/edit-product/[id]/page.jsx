'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'

const EditProduct = () => {

  const { id } = useParams()
  const { getToken, router } = useAppContext()

  const [product, setProduct] = useState({
    name: '',
    category: '',
    offerPrice: '',
    stock: '',
  })

  const fetchProduct = async () => {
    try {

      const token = await getToken()

      const { data } = await axios.get(`/api/product/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setProduct(data.product)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {

      const token = await getToken()

      const { data } = await axios.put(
        `/api/product/update/${id}`,
        product,
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
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [])

  return (
    <div className="p-10">

      <h1 className="text-2xl font-semibold mb-6">
        Editar Producto
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-xl"
      >

        <input
          type="text"
          placeholder="Nombre"
          value={product.name}
          onChange={(e) =>
            setProduct({ ...product, name: e.target.value })
          }
          className="border p-3 rounded"
        />

        <input
          type="text"
          placeholder="Categoría"
          value={product.category}
          onChange={(e) =>
            setProduct({ ...product, category: e.target.value })
          }
          className="border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Precio"
          value={product.offerPrice}
          onChange={(e) =>
            setProduct({ ...product, offerPrice: e.target.value })
          }
          className="border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Stock"
          value={product.stock}
          onChange={(e) =>
            setProduct({ ...product, stock: e.target.value })
          }
          className="border p-3 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-3 rounded"
        >
          Guardar Cambios
        </button>

      </form>

    </div>
  )
}

export default EditProduct