import { applyCategories, defaultCategories, slugify } from "@/lib/categories";

const toRow = (category, index) => ({
  slug: category.slug,
  name: category.name,
  description: category.description,
  image_url: "",
  subcategories: category.subcategories.map(({ name, slug, parent }) => ({ name, slug, ...(parent ? { parent } : {}) })),
  position: index + 1,
});

export const defaultCategoryRows = () => defaultCategories.map(toRow);

export async function loadCategoryRows(supabase) {
  const { data, error } = await supabase.from("categories").select("*").order("position").order("created_at");
  if (error || !data?.length) return defaultCategoryRows();
  return data;
}

// Sincroniza la lista en memoria del servidor con la base de datos antes de validar categorías.
export async function syncCategories(supabase) {
  applyCategories(await loadCategoryRows(supabase));
}

export function validateCategoryBody(body) {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const position = Number.isInteger(Number(body.position)) ? Number(body.position) : 0;
  if (!name || name.length > 60) return { error: "El título es obligatorio (máximo 60 caracteres)." };
  if (description.length > 200) return { error: "La descripción admite máximo 200 caracteres." };

  const input = Array.isArray(body.subcategories) ? body.subcategories : [];
  if (input.length > 40) return { error: "Máximo 40 subcategorías." };
  const slugs = new Set();
  const subcategories = [];
  for (const item of input) {
    const subName = String(item?.name || "").trim();
    const slug = slugify(item?.slug || subName);
    if (!subName || subName.length > 60 || !slug || slugs.has(slug)) {
      return { error: "Revisa los nombres de las subcategorías (no repetidos, máximo 60 caracteres)." };
    }
    slugs.add(slug);
    const parent = item.parent ? slugify(item.parent) : "";
    subcategories.push({ name: subName, slug, ...(parent ? { parent } : {}) });
  }
  if (subcategories.some((item) => item.parent && !subcategories.some((other) => other.slug === item.parent && !other.parent))) {
    return { error: "Una subcategoría hija debe estar debajo de otra principal." };
  }
  return { values: { name, description, position, subcategories } };
}
