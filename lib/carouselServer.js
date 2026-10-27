import { categories as defaultCategories } from "@/lib/categories";

export const CAROUSEL_LIMITS = {
  eyebrow: 80,
  title: 140,
  description: 300,
  primary_label: 40,
  secondary_label: 40,
};

export function validateSlideBody(body, validCategories = defaultCategories) {
  const category = String(body.category ?? "").trim();
  if (!validCategories.some((item) => item.slug === category)) {
    return { error: "Selecciona una categoría válida." };
  }

  const values = { category };
  for (const [field, max] of Object.entries(CAROUSEL_LIMITS)) {
    const value = String(body[field] ?? "").trim();
    if (!value || value.length > max) {
      return { error: `Revisa el campo ${field} (máximo ${max} caracteres).` };
    }
    values[field] = value;
  }

  return { values };
}
