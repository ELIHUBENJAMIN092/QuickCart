const DEFAULT_MAX_SIDE = 2000;
const DEFAULT_QUALITY = 0.9;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen.")); };
    image.src = url;
  });
}

// Devuelve las medidas reales del archivo para decidir si necesita encuadre.
export async function getImageDimensions(file) {
  if (!file || !file.type?.startsWith("image/")) return null;
  try {
    const image = await loadImage(file);
    return { width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    return null;
  }
}

// Compara la proporción de la imagen con la esperada (16:9 por defecto).
export function aspectMatches(width, height, aspect, tolerance = 0.02) {
  if (!width || !height || !aspect) return true;
  return Math.abs(width / height - aspect) / aspect <= tolerance;
}

// Recorta el archivo en el navegador y devuelve un nuevo File listo para subir.
export async function cropImageToFile(file, crop, { maxSide = DEFAULT_MAX_SIDE, quality = DEFAULT_QUALITY } = {}) {
  if (!file || !crop || crop.width < 2 || crop.height < 2) return file;
  try {
    const image = await loadImage(file);
    const x = Math.max(0, Math.min(Math.round(crop.x), image.naturalWidth - 1));
    const y = Math.max(0, Math.min(Math.round(crop.y), image.naturalHeight - 1));
    const width = Math.max(1, Math.min(Math.round(crop.width), image.naturalWidth - x));
    const height = Math.max(1, Math.min(Math.round(crop.height), image.naturalHeight - y));

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);

    let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    const extension = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
    return new File([blob], `${baseName}.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}

export const formatAspect = (aspect) => {
  if (!aspect) return "";
  const ratio = Number(aspect);
  if (!Number.isFinite(ratio)) return "";
  const rounded = Math.round(ratio * 100) / 100;
  const known = { 1: "1:1", 1.33: "4:3", 1.5: "3:2", 1.78: "16:9", 2: "2:1", 2.33: "21:9", 2.35: "21:9", 2.67: "8:3", 3: "3:1", 3.33: "10:3" };
  const match = Object.entries(known).find(([value]) => Math.abs(Number(value) - rounded) < 0.03);
  return match ? match[1] : `${rounded}:1`;
};
