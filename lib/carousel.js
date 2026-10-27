import { assets } from "@/assets/assets";
import { categories } from "@/lib/categories";

const defaultImages = {
  "codigo-de-barras": assets.codigo_barras,
  "computo-movil": assets.rfid_mc3330r,
  rfid: assets.rfid_fx9600,
  "identificacion-pvc": assets.credencial,
  "kioscos-y-pos": "/videos/kiosk-poster.jpg",
};

const defaults = [
  ["Impresión profesional", "Cada etiqueta, una operación más eficiente.", "Impresoras y suministros confiables para acompañar el crecimiento de tu empresa.", "Ver código de barras"],
  ["Movilidad empresarial", "Datos en la mano de tu equipo.", "Computadores de mano y tabletas robustas para trabajo en campo, bodega y retail.", "Ver cómputo móvil"],
  ["Identificación inteligente", "Control y trazabilidad en tiempo real.", "Antenas, impresoras y tags RFID pensados para entornos exigentes.", "Descubrir RFID"],
  ["Credenciales y tarjetas", "Identidad segura para cada persona.", "Impresoras, suministros y tarjetas PVC para credenciales y membresías.", "Ver identificación PVC"],
  ["Kioscos y punto de venta", "Autoservicio que simplifica cada interacción.", "Estaciones interactivas para pedidos, pagos, check-in y consulta de información.", "Ver kioscos y POS"],
];

export const defaultSlides = categories.map((category, index) => {
  const copy = defaults[index] || defaults[0];
  return {
    position: index + 1,
    category: category.slug,
    eyebrow: copy[0],
    title: copy[1],
    description: copy[2],
    primary_label: copy[3],
    secondary_label: "Hablar con un asesor",
    image_url: "",
  };
});

export function newSlide(position, category = categories[0]?.slug || "") {
  return {
    position,
    category,
    eyebrow: "Nueva diapositiva",
    title: "Escribe un título que resuma tu solución.",
    description: "Describe en una frase el beneficio principal para tu cliente.",
    primary_label: "Ver categoría",
    secondary_label: "Hablar con un asesor",
    image_url: "",
  };
}

// Devuelve las diapositivas guardadas en su orden; si aún no hay filas usa las de fábrica.
export function buildSlides(rows = []) {
  const saved = (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.category)
    .map((row) => ({
      ...newSlide(Number(row.position)),
      ...row,
      position: Number(row.position),
    }))
    .filter((row) => Number.isInteger(row.position) && row.position > 0)
    .sort((a, b) => a.position - b.position);

  if (!saved.length) return defaultSlides.map((slide) => ({ ...slide }));
  return saved;
}

export const slideImage = (slide) =>
  slide.image_url || defaultImages[slide.category] || assets.codigo_barras;
