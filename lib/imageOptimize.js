const MAX_SIDE = 2000;
const QUALITY = 0.88;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen.")); };
    image.src = url;
  });
}

// Reduce el peso en el navegador: limita el lado mayor y recodifica a WebP, que conserva la transparencia.
// Si el resultado no pesa menos, se devuelve el archivo original.
export async function optimizeImage(file, { maxSide = MAX_SIDE, quality = QUALITY } = {}) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

const BG_MAX_SIDE = 1600;
const WHITE_MIN = 236;
const WHITE_SPREAD = 22;
const MAX_PNG_BYTES = 7 * 1024 * 1024;

const isWhite = (data, index) => {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return Math.min(r, g, b) >= WHITE_MIN && Math.max(r, g, b) - Math.min(r, g, b) <= WHITE_SPREAD;
};

// Quita el fondo blanco conectado a los bordes (no toca blancos interiores del producto) y suaviza el contorno.
function removeWhiteBackground(imageData) {
  const { width, height, data } = imageData;
  const total = width * height;
  let borderWhite = 0;
  let borderTotal = 0;
  const checkBorder = (x, y) => {
    borderTotal += 1;
    if (isWhite(data, (y * width + x) * 4)) borderWhite += 1;
  };
  for (let x = 0; x < width; x += 1) { checkBorder(x, 0); checkBorder(x, height - 1); }
  for (let y = 1; y < height - 1; y += 1) { checkBorder(0, y); checkBorder(width - 1, y); }
  if (borderWhite / borderTotal < 0.6) return false;

  const removed = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const push = (x, y) => {
    const position = y * width + x;
    if (removed[position] || !isWhite(data, position * 4)) return;
    removed[position] = 1;
    queue[tail] = position;
    tail += 1;
  };
  for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += 1) { push(0, y); push(width - 1, y); }
  while (head < tail) {
    const position = queue[head];
    head += 1;
    const x = position % width;
    const y = (position - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  if (tail < total * 0.05) return false;

  for (let position = 0; position < total; position += 1) {
    const index = position * 4;
    if (removed[position]) {
      data[index + 3] = 0;
      continue;
    }
    const x = position % width;
    const y = (position - x) / width;
    const nearRemoved =
      (x > 0 && removed[position - 1]) || (x < width - 1 && removed[position + 1]) ||
      (y > 0 && removed[position - width]) || (y < height - 1 && removed[position + width]);
    if (nearRemoved) {
      const whiteness = Math.min(data[index], data[index + 1], data[index + 2]);
      if (whiteness > 190) data[index + 3] = Math.round(255 * Math.max(0, (255 - whiteness) / 65));
    }
  }
  return true;
}

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

// Optimiza el peso y, si la foto tiene fondo blanco, lo vuelve transparente y devuelve un PNG.
export async function processProductImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return optimizeImage(file);

  try {
    const image = await loadImage(file);
    let maxSide = BG_MAX_SIDE;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      if (!removeWhiteBackground(imageData)) return optimizeImage(file);
      context.putImageData(imageData, 0, 0);

      const blob = await canvasToBlob(canvas, "image/png");
      if (!blob) return optimizeImage(file);
      if (blob.size <= MAX_PNG_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
        return new File([blob], `${baseName}.png`, { type: "image/png" });
      }
      maxSide = Math.round(maxSide * 0.75);
    }
    return optimizeImage(file);
  } catch {
    return optimizeImage(file);
  }
}
