import { assets } from "@/assets/assets";

export const defaultCategories = [
  {
    name: "Código de Barras",
    slug: "codigo-de-barras",
    image: assets.codigo_barras,
    description: "Impresión y lectura de códigos de barras para retail e industria.",
    hero: {
      eyebrow: "Código de barras",
      title: "Etiquetas, códigos y suministros para operar sin pausas.",
      description: "Impresión y lectura de códigos de barras para retail, logística e industria, con equipos y suministros para cada volumen de trabajo.",
      video_url: "/videos/codigo-de-barras.mp4",
      primary_label: "Solicitar asesoría",
      primary_url: "/Contactos",
      secondary_label: "Ver productos",
      secondary_url: "#productos",
    },
    subcategories: [
      { name: "Impresoras de etiquetas", slug: "impresoras-etiquetas", href: "/impresoras-etiquetas" },
      { name: "Impresoras de brazaletes", slug: "impresoras-brazaletes" },
      { name: "Impresoras de punto de venta", slug: "impresoras-punto-venta" },
      { name: "Lectores", slug: "lectores" },
      { name: "Suministros", slug: "suministros" },
      { name: "Etiquetas / Nylon", slug: "suministros-etiquetas", parent: "suministros", label: "Suministros / Etiquetas / Nylon" },
      { name: "Etiquetas Especiales", slug: "suministros-etiquetas-especiales", parent: "suministros", label: "Suministros / Etiquetas Especiales" },
      { name: "Cintas", slug: "suministros-cintas", parent: "suministros", label: "Suministros / Cintas" },
    ],
  },
  {
    name: "Cómputo Móvil",
    slug: "computo-movil",
    image: assets.rfid_mc3330r,
    description: "Equipos portátiles y tabletas profesionales para trabajo en campo.",
    hero: {
      eyebrow: "Cómputo móvil",
      title: "Movilidad profesional para trabajar sin detenerte.",
      description: "Equipos portátiles y tabletas profesionales para campo, almacén y punto de venta, listos para integrarse con tu operación.",
      video_url: "/videos/computo-movil.mp4",
      primary_label: "Solicitar asesoría",
      primary_url: "/Contactos",
      secondary_label: "Ver productos",
      secondary_url: "#productos",
    },
    subcategories: [
      { name: "Computadores de mano (PDA)", slug: "computadores-de-mano" },
      { name: "Tabletas", slug: "tabletas" },
    ],
  },
  {
    name: "RFID",
    slug: "rfid",
    image: assets.rfid_fx9600,
    description: "Identificación por radiofrecuencia: antenas, impresoras, tags y portales.",
    hero: {
      eyebrow: "RFID",
      title: "Visibilidad en tiempo real para tu operación.",
      description: "Antenas, impresoras, tags y portales RFID para controlar inventario, activos y trazabilidad con tecnología de radiofrecuencia.",
      video_url: "/videos/rfid.mp4",
      primary_label: "Solicitar asesoría",
      primary_url: "/Contactos",
      secondary_label: "Ver productos",
      secondary_url: "#productos",
    },
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
    hero: {
      eyebrow: "Identificación PVC",
      title: "Credenciales que proyectan una imagen profesional.",
      description: "Impresoras, suministros y tarjetas PVC para credenciales, membresías y control de acceso con acabados de alta calidad.",
      video_url: "/videos/identificacion-pvc.mp4",
      primary_label: "Solicitar asesoría",
      primary_url: "/Contactos",
      secondary_label: "Ver productos",
      secondary_url: "#productos",
    },
    subcategories: [
      { name: "Impresoras", slug: "impresoras" },
      { name: "Suministros", slug: "suministros" },
      { name: "Accesorios y cordones", slug: "accesorios" },
      { name: "Tarjetas con Chip", slug: "tarjetas-con-chip" },
    ],
  },
  {
    name: "Kioscos y POS",
    slug: "kioscos-y-pos",
    image: "/videos/kiosk-poster.jpg",
    description: "Estaciones de autoservicio y punto de venta para pedidos, pagos y consulta.",
    hero: {
      eyebrow: "Kioscos y POS",
      title: "Autoservicio que simplifica cada interacción.",
      description: "Estaciones interactivas para pedidos, pagos, check-in y consulta de información. Diseñamos e integramos la solución completa para tu operación.",
      video_url: "/videos/kiosk-hero.mp4",
      primary_label: "Solicitar asesoría",
      primary_url: "/Contactos",
      secondary_label: "Conoce la solución",
      secondary_url: "/kioscos-punto-de-venta",
    },
    subcategories: [
      { name: "Kioscos de autoservicio", slug: "kioscos-de-autoservicio" },
      { name: "Terminales punto de venta", slug: "terminales-punto-de-venta" },
      { name: "Accesorios", slug: "accesorios" },
    ],
  },
];

export const categories = [...defaultCategories];

export const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

// Reemplaza en sitio el listado para que todos los módulos importados vean los cambios.
export function applyCategories(rows) {
  if (!Array.isArray(rows) || !rows.length) return;
  const next = rows.map((row) => {
    const fallback = defaultCategories.find((item) => item.slug === row.slug);
    return {
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      image: fallback?.image || null,
      image_url: row.image_url || "",
      hero: {
        ...(fallback?.hero || {}),
        ...(row.hero && typeof row.hero === "object" ? row.hero : {}),
      },
      subcategories: (row.subcategories || []).map((sub, _i, all) => {
        const parent = sub.parent && all.find((item) => item.slug === sub.parent);
        return {
          ...sub,
          ...(parent ? { label: `${parent.name} / ${sub.name}` } : {}),
          ...(sub.slug === "impresoras-etiquetas" && row.slug === "codigo-de-barras" ? { href: "/impresoras-etiquetas" } : {}),
        };
      }),
    };
  });
  categories.splice(0, categories.length, ...next);
}

// "Suministros" con líneas "- Hija" debajo se convierte en subcategoría con hijas.
export function parseSubcategories(text, existing = []) {
  const result = [];
  let parent = "";
  const used = new Set();
  for (const raw of String(text || "").split(/\r?\n/)) {
    const isChild = /^\s*[-–•]/.test(raw) && parent;
    const name = raw.replace(/^\s*[-–•]\s*/, "").trim();
    if (!name) continue;
    const known = existing.find((item) => item.name.toLowerCase() === name.toLowerCase() && !used.has(item.slug));
    let slug = known?.slug || slugify(name);
    if (!slug) continue;
    let base = slug;
    let counter = 2;
    while (used.has(slug)) slug = `${base}-${counter++}`;
    used.add(slug);
    result.push(isChild ? { name, slug, parent } : { name, slug });
    if (!isChild) parent = slug;
  }
  return result;
}

export function subcategoriesToText(subcategories = []) {
  return subcategories.map((item) => `${item.parent ? "- " : ""}${item.name}`).join("\n");
}

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
  kioscos: ["kioscos-y-pos", ""],
  "kioscos y pos": ["kioscos-y-pos", ""],
  "punto de venta": ["kioscos-y-pos", ""],
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
