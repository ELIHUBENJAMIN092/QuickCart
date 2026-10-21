import { assets } from "@/assets/assets";

export const categories = [
  {
    name: "Código de Barras",
    slug: "codigo-de-barras",
    image: assets.codigo_barras,
    description: "Impresión y lectura de códigos de barras para retail e industria.",
    subcategories: [
      { name: "Impresoras de etiquetas", slug: "impresoras-etiquetas", href: "/impresoras-etiquetas" },
      { name: "Impresoras de brazaletes", slug: "impresoras-brazaletes" },
      { name: "Impresoras de punto de venta", slug: "impresoras-punto-venta" },
      { name: "Lectores", slug: "lectores" },
      { name: "Suministros", slug: "suministros" },
      { name: "Etiquetas", slug: "suministros-etiquetas", parent: "suministros", label: "Suministros / Etiquetas" },
      { name: "Cintas y rollos textiles", slug: "suministros-cintas", parent: "suministros", label: "Suministros / Cintas y rollos textiles" },
      { name: "Etiquetas especiales", slug: "suministros-etiquetas-especiales", parent: "suministros", label: "Suministros / Etiquetas especiales" },
    ],
  },
  {
    name: "Cómputo Móvil",
    slug: "computo-movil",
    image: assets.rfid_mc3330r,
    description: "Equipos portátiles y tabletas profesionales para trabajo en campo.",
    subcategories: [
      { name: "Computadores de mano (PDA)", slug: "computadores-de-mano" },
      { name: "Tabletas", slug: "tabletas" },
      { name: "Lectores", slug: "lectores" },
    ],
  },
  {
    name: "RFID",
    slug: "rfid",
    image: assets.rfid_fx9600,
    description: "Identificación por radiofrecuencia: antenas, impresoras, tags y portales.",
    subcategories: [
      { name: "Antenas", slug: "antenas" },
      { name: "Impresoras RFID", slug: "impresoras" },
      { name: "Tags", slug: "tags" },
      { name: "Portales", slug: "portales" },
    ],
  },
  {
    name: "Identificación PVC",
    slug: "identificacion-pvc",
    image: assets.credencial,
    description: "Impresoras, suministros y tarjetas para credenciales y membresías.",
    subcategories: [
      { name: "Impresoras", slug: "impresoras" },
      { name: "Suministros", slug: "suministros" },
      { name: "Accesorios y cordones", slug: "accesorios" },
      { name: "Tarjetas con Chip", slug: "tarjetas-con-chip" },
    ],
  },
];

export const printerTypes = [
  { slug: "portatil", name: "Portátiles", description: "Impresión móvil para trabajo en campo, almacén y reparto." },
  { slug: "escritorio", name: "Escritorio", description: "Impresoras compactas para oficina, retail y laboratorio." },
  { slug: "industrial", name: "Industriales", description: "Alto volumen y operación continua en planta y logística." },
];

export const isLabelPrinterSubcategory = (category, subcategory) =>
  category === "codigo-de-barras" && subcategory === "impresoras-etiquetas";

export const isValidHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export const getCategoryBySlug = (slug) =>
  categories.find((category) => category.slug === slug);

const legacyCategories = {
  "código de barras": ["codigo-de-barras", ""],
  "codigo de barras": ["codigo-de-barras", ""],
  "computo móvil": ["computo-movil", ""],
  "cómputo móvil": ["computo-movil", ""],
  "identificación pvc": ["identificacion-pvc", ""],
  "identificacion pvc": ["identificacion-pvc", ""],
  lectores: ["codigo-de-barras", "lectores"],
  suministros: ["codigo-de-barras", "suministros"],
  etiquetas: ["codigo-de-barras", "suministros"],
  "cordones": ["identificacion-pvc", "accesorios"],
  "etiquetas rfid tags": ["rfid", "tags"],
  brazaletes: ["codigo-de-barras", "impresoras-brazaletes"],
  pda: ["computo-movil", "computadores-de-mano"],
};

export const normalizeProductCategory = (categoryValue, subcategoryValue = "") => {
  const categorySlug = String(categoryValue || "").toLowerCase();
  const legacy = legacyCategories[categorySlug];
  if (legacy) {
    return {
      category: legacy[0],
      subcategory: subcategoryValue || legacy[1],
    };
  }

  const category = categories.find(
    (item) =>
      item.slug === categorySlug ||
      item.name.toLowerCase() === categorySlug
  );
  if (category) {
    return { category: category.slug, subcategory: subcategoryValue };
  }

  const subcategory = categories.flatMap((item) =>
    item.subcategories.map((child) => ({ parent: item, child }))
  ).find(({ child }) =>
    child.slug === categorySlug ||
    child.name.toLowerCase() === categorySlug
  );

  return subcategory
    ? { category: subcategory.parent.slug, subcategory: subcategory.child.slug }
    : { category: categoryValue || "", subcategory: subcategoryValue };
};

export const getCategoryName = (value) => {
  const normalized = normalizeProductCategory(value).category;
  return categories.find((category) => category.slug === normalized)?.name || value;
};

export const getSubcategoryName = (categoryValue, subcategoryValue) => {
  const normalized = normalizeProductCategory(categoryValue, subcategoryValue);
  const category = getCategoryBySlug(normalized.category);
  return category?.subcategories.find(
    (subcategory) =>
      subcategory.slug === normalized.subcategory ||
      subcategory.name.toLowerCase() === String(normalized.subcategory || "").toLowerCase()
  )?.name || subcategoryValue;
};

export const matchesCategoryFilter = (product, filter) => {
  if (!filter) return true;
  const [categorySlug, subcategorySlug] = filter.split("/");
  const category = getCategoryBySlug(categorySlug);
  const normalized = normalizeProductCategory(product?.category, product?.subcategory);
  if (!category) {
    return normalized.category === filter || String(product?.category || "").toLowerCase() === filter.toLowerCase();
  }

  if (subcategorySlug) {
    const selected = category.subcategories.find((item) => item.slug === subcategorySlug);
    const accepted = [subcategorySlug, ...category.subcategories.filter((item) => item.parent === subcategorySlug).map((item) => item.slug)];
    return normalized.category === category.slug && (selected ? accepted.includes(normalized.subcategory) : normalized.subcategory === subcategorySlug);
  }
  return normalized.category === category.slug;
};
