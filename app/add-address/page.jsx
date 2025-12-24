'use client'
import { assets } from "@/assets/assets";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const AddAddress = () => {

    const { getToken, router } = useAppContext()

    const [address, setAddress] = useState({
        fullName: '',
        phoneNumber: '',
        area: '',
        city: '',
        state: '',
    })

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();

            const { data } = await axios.post(
                '/api/user/add-address',
                { address },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message);
                router.push('/cart');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between">
                <form onSubmit={onSubmitHandler} className="w-full">
                    <p className="text-2xl md:text-3xl text-gray-700">
                        Dirección de <span className="font-semibold text-blue-900">Envío</span>
                    </p>

                    <div className="space-y-3 max-w-sm mt-10">
                        <input
                            className="px-2 py-2.5 border border-gray-500/30 rounded w-full text-gray-500 outline-none focus:border-blue-500"
                            type="text"
                            placeholder="Nombre"
                            value={address.fullName}
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        />

                        <input
                            className="px-2 py-2.5 border border-gray-500/30 rounded w-full text-gray-500 outline-none focus:border-blue-500"
                            type="text"
                            placeholder="Celular"
                            value={address.phoneNumber}
                            onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                        />

                        <textarea
                            className="px-2 py-2.5 border border-gray-500/30 rounded w-full text-gray-500 resize-none outline-none focus:border-blue-500"
                            rows={4}
                            placeholder="Dirección (Sector)"
                            value={address.area}
                            onChange={(e) => setAddress({ ...address, area: e.target.value })}
                        />

                        <div className="flex space-x-3">
                            <input
                                className="px-2 py-2.5 border border-gray-500/30 rounded w-full text-gray-500 outline-none focus:border-blue-500"
                                type="text"
                                placeholder="Provincia"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            />

                            <input
                                className="px-2 py-2.5 border border-gray-500/30 rounded w-full text-gray-500 outline-none focus:border-blue-500"
                                type="text"
                                placeholder="Ciudad"
                                value={address.state}
                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="max-w-sm w-full mt-6 bg-blue-700 text-white py-3 hover:bg-blue-800 uppercase"
                    >
                        Guardar Dirección
                    </button>
                </form>

                <Image
                    className="md:mr-16 mt-16 md:mt-0 w-full h-auto"
                    src={assets.my_location_image}
                    alt="my_location_image"
                />
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;
