'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const AddProduct = () => {

  const { getToken } = useAppContext()

  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null); // 🔥 NUEVO
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Código de Barras');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData()

    formData.append('name',name)
    formData.append('description',description)
    formData.append('category',category)
    formData.append('price',price)
    formData.append('offerPrice',offerPrice)

    for (let i = 0; i < files.length; i++) {
      formData.append('images',files[i])
    }

    // 🔥 VIDEO
    if (video) {
      formData.append('video', video)
    }

    try {

      const token = await getToken()

      const { data } = await axios.post('/api/product/add',formData,{
        headers:{Authorization:`Bearer ${token}`}
      })

      if (data.success) {
        toast.success(data.message)
        setFiles([]);
        setVideo(null); // 🔥 LIMPIAR VIDEO
        setName('');
        setDescription('');
        setCategory('Código de Barras');
        setPrice('');
        setOfferPrice('');
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message)
    }

  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        
        {/* IMÁGENES */}
        <div>
          <p className="text-base font-medium">Imagen del Producto</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }} type="file" id={`image${index}`} hidden />
                <Image
                  key={index}
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}

          </div>
        </div>

        {/* 🔥 VIDEO */}
        <div>
          <p className="text-base font-medium">Video del Producto</p>

          <label htmlFor="videoUpload">
            <input 
              type="file" 
              id="videoUpload" 
              accept="video/*" 
              hidden
              onChange={(e) => setVideo(e.target.files[0])}
            />

            <div className="mt-2 w-40 h-24 flex items-center justify-center border border-dashed border-gray-400 rounded cursor-pointer">
              {video ? (
                <video
                  src={URL.createObjectURL(video)}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="text-gray-400 text-sm">Subir video</span>
              )}
            </div>
          </label>
        </div>

        {/* NOMBRE */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Nombre del Producto
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Ingresar Texto"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div className="flex flex-col gap-1 max-w-md">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Descripción del Producto
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Ingresar Texto"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>

        {/* CATEGORÍA Y PRECIOS */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Categoría
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              defaultValue={category}
            >
              <option value="Código de Barras">Código de Barras</option>
              <option value="Identificación PVC">Identificación PVC</option>
              <option value="RFID">RFID</option>
              <option value="Lectores">Lectores</option>
              <option value="Suministros">Suministros</option>
              <option value="Etiquetas">Etiquetas</option>
              <option value="Cordones">Cordones</option>
              <option value="Etiquetas RFID Tags">Etiquetas RFID Tags</option>
              <option value="Brazaletes">Brazaletes</option>
              <option value="PDA">PDA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Precio
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Precio Oferta
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
        </div>

        <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded">
          Añadir
        </button>
      </form>
    </div>
  );
};

export default AddProduct;