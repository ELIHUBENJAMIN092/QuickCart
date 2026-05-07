"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function ChatWidget() {

    const [open, setOpen] = useState(false);

    const [input, setInput] = useState("");

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hola 👋 Puedo ayudarte a encontrar productos."
        }
    ]);

    // ================= ENVIAR MENSAJE =================
    const sendMessage = () => {

        if (!input.trim()) return;

        // MENSAJE USUARIO
        const userMessage = {
            role: "user",
            content: input
        };

        // ACTUALIZA CHAT
        setMessages(prev => [...prev, userMessage]);

        // RESPUESTA AUTOMÁTICA TEMPORAL
        setTimeout(() => {

            const botMessage = {
                role: "assistant",
                content: getBotResponse(input)
            };

            setMessages(prev => [...prev, botMessage]);

        }, 700);

        setInput("");
    };

    // ================= RESPUESTAS TEMPORALES =================
    const getBotResponse = (text) => {

        const msg = text.toLowerCase();

        if (msg.includes("hola")) {
            return "Hola 👋 ¿Qué producto estás buscando?";
        }

        if (
            msg.includes("zebra") ||
            msg.includes("scanner") ||
            msg.includes("lector")
        ) {
            return "Tenemos lectores Zebra 1D y 2D disponibles. ¿Buscas uno para punto de venta o inventario?";
        }

        if (
            msg.includes("tablet") ||
            msg.includes("pda")
        ) {
            return "Tenemos tablets industriales Zebra con Android para inventario y logística.";
        }

        if (
            msg.includes("precio")
        ) {
            return "¿Qué producto deseas consultar?";
        }

        return "Puedo ayudarte a encontrar productos Zebra, impresoras, lectores y tablets industriales.";
    };

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

            {/* ================= CHAT ================= */}
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
                        flex flex-col
                        overflow-hidden
                    "
                >

                    {/* HEADER */}
                    <div className="
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                        px-5
                        py-4
                    ">

                        <h2 className="font-semibold text-lg">
                            Asistente COMPEL
                        </h2>

                        <p className="text-sm text-white/80">
                            ¿En qué puedo ayudarte?
                        </p>

                    </div>

                    {/* MENSAJES */}
                    <div className="
                        flex-1
                        overflow-y-auto
                        px-4
                        py-5
                        bg-[#f7f8fc]
                        space-y-4
                    ">

                        {messages.map((msg, index) => (

                            <div
                                key={index}
                                className={`flex ${msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                            >

                                <div
                                    className={`
                                        px-4
                                        py-3
                                        rounded-2xl
                                        text-sm
                                        leading-relaxed
                                        max-w-[85%]
                                        shadow-sm
                                        ${msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-sm"
                                            : "bg-white text-gray-700 rounded-tl-sm border border-gray-100"
                                        }
                                    `}
                                >
                                    {msg.content}
                                </div>

                            </div>

                        ))}

                    </div>

                    {/* INPUT */}
                    <div className="
                        p-4
                        bg-white
                        border-t
                        border-gray-100
                    ">

                        <div className="flex items-center gap-2">

                            <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        sendMessage();
                                    }
                                }}
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
                                "
                            />

                            <button
                                onClick={sendMessage}
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