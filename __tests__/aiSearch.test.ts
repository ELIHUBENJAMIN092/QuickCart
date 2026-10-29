import {
  dedupeProducts,
  detectCategory,
  findMentionedProducts,
  getQuickReplies,
  normalizeText,
  searchProducts,
} from "../lib/ai/search";

const categories = [
  {
    name: "Código de Barras",
    slug: "codigo-de-barras",
    subcategories: [
      { name: "Impresoras de etiquetas", slug: "impresoras-etiquetas" },
      { name: "Lectores", slug: "lectores" },
      { name: "Suministros", slug: "suministros" },
    ],
  },
  {
    name: "RFID",
    slug: "rfid",
    subcategories: [
      { name: "Impresoras RFID", slug: "impresoras" },
      { name: "Antenas", slug: "antenas" },
    ],
  },
  {
    name: "Kioscos y POS",
    slug: "kioscos-y-pos",
    subcategories: [{ name: "Terminales punto de venta", slug: "terminales-punto-de-venta" }],
  },
];

const products = [
  {
    id: "zebra-1",
    name: "Impresora de etiquetas Zebra ZD421",
    category: "codigo-de-barras",
    categoryName: "Código de Barras",
    subcategoryName: "Impresoras de etiquetas",
    description: "Impresora térmica de escritorio para etiquetas y códigos de barras.",
    price: 450,
    stock: 4,
    isOffer: false,
    isNew: true,
  },
  {
    id: "zebra-2",
    name: "Impresora industrial Zebra ZT411",
    category: "codigo-de-barras",
    categoryName: "Código de Barras",
    subcategoryName: "Impresoras de etiquetas",
    description: "Impresora industrial de alto volumen para etiquetas.",
    price: 1200,
    stock: 0,
    isOffer: false,
    isNew: false,
  },
  {
    id: "rfid-1",
    name: "Impresora RFID Zebra ZD621R",
    category: "rfid",
    categoryName: "RFID",
    subcategoryName: "Impresoras RFID",
    description: "Impresora RFID para etiquetas inteligentes.",
    price: 980,
    stock: 2,
    isOffer: true,
    isNew: false,
  },
  {
    id: "kiosk-1",
    name: "Kiosco de autoservicio K-200",
    category: "kioscos-y-pos",
    categoryName: "Kioscos y POS",
    subcategoryName: "Terminales punto de venta",
    description: "Estación interactiva para pedidos y pagos.",
    price: 2500,
    stock: 1,
    isOffer: false,
    isNew: false,
  },
  {
    id: "scanner-1",
    name: "Lector Zebra DS2208",
    category: "codigo-de-barras",
    categoryName: "Código de Barras",
    subcategoryName: "Lectores",
    description: "Escáner de códigos de barras para punto de venta.",
    price: 180,
    stock: 5,
    isOffer: false,
    isNew: false,
  },
  {
    id: "card-1",
    name: "Tarjetas PVC para credenciales",
    category: "identificacion-pvc",
    categoryName: "Identificación PVC",
    subcategoryName: "Suministros",
    description: "Tarjetas para imprimir carnets y gafetes.",
    price: 0.75,
    stock: 100,
    isOffer: false,
    isNew: false,
  },
];

describe("AI catalog search", () => {
  test("normaliza acentos y signos", () => {
    expect(normalizeText("Impresión de Etiquetas / RFID")).toBe("impresion de etiquetas rfid");
  });

  test("detecta la categoría y subcategoría mencionadas", () => {
    expect(detectCategory("Busco una impresora de etiquetas", categories)).toMatchObject({
      slug: "codigo-de-barras",
      subcategorySlug: "impresoras-etiquetas",
    });
    expect(detectCategory("Necesito RFID para inventario", categories)).toMatchObject({
      slug: "rfid",
    });
    expect(detectCategory("un kiosco para mi tienda", categories)).toMatchObject({
      slug: "kioscos-y-pos",
    });
  });

  test("encuentra productos por nombre sin distinguir acentos ni mayúsculas", () => {
    const results = searchProducts("impresora zebra", products, { limit: 3 });
    expect(results.map((product) => product.id)).toEqual(
      expect.arrayContaining(["zebra-1", "zebra-2", "rfid-1"])
    );
  });

  test("filtra por categoría detectada", () => {
    const results = searchProducts("impresora", products, {
      detectedCategory: detectCategory("impresora rfid", categories),
    });
    expect(results[0].id).toBe("rfid-1");
  });

  test("filtra por precio y stock", () => {
    const results = searchProducts("impresora", products, { maxPrice: 1000, inStock: true });
    expect(results.map((product) => product.id).sort()).toEqual(["rfid-1", "zebra-1"]);
  });

  test("encuentra productos con términos comerciales equivalentes", () => {
    expect(searchProducts("scanner zebra", products).map((product) => product.id)).toContain("scanner-1");
    expect(searchProducts("gafete PVC", products).map((product) => product.id)).toContain("card-1");
  });

  test("devuelve una lista vacía cuando no hay coincidencias", () => {
    expect(searchProducts("cámaras de seguridad", products)).toEqual([]);
  });

  test("deduplica productos y respeta el límite", () => {
    expect(dedupeProducts([products[0], products[0], products[1]], 2).map((product) => product.id)).toEqual([
      "zebra-1",
      "zebra-2",
    ]);
  });

  test("detecta los productos mencionados por el modelo", () => {
    const text = "Te recomiendo la ZD421 y la ZT411 para tu operación.";
    const mentioned = findMentionedProducts(text, products);
    expect(mentioned.map((product) => product.id)).toEqual(["zebra-1", "zebra-2"]);
  });

  test("genera respuestas rápidas contextuales", () => {
    expect(getQuickReplies({ products: [products[0]], canViewCommerce: false })[0]).toBe(
      "¿Cómo veo los precios?"
    );
    expect(getQuickReplies({ products: [] })).toContain("Ver categorías");
  });
});
