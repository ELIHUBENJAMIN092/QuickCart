import {
  KIOSK_LIMITS,
  isValidKioskLink,
  normalizeKioskFeatures,
  normalizeKioskHighlights,
} from "@/lib/kiosk";

export function validateKioskBody(body) {
  const values = {};

  for (const [field, max] of Object.entries(KIOSK_LIMITS)) {
    const value = String(body[field] ?? "").trim();
    if (value.length > max) {
      return { error: `Revisa el campo ${field} (máximo ${max} caracteres).` };
    }
    if (field.endsWith("_url") && !isValidKioskLink(value)) {
      return { error: `El enlace ${field} no es válido.` };
    }
    values[field] = value;
  }

  values.highlights = normalizeKioskHighlights(body.highlights);
  values.features = normalizeKioskFeatures(body.features);

  return { values };
}
