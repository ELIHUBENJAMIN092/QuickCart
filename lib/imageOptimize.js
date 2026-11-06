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
const SHADOW_MIN = 128;
const SHADOW_SPREAD = 12;
const SHADOW_STEP = 8;
const MAX_PNG_BYTES = 7 * 1024 * 1024;

const isWhite = (data, index) => {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return Math.min(r, g, b) >= WHITE_MIN && Math.max(r, g, b) - Math.min(r, g, b) <= WHITE_SPREAD;
};

// Elimina el blanco exterior y las sombras neutras que se degradan hacia él.
export function removeWhiteBackground(imageData) {
  const { width, height, data } = imageData;
  const total = width * height;
  for (let position = 0; position < total; position += 1) {
    if (data[position * 4 + 3] < 255) return false;
  }
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

  // La diferencia entre vecinos evita extender el borrado a través de bordes definidos.
  head = 0;
  const pushShadow = (position, neighbor) => {
    if (removed[neighbor]) return;
    const index = neighbor * 4;
    const source = position * 4;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    if (Math.min(r, g, b) < SHADOW_MIN || Math.max(r, g, b) - Math.min(r, g, b) > SHADOW_SPREAD) return;
    if (Math.abs(r - data[source]) > SHADOW_STEP ||
        Math.abs(g - data[source + 1]) > SHADOW_STEP ||
        Math.abs(b - data[source + 2]) > SHADOW_STEP) return;
    removed[neighbor] = 1;
    queue[tail] = neighbor;
    tail += 1;
  };
  while (head < tail) {
    const position = queue[head];
    head += 1;
    const x = position % width;
    const y = (position - x) / width;
    if (x > 0) pushShadow(position, position - 1);
    if (x < width - 1) pushShadow(position, position + 1);
    if (y > 0) pushShadow(position, position - width);
    if (y < height - 1) pushShadow(position, position + width);
  }

  // Protege blancos dentro del contorno incluso si una abertura los conecta al fondo.
  const left = new Int32Array(height).fill(width);
  const right = new Int32Array(height).fill(-1);
  const top = new Int32Array(width).fill(height);
  const bottom = new Int32Array(width).fill(-1);
  for (let position = 0; position < total; position += 1) {
    if (removed[position]) continue;
    const x = position % width;
    const y = (position - x) / width;
    left[y] = Math.min(left[y], x);
    right[y] = Math.max(right[y], x);
    top[x] = Math.min(top[x], y);
    bottom[x] = Math.max(bottom[x], y);
  }
  const radius = Math.max(1, Math.min(16, Math.round(Math.max(width, height) * 0.01)));
  const expandBounds = (minimum, maximum) => {
    const expandedMin = minimum.slice();
    const expandedMax = maximum.slice();
    for (let index = 0; index < minimum.length; index += 1) {
      for (let neighbor = Math.max(0, index - radius); neighbor <= Math.min(minimum.length - 1, index + radius); neighbor += 1) {
        expandedMin[index] = Math.min(expandedMin[index], minimum[neighbor]);
        expandedMax[index] = Math.max(expandedMax[index], maximum[neighbor]);
      }
    }
    return [expandedMin, expandedMax];
  };
  const [outerLeft, outerRight] = expandBounds(left, right);
  const [outerTop, outerBottom] = expandBounds(top, bottom);
  for (let position = 0; position < total; position += 1) {
    const x = position % width;
    const y = (position - x) / width;
    if (x > outerLeft[y] && x < outerRight[y] && y > outerTop[x] && y < outerBottom[x] && isWhite(data, position * 4)) {
      removed[position] = 2;
    }
  }

  for (let position = 0; position < total; position += 1) {
    const index = position * 4;
    if (removed[position] === 1) {
      data[index + 3] = 0;
      continue;
    }
    if (removed[position] === 2) continue;
    const x = position % width;
    const y = (position - x) / width;
    const nearRemoved =
      (x > 0 && removed[position - 1] === 1) || (x < width - 1 && removed[position + 1] === 1) ||
      (y > 0 && removed[position - width] === 1) || (y < height - 1 && removed[position + width] === 1);
    if (nearRemoved) {
      const whiteness = Math.min(data[index], data[index + 1], data[index + 2]);
      if (whiteness > 190) {
        const alpha = (255 - whiteness) / 65;
        if (alpha > 0) {
          for (let channel = 0; channel < 3; channel += 1) {
            data[index + channel] = Math.max(0, Math.round((data[index + channel] - 255 * (1 - alpha)) / alpha));
          }
        }
        data[index + 3] = Math.round(255 * alpha);
      }
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
