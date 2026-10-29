import { createSupabasePublicClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";
import { categories, getCategoryName, getSubcategoryName } from "@/lib/categories";
import { loadCategoryRows } from "@/lib/categoryServer";
import { normalizeText } from "./search";
import { toPromptProduct, toPublicProduct } from "./productVisibility";

export { toPromptProduct, toPublicProduct };

const CACHE_TTL_MS = 60_000;

let cache = { at: 0, products: null, promise: null };
let categoryCache = { at: 0, data: null };

function cleanDescription(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function toCompactProduct(product) {
  const price = Number(product.price);
  const offerPrice = Number(product.offerPrice);
  const hasOffer = Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < price;
  const currentPrice = hasOffer ? offerPrice : price;
  const stock = Number(product.stock || 0);
  const categoryName = getCategoryName(product.category) || product.category || "";
  const subcategoryName = product.subcategory
    ? getSubcategoryName(product.category, product.subcategory) || ""
    : "";

  return {
    id: String(product._id),
    name: String(product.name || ""),
    category: product.category || "",
    categoryName,
    subcategory: product.subcategory || "",
    subcategoryName,
    description: cleanDescription(product.description),
    image: product.image?.[0] || "",
    printerType: product.printer_type || "",
    isOffer: product.is_offer === true,
    isNew: product.is_new === true,
    price: Number.isFinite(currentPrice) ? currentPrice : null,
    regularPrice: hasOffer ? price : null,
    stock,
    inStock: stock > 0,
    searchText: normalizeText([
      product.name,
      product.description,
      categoryName,
      subcategoryName,
      product.printer_type,
      product.is_offer ? "oferta" : "",
      product.is_new ? "nuevo" : "",
    ].join(" ")),
  };
}

/**
 * Catálogo público de la tienda, compacto y cacheado 60 s.
 * Se usa como contexto del asistente; nunca expone datos internos.
 */
export async function getCatalog() {
  const now = Date.now();
  if (cache.products && now - cache.at < CACHE_TTL_MS) return cache.products;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("storefront_products");
    if (error) throw error;

    const products = (data || [])
      .map(mapProduct)
      .filter(Boolean)
      .map(toCompactProduct)
      .filter((product) => product.id && product.name);

    cache = { at: Date.now(), products, promise: null };
    return products;
  })();

  try {
    return await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}

export function getCatalogCategories() {
  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    subcategories: (category.subcategories || []).map((subcategory) => ({
      name: subcategory.name,
      slug: subcategory.slug,
    })),
  }));
}

function compactCategories(rows) {
  return rows.map((category) => ({
    name: category.name,
    slug: category.slug,
    subcategories: (category.subcategories || []).map((subcategory) => ({
      name: subcategory.name,
      slug: subcategory.slug,
    })),
  }));
}

/**
 * Categorías actuales de la tienda (con fallback a las categorías por defecto).
 * Se cachean 60 s para no consultar la base en cada mensaje.
 */
export async function loadCatalogCategories() {
  const now = Date.now();
  if (categoryCache.data && now - categoryCache.at < CACHE_TTL_MS) return categoryCache.data;

  try {
    const rows = await loadCategoryRows(createSupabasePublicClient());
    const data = compactCategories(rows);
    if (data.length) {
      categoryCache = { at: now, data };
      return data;
    }
  } catch (error) {
    console.error("No se pudieron cargar las categorías para el chat:", error.message);
  }

  return getCatalogCategories();
}
