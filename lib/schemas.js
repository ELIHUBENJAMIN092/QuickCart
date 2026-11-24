import { z } from "zod";
import { POPUP_LIMITS } from "@/lib/popup";

/**
 * Esquemas compartidos de validación de entrada (P2.2).
 * Zod v4. Los esquemas son estrictos en longitud pero ignoran campos
 * desconocidos, para no romper clientes que envían datos extra.
 */

export const visitBodySchema = z.object({
  path: z.string().max(300).optional(),
  referrer: z.string().max(1000).optional(),
});

/**
 * Formato normalizado del popup, con el volumen en 0..1.
 * La UI actual (`app/seller/popup/page.jsx`) todavía envía 0..100 y guarda
 * ese valor en Supabase; la ruta PUT convierte a 0..1 antes de validar y
 * vuelve a 0..100 al persistir. Migrar la UI a 0..1 permitirá usar el
 * esquema completo directamente.
 */
export const popupBodySchema = z.object({
  enabled: z.boolean().optional(),
  audio_enabled: z.boolean().optional(),
  audio_volume: z.number().min(0).max(1).optional(),
  title: z.string().max(POPUP_LIMITS.title).optional(),
  message: z.string().max(POPUP_LIMITS.message).optional(),
  button_label: z.string().max(POPUP_LIMITS.button_label).optional(),
  button_url: z.string().max(POPUP_LIMITS.button_url).optional(),
});

// derivado del esquema principal para no duplicar la regla de volumen
export const popupAudioVolumeSchema = popupBodySchema.pick({ audio_volume: true });
