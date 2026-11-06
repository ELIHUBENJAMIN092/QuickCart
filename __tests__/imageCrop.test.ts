import { aspectMatches, formatAspect } from "../lib/imageCrop";

describe("aspectMatches", () => {
  it("acepta una imagen 16:9", () => {
    expect(aspectMatches(1600, 900, 16 / 9)).toBe(true);
  });

  it("rechaza una imagen 4:3 para una portada 16:9", () => {
    expect(aspectMatches(1600, 1200, 16 / 9)).toBe(false);
  });

  it("tolera pequeñas diferencias de redondeo", () => {
    expect(aspectMatches(1919, 1080, 16 / 9)).toBe(true);
  });

  it("acepta la franja panorámica 10:3 de las categorías", () => {
    expect(aspectMatches(1000, 300, 10 / 3)).toBe(true);
    expect(aspectMatches(1000, 400, 10 / 3)).toBe(false);
  });

  it("no bloquea cuando faltan las medidas", () => {
    expect(aspectMatches(0, 0, 16 / 9)).toBe(true);
  });
});

describe("formatAspect", () => {
  it("etiqueta las proporciones habituales", () => {
    expect(formatAspect(16 / 9)).toBe("16:9");
    expect(formatAspect(4 / 3)).toBe("4:3");
    expect(formatAspect(10 / 3)).toBe("10:3");
    expect(formatAspect(1)).toBe("1:1");
  });

  it("devuelve una etiqueta numérica para proporciones desconocidas", () => {
    expect(formatAspect(1.1)).toBe("1.1:1");
  });
});
