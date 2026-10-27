'use client'
import { assets } from "@/assets/assets";
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
            <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between">
                <form onSubmit={onSubmitHandler} className="w-full">
                    <p className="font-display text-3xl text-brand-ink md:text-4xl">
                        Dirección de envío
                    </p>

                    <div className="space-y-3 max-w-sm mt-10">
                        <input
                            className="w-full border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent"
                            type="text"
                            placeholder="Nombre"
                            value={address.fullName}
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        />

                        <input
                            className="w-full border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent"
                            type="text"
                            placeholder="Celular"
                            value={address.phoneNumber}
                            onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                        />

                        <textarea
                            className="w-full resize-none border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent"
                            rows={4}
                            placeholder="Dirección (Sector)"
                            value={address.area}
                            onChange={(e) => setAddress({ ...address, area: e.target.value })}
                        />

                        <div className="flex space-x-3">
                            <input
                                className="w-full border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent"
                                type="text"
                                placeholder="Ciudad"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            />

                            <input
                                className="w-full border-b border-brand-line bg-transparent px-2 py-3 text-sm text-brand-charcoal outline-none focus:border-brand-accent"
                                type="text"
                                placeholder="Provincia"
                                value={address.state}
                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 w-full max-w-sm bg-brand-accent py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink"
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
        </>
    );
};

export default AddAddress;
