import { removeWhiteBackground } from "../lib/imageOptimize";

function image(width: number, height: number, color: number[]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let position = 0; position < width * height; position += 1) {
    data.set(color, position * 4);
  }
  return { width, height, data };
}

function setPixel(imageData: ReturnType<typeof image>, x: number, y: number, color: number[]) {
  imageData.data.set(color, (y * imageData.width + x) * 4);
}

function pixel(imageData: ReturnType<typeof image>, x: number, y: number) {
  const index = (y * imageData.width + x) * 4;
  return Array.from(imageData.data.slice(index, index + 4));
}

describe("removeWhiteBackground", () => {
  it("elimina el fondo y una sombra gris degradada sin borrar el producto ni sus blancos interiores", () => {
    const imageData = image(50, 50, [255, 255, 255, 255]);
    for (let y = 6; y <= 28; y += 1) {
      for (let x = 19; x <= 30; x += 1) setPixel(imageData, x, y, [35, 38, 40, 255]);
    }
    setPixel(imageData, 24, 15, [255, 255, 255, 255]);
    for (let y = 29; y <= 44; y += 1) {
      const shade = 135 + (y - 29) * 8;
      for (let x = 10; x <= 39; x += 1) setPixel(imageData, x, y, [shade, shade, shade, 255]);
    }

    expect(removeWhiteBackground(imageData)).toBe(true);
    expect(pixel(imageData, 0, 0)[3]).toBe(0);
    expect(pixel(imageData, 24, 29)[3]).toBe(0);
    expect(pixel(imageData, 12, 35)[3]).toBe(0);
    expect(pixel(imageData, 24, 15)).toEqual([255, 255, 255, 255]);
    expect(pixel(imageData, 24, 20)).toEqual([35, 38, 40, 255]);
  });

  it("conserva un producto gris con un borde definido", () => {
    const imageData = image(20, 20, [255, 255, 255, 255]);
    for (let y = 5; y < 15; y += 1) {
      for (let x = 5; x < 15; x += 1) setPixel(imageData, x, y, [160, 160, 160, 255]);
    }

    expect(removeWhiteBackground(imageData)).toBe(true);
    expect(pixel(imageData, 5, 5)).toEqual([160, 160, 160, 255]);
    expect(pixel(imageData, 10, 10)).toEqual([160, 160, 160, 255]);
  });

  it("conserva un área blanca dentro del contorno aunque esté conectada al fondo", () => {
    const imageData = image(30, 30, [255, 255, 255, 255]);
    for (let y = 5; y <= 24; y += 1) {
      for (let x = 5; x <= 24; x += 1) setPixel(imageData, x, y, [30, 30, 30, 255]);
    }
    for (let y = 10; y <= 19; y += 1) {
      for (let x = 10; x <= 19; x += 1) setPixel(imageData, x, y, [250, 250, 250, 255]);
    }
    for (let x = 0; x <= 10; x += 1) setPixel(imageData, x, 14, [250, 250, 250, 255]);

    expect(removeWhiteBackground(imageData)).toBe(true);
    expect(pixel(imageData, 15, 14)).toEqual([250, 250, 250, 255]);
    expect(pixel(imageData, 15, 15)).toEqual([250, 250, 250, 255]);
    expect(pixel(imageData, 2, 14)[3]).toBe(0);
    expect(pixel(imageData, 6, 6)).toEqual([30, 30, 30, 255]);
  });

  it("conserva los blancos interiores cuando hay una abertura vertical", () => {
    const imageData = image(20, 20, [255, 255, 255, 255]);
    for (let y = 4; y <= 15; y += 1) {
      for (let x = 4; x <= 15; x += 1) setPixel(imageData, x, y, [30, 30, 30, 255]);
    }
    setPixel(imageData, 10, 10, [250, 248, 246, 255]);
    setPixel(imageData, 10, 9, [241, 241, 241, 255]);
    for (let y = 0; y < 9; y += 1) setPixel(imageData, 10, y, [248, 248, 248, 255]);

    expect(removeWhiteBackground(imageData)).toBe(true);
    expect(pixel(imageData, 10, 10)).toEqual([250, 248, 246, 255]);
  });

  it("suaviza los bordes de color sin dejar un halo blanco", () => {
    const imageData = image(10, 10, [255, 255, 255, 255]);
    setPixel(imageData, 5, 5, [220, 210, 200, 255]);

    expect(removeWhiteBackground(imageData)).toBe(true);
    expect(pixel(imageData, 5, 5)).toEqual([214, 202, 190, 216]);
  });

  it("no modifica fotos sin fondo blanco predominante", () => {
    const imageData = image(10, 10, [40, 100, 160, 255]);
    const before = imageData.data.slice();

    expect(removeWhiteBackground(imageData)).toBe(false);
    expect(imageData.data).toEqual(before);
  });

  it("conserva las imágenes con transparencia existente", () => {
    const imageData = image(10, 10, [255, 255, 255, 255]);
    setPixel(imageData, 5, 5, [40, 100, 160, 128]);
    const before = imageData.data.slice();

    expect(removeWhiteBackground(imageData)).toBe(false);
    expect(imageData.data).toEqual(before);
  });
});
