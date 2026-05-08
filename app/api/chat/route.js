import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {

    try {

        const body = await req.json();

        const messages = body.messages;

        const lastUserMessage =
            messages[messages.length - 1]?.content || "";

        const prompt = `
        Eres el asistente virtual de COMPEL.

        Tu trabajo es:
        - ayudar clientes
        - recomendar productos tecnológicos
        - responder profesionalmente
        - vender productos Zebra
        - responder en español
        - ser breve y amigable

        Cliente:
        ${lastUserMessage}
        `;

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: prompt,

        });

        return Response.json({
            message: response.text,
        });

    } catch (error) {

        console.log(error);

        return Response.json({
            message:
                "El asistente está temporalmente fuera de servicio.",
        });

    }

}