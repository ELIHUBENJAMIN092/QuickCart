const STOPWORDS = new Set([
  "a", "al", "algo", "algun", "alguna", "algunas", "alguno", "algunos", "ante", "antes", "como",
  "con", "contra", "cual", "cuales", "cuando", "de", "del", "desde", "donde", "dos", "el", "ella",
  "ellas", "ellos", "en", "entre", "era", "es", "esa", "ese", "eso", "esta", "este", "esto", "fue",
  "ha", "hasta", "hay", "la", "las", "le", "les", "lo", "los", "mas", "me", "mi", "mis", "mucho",
  "muy", "necesito", "no", "nos", "o", "para", "pero", "por", "que", "quiero", "se", "sin", "sobre",
  "su", "sus", "te", "tiene", "tienen", "tu", "tus", "un", "una", "uno", "unos", "y", "ya", "yo",
  "busco", "buscar", "precio", "precios", "cuanto", "cuesta", "recomienda", "recomiendas", "hola",
  "buenas", "buenos", "dias", "tardes", "noches", "gracias", "favor", "ayuda", "ayudame", "tienda",
  "negocio", "empresa", "comprar", "compra",
]);

const TOKEN_SYNONYMS = {
  scanner: ["lector"],
  escaner: ["lector"],
  pistola: ["lector"],
  colector: ["computador", "movil"],
  handheld: ["computador", "movil"],
  credencial: ["tarjeta", "pvc"],
  carnet: ["tarjeta", "pvc"],
  gafete: ["tarjeta", "pvc"],
  etiquetera: ["impresora", "etiquetas"],
};

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function stem(token) {
  if (token.length <= 4) return token;
  return token.replace(/(es|s)$/, "");
}

function matchesToken(text, token) {
  return [token, ...(TOKEN_SYNONYMS[token] || [])].some((variant) =>
    text.includes(stem(variant))
  );
}

function tokenSet(value) {
  return new Set(tokenize(value).map(stem));
}

/**
 * Detecta la categoría (y subcategoría) mencionada en el texto.
 * categories: [{ name, slug, subcategories: [{ name, slug }] }]
 */
export function detectCategory(query, categories = []) {
  const queryTokens = tokenSet(query);
  if (!queryTokens.size) return null;

  let best = null;
  for (const category of categories) {
    const candidates = [
      { name: category.name, slug: category.slug, subcategorySlug: "", subcategoryName: "" },
      ...(category.subcategories || []).map((subcategory) => ({
        name: subcategory.name,
        slug: category.slug,
        subcategorySlug: subcategory.slug,
        subcategoryName: subcategory.name,
      })),
    ];

    for (const candidate of candidates) {
      const candidateTokens = tokenSet(candidate.name);
      if (!candidateTokens.size) continue;
      const queryMatches = [...queryTokens].every((token) => candidateTokens.has(token));
      const candidateMatches = [...candidateTokens].every((token) => queryTokens.has(token));
      if (!queryMatches && !candidateMatches) continue;
      const weight = candidateTokens.size;
      if (!best || weight > best.weight) {
        best = { ...candidate, weight };
      }
    }
  }

  if (!best) return null;
  return {
    slug: best.slug,
    name: best.name,
    subcategorySlug: best.subcategorySlug,
    subcategoryName: best.subcategoryName,
  };
}

function buildSearchText(product) {
  return normalizeText([
    product.name,
    product.description,
    product.categoryName,
    product.subcategoryName,
    product.printerType,
    product.isOffer ? "oferta" : "",
    product.isNew ? "nuevo" : "",
  ].join(" "));
}

function featuredScore(product) {
  return (product.isOffer ? 2 : 0) + (product.isNew ? 1 : 0) + (Number(product.stock) > 0 ? 1 : 0);
}

/**
 * Búsqueda local sobre el catálogo compacto.
 * No depende de red ni de Next.js para poder probarse de forma aislada.
 */
export function searchProducts(query, products = [], options = {}) {
  const {
    limit = 6,
    category = "",
    maxPrice = null,
    inStock = false,
    detectedCategory = null,
  } = options;

  const categoryFilter = category || detectedCategory?.slug || "";
  const tokens = tokenize(query);
  const normalizedQuery = normalizeText(query);

  let pool = products.filter((product) => !categoryFilter || product.category === categoryFilter);
  if (inStock) pool = pool.filter((product) => Number(product.stock) > 0);
  if (Number.isFinite(Number(maxPrice)) && Number(maxPrice) > 0) {
    pool = pool.filter((product) => product.price == null || Number(product.price) <= Number(maxPrice));
  }

  if (!tokens.length) {
    return [...pool].sort((a, b) => featuredScore(b) - featuredScore(a)).slice(0, limit);
  }

  const scored = pool
    .map((product) => {
      const searchText = product.searchText || buildSearchText(product);
      const nameText = normalizeText(product.name);
      const categoryText = normalizeText(product.categoryName);
      const subcategoryText = normalizeText(product.subcategoryName);
      let score = 0;

      if (normalizedQuery.length > 2 && searchText.includes(normalizedQuery)) score += 18;

      for (const token of tokens) {
        if (matchesToken(nameText, token)) score += 6;
        else if (matchesToken(categoryText, token)) score += 3;
        else if (matchesToken(subcategoryText, token)) score += 2;
        else if (matchesToken(searchText, token)) score += 1;
      }

      if (score > 0) {
        if (categoryFilter && product.category === categoryFilter) score += 4;
        if (detectedCategory?.subcategorySlug && product.subcategory === detectedCategory.subcategorySlug) {
          score += 6;
        }
        if (product.isOffer) score += 1;
        if (product.isNew) score += 1;
        if (Number(product.stock) > 0) score += 1;
      }

      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return featuredScore(b.product) - featuredScore(a.product);
    });

  return scored.slice(0, limit).map(({ product }) => product);
}

export function dedupeProducts(products = [], limit = 4) {
  const seen = new Set();
  const result = [];
  for (const product of products) {
    if (!product?.id || seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
    if (result.length >= limit) break;
  }
  return result;
}

const GENERIC_PRODUCT_WORDS = new Set([
  "impresora", "impresoras", "etiqueta", "etiquetas", "zebra", "adhesiva", "adhesivo", "termica",
  "termico", "rollo", "rollos", "cartucho", "cartuchos", "suministro", "suministros", "lector",
  "lectores", "tarjeta", "tarjetas", "kiosco", "kioscos", "punto", "venta", "adulto", "blanco",
  "negra", "negro", "amarilla", "amarillo", "modelo", "unidad", "unidades", "para", "con", "del",
]);

/**
 * Encuentra los productos que el modelo mencionó en su respuesta.
 * Se apoya en el nombre completo y en tokens distintivos (modelos/SKU con números).
 */
export function findMentionedProducts(text, products = [], limit = 4) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return [];
  const compactText = normalizedText.replace(/\s+/g, "");

  const matches = [];
  for (const product of products) {
    const normalizedName = normalizeText(product.name);
    if (!normalizedName) continue;

    const compactName = normalizedName.replace(/\s+/g, "");
    if (normalizedText.includes(normalizedName) || compactText.includes(compactName)) {
      const index = normalizedText.indexOf(normalizedName);
      matches.push({
        product,
        index: index === -1 ? 0 : index,
        weight: normalizedName.length,
      });
      continue;
    }

    const distinctive = tokenize(product.name).filter(
      (token) => token.length >= 3 && !GENERIC_PRODUCT_WORDS.has(token)
    );
    const found = distinctive.filter(
      (token) => normalizedText.includes(token) || compactText.includes(token)
    );
    const hasSku = found.some((token) => /\d/.test(token));

    if (hasSku || found.length >= 2) {
      matches.push({
        product,
        index: Math.min(...found.map((token) => normalizedText.indexOf(token))),
        weight: found.length,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index || b.weight - a.weight);
  return dedupeProducts(matches.map((match) => match.product), limit);
}

export function getQuickReplies({ products = [], canViewCommerce = true } = {}) {
  if (products.length) {
    return [
      canViewCommerce ? "¿Cuál me recomiendas?" : "¿Cómo veo los precios?",
      "¿Tienen stock?",
      "Solicitar asesoría",
    ];
  }
  return ["Ver categorías", "Solicitar asesoría", "Hablar con un asesor"];
}
