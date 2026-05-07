"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function ChatWidget() {

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");

    return (
        <>
            {/* ================= BOTÓN CHAT ================= */}
            <button
                onClick={() => setOpen(!open)}
                className="
                    fixed
                    bottom-6
                    right-24
                    z-50
                    w-14
                    h-14
                    rounded-full
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    shadow-xl
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-300
                    hover:scale-105
                "
            >
                {open ? (
                    <X size={24} />
                ) : (
                    <MessageCircle size={24} />
                )}
            </button>

            {/* ================= VENTANA CHAT ================= */}
            {open && (
                <div
                    className="
                        fixed
                        bottom-24
                        right-6
                        z-50
                        w-[320px]
                        sm:w-[340px]
                        h-[500px]
                        bg-white
                        rounded-[28px]
                        shadow-[0_10px_40px_rgba(0,0,0,0.18)]
                        border border-gray-200
                        flex
                        flex-col
                        overflow-hidden
                        animate-in
                        fade-in
                        slide-in-from-bottom-3
                        duration-300
                    "
                >

                    {/* ================= HEADER ================= */}
                    <div className="
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                        px-5
                        py-4
                    ">

                        <h2 className="font-semibold text-lg leading-none">
                            Asistente COMPEL
                        </h2>

                        <p className="text-sm text-white/80 mt-1">
                            ¿En qué puedo ayudarte?
                        </p>

                    </div>

                    {/* ================= MENSAJES ================= */}
                    <div className="
                        flex-1
                        overflow-y-auto
                        px-4
                        py-5
                        bg-[#f7f8fc]
                    ">

                        {/* MENSAJE BOT */}
                        <div className="flex">

                            <div className="
                                bg-white
                                px-4
                                py-3
                                rounded-2xl
                                rounded-tl-sm
                                shadow-sm
                                text-[15px]
                                text-gray-700
                                leading-relaxed
                                max-w-[85%]
                                border border-gray-100
                            ">
                                Hola 👋 <br />
                                Puedo ayudarte a encontrar productos.
                            </div>

                        </div>

                    </div>

                    {/* ================= INPUT ================= */}
                    <div className="
                        p-4
                        bg-white
                        border-t
                        border-gray-100
                    ">

                        <div className="flex items-center gap-2">

                            {/* INPUT */}
                            <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="
                                    flex-1
                                    h-12
                                    px-4
                                    rounded-full
                                    border
                                    border-gray-200
                                    outline-none
                                    text-sm
                                    focus:border-blue-500
                                    transition
                                "
                            />

                            {/* BOTÓN ENVIAR */}
                            <button
                                className="
                                    w-12
                                    h-12
                                    rounded-full
                                    bg-blue-600
                                    hover:bg-blue-700
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    shadow-md
                                    transition-all
                                    duration-200
                                    hover:scale-105
                                "
                            >
                                <Send size={19} />
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </>
    );
}