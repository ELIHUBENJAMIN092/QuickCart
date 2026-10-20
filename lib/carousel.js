import { assets } from "@/assets/assets";
import { categories } from "@/lib/categories";

const defaultImages = {
  "codigo-de-barras": assets.codigo_barras,
  "computo-movil": assets.rfid_mc3330r,
  rfid: assets.rfid_fx9600,
  "identificacion-pvc": assets.credencial,
};

const defaults = [
  ["Impresión profesional", "Cada etiqueta, una operación más eficiente.", "Impresoras y suministros confiables para acompañar el crecimiento de tu empresa.", "Ver código de barras"],
  ["Movilidad empresarial", "Datos en la mano de tu equipo.", "Computadores de mano y tabletas robustas para trabajo en campo, bodega y retail.", "Ver cómputo móvil"],
  ["Identificación inteligente", "Control y trazabilidad en tiempo real.", "Antenas, impresoras y tags RFID pensados para entornos exigentes.", "Descubrir RFID"],
  ["Credenciales y tarjetas", "Identidad segura para cada persona.", "Impresoras, suministros y tarjetas PVC para credenciales y membresías.", "Ver identificación PVC"],
];

export const SLIDE_FIELDS = ["eyebrow", "title", "description", "primary_label", "secondary_label"];

export const defaultSlides = categories.map((category, index) => ({
  position: index + 1,
  category: category.slug,
  eyebrow: defaults[index][0],
  title: defaults[index][1],
  description: defaults[index][2],
  primary_label: defaults[index][3],
  secondary_label: "Hablar con un asesor",
  image_url: "",
}));

// Une las filas guardadas con los valores por defecto para tener siempre 4 diapositivas.
export function buildSlides(rows = []) {
  return defaultSlides.map((fallback) => {
    const row = rows.find((item) => item.position === fallback.position);
    return {
      ...fallback,
      ...(row || {}),
      category: fallback.category,
    };
  });
}

export const slideImage = (slide) => slide.image_url || defaultImages[slide.category];
