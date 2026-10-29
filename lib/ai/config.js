import { GoogleGenAI } from "@google/genai";

let client = null;

export { CHAT_LIMITS, RATE_LIMITS } from "./limits";

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

// Si el modelo principal agota su cuota, se prueban los de respaldo (separados por comas).
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-2.5-flash-lite")
  .split(",")
  .map((model) => model.trim())
  .filter((model) => model && model !== CHAT_MODEL);

export const CHAT_MODELS = [CHAT_MODEL, ...FALLBACK_MODELS];

export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
