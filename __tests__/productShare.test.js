import { buildProductShareText, formatSharePrice } from "@/lib/productShare";

const product = {
  name: "Impresora Zebra ZD230",
  description: "Impresora térmica de etiquetas para oficina y retail.",
  price: 450,
  offerPrice: 399,
  specifications: [
    {
      title: "Especificaciones",
      rows: [
        { label: "Método de impresión", value: "Térmico directo" },
        { label: "Resolución", value: "203 dpi" },
      ],
    },
    {
      title: "Conectividad",
      items: ["USB", "Ethernet opcional"],
    },
  ],
};

describe("buildProductShareText", () => {
  it("incluye nombre, categoría, descripción, características y enlace", () => {
    const text = buildProductShareText(product, {
      canShop: true,
      currency: "$",
      category: "Impresoras de etiquetas",
      url: "https://www.compelecuador.com/product/abc",
    });

    expect(text).toContain("*Impresora Zebra ZD230*");
    expect(text).toContain("Categoría: Impresoras de etiquetas");
    expect(text).toContain("Impresora térmica de etiquetas");
    expect(text).toContain("*Características:*");
    expect(text).toContain("Método de impresión: Térmico directo");
    expect(text).toContain("Resolución: 203 dpi");
    expect(text).toContain("USB");
    expect(text).toContain("Ethernet opcional");
    expect(text).toContain("Ver producto: https://www.compelecuador.com/product/abc");
  });

  it("incluye el precio efectivo y el precio anterior cuando hay oferta", () => {
    const text = buildProductShareText(product, { canShop: true, currency: "$" });

    expect(text).toMatch(/\*Precio:\* \$399[.,]00 \(antes \$450[.,]00\)/);
  });

  it("no incluye precios para visitantes sin sesión", () => {
    const text = buildProductShareText(product, { canShop: false, currency: "$" });

    expect(text).not.toContain("Precio:");
    expect(text).not.toContain("399");
    expect(text).not.toContain("450");
  });

  it("trunca descripciones muy largas", () => {
    const text = buildProductShareText(
      { ...product, description: "a".repeat(900), specifications: [] },
      { canShop: false },
    );

    expect(text).toContain("…");
    expect(text.length).toBeLessThan(800);
  });

  it("devuelve una cadena vacía si no hay producto", () => {
    expect(buildProductShareText(null)).toBe("");
  });
});

describe("formatSharePrice", () => {
  it("usa el precio de oferta cuando está activo", () => {
    expect(formatSharePrice(product, "$")).toMatch(/\$399[.,]00/);
  });

  it("devuelve vacío para precios inválidos", () => {
    expect(formatSharePrice({ price: 0 }, "$")).toBe("");
    expect(formatSharePrice(null, "$")).toBe("");
  });
});
