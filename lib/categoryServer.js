import { applyCategories, defaultCategories, slugify } from "@/lib/categories";

const toRow = (category, index) => ({
  slug: category.slug,
  name: category.name,
  description: category.description,
  image_url: "",
  hero: category.hero || {},
  subcategories: category.subcategories.map(({ name, slug, parent }) => ({ name, slug, ...(parent ? { parent } : {}) })),
  position: index + 1,
});

export const defaultCategoryRows = () => defaultCategories.map(toRow);

const requiredSlugs = ["codigo-de-barras", "computo-movil", "rfid", "identificacion-pvc", "kioscos-y-pos"];

export async function loadCategoryRows(supabase) {
  const defaults = defaultCategoryRows();
  const { data, error } = await supabase.from("categories").select("*").order("position").order("created_at");
  if (error || !data?.length) return defaults;

  const bySlug = new Map(data.map((row) => [row.slug, row]));
  const required = requiredSlugs
    .map((slug, index) => {
      const fallback = defaults.find((item) => item.slug === slug);
      const row = bySlug.get(slug);
      if (!fallback && !row) return null;
      return {
        ...(fallback || {}),
        ...(row || {}),
        hero: {
          ...(fallback?.hero || {}),
          ...(row?.hero && typeof row.hero === "object" ? row.hero : {}),
        },
        position: index + 1,
      };
    })
    .filter(Boolean);
  const extras = data.filter((row) => !requiredSlugs.includes(row.slug));
  return [...required, ...extras];
}

// Sincroniza la lista en memoria del servidor con la base de datos antes de validar categorías.
export async function syncCategories(supabase) {
  applyCategories(await loadCategoryRows(supabase));
}

const HERO_LIMITS = {
  eyebrow: 80,
  title: 140,
  description: 400,
  image_url: 500,
  video_url: 500,
  primary_label: 40,
  primary_url: 300,
  secondary_label: 40,
  secondary_url: 300,
};

const isValidLink = (value) => !value || /^(\/(?!\/)|https?:\/\/|#[\w-]+$)/.test(value);

export function validateCategoryHero(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const hero = {};
  for (const [field, max] of Object.entries(HERO_LIMITS)) {
    const value = String(source[field] ?? "").trim();
    if (value.length > max) return { error: `La portada admite máximo ${max} caracteres en ${field}.` };
    if (field.endsWith("_url") && !isValidLink(value)) return { error: `El enlace ${field} de la portada no es válido.` };
    hero[field] = value;
  }
  return { hero };
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

  const values = { name, description, position, subcategories };
  if (body.hero !== undefined) {
    const { hero, error } = validateCategoryHero(body.hero);
    if (error) return { error };
    values.hero = hero;
  }
  return { values };
}
