export const defaultKiosk = {
  eyebrow: "Kioscos y punto de venta",
  title: "Autoservicio que simplifica cada interacción.",
  description:
    "Estaciones interactivas para pedidos, pagos, check-in y consulta de información. Diseñamos e integramos la solución completa para tu operación.",
  primary_label: "Solicitar asesoría",
  primary_url: "/Acerca#contacto",
  secondary_label: "Ver equipos",
  secondary_url: "/all-products?category=computo-movil",
  video_url: "/videos/kiosk-hero.mp4",
  highlights: [
    { value: "3", label: "Formatos: piso, mostrador y pared" },
    { value: '22–27"', label: "Pantallas táctiles" },
    { value: "POS", label: "Integración con periféricos" },
  ],
  features: [
    {
      title: "Formatos para cada espacio",
      description:
        "Estaciones de piso, mostrador o pared que se adaptan a tu local y a tu flujo de atención.",
    },
    {
      title: "Pantallas táctiles de 22 a 27 pulgadas",
      description:
        "Elige el tamaño y la orientación que mejor se ajuste a tu experiencia de autoservicio.",
    },
    {
      title: "Periféricos integrados",
      description:
        "Lector de códigos, impresora térmica, lector de tarjetas, cámara y más conectados a la estación.",
    },
    {
      title: "Gestión centralizada",
      description:
        "Administra contenido, actualizaciones y equipos desde un solo lugar, con soporte local.",
    },
  ],
  closing_title: "Diseñemos tu próximo punto de autoservicio.",
  closing_description:
    "Te ayudamos a elegir el formato, los periféricos y la integración que tu operación necesita.",
  closing_label: "Hablar con un especialista",
  closing_url: "/Acerca#contacto",
};

export const KIOSK_LIMITS = {
  eyebrow: 80,
  title: 140,
  description: 400,
  primary_label: 40,
  primary_url: 300,
  secondary_label: 40,
  secondary_url: 300,
  closing_title: 140,
  closing_description: 300,
  closing_label: 40,
  closing_url: 300,
  video_url: 500,
};

export const KIOSK_HIGHLIGHT_LIMITS = { value: 20, label: 70 };
export const KIOSK_FEATURE_LIMITS = { title: 90, description: 200 };

export const isValidKioskLink = (value) => !value || /^(\/(?!\/)|https?:\/\/)/.test(value);

const cleanText = (value, max) => String(value ?? "").trim().slice(0, max);

export function normalizeKioskHighlights(value) {
  const list = Array.isArray(value) ? value : [];
  return defaultKiosk.highlights.map((fallback, index) => ({
    value: cleanText(list[index]?.value, KIOSK_HIGHLIGHT_LIMITS.value) || fallback.value,
    label: cleanText(list[index]?.label, KIOSK_HIGHLIGHT_LIMITS.label) || fallback.label,
  }));
}

export function normalizeKioskFeatures(value) {
  const list = Array.isArray(value) ? value : [];
  return defaultKiosk.features.map((fallback, index) => ({
    title: cleanText(list[index]?.title, KIOSK_FEATURE_LIMITS.title) || fallback.title,
    description: cleanText(list[index]?.description, KIOSK_FEATURE_LIMITS.description) || fallback.description,
  }));
}

export function buildKiosk(row) {
  return {
    ...defaultKiosk,
    ...(row || {}),
    highlights: normalizeKioskHighlights(row?.highlights),
    features: normalizeKioskFeatures(row?.features),
  };
}
