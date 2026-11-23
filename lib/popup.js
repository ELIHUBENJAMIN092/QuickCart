import { assets } from "@/assets/assets";

// Ventana emergente de la tienda: promociones, avisos o mensajes importantes
// que se muestran como modal al cargar la página. Si no se sube una imagen,
// se usa la imagen navideña por defecto.
export const defaultPopup = {
  enabled: true,
  image_url: "",
  title: "¡Feliz Navidad!",
  message: "Aprovecha las promociones de fin de año y renueva tu operación con descuentos especiales.",
  button_label: "Ver promociones",
  button_url: "/all-products",
  audio_url: "",
  audio_enabled: false,
  audio_volume: 50,
};

export const POPUP_LIMITS = {
  title: 120,
  message: 300,
  button_label: 40,
  button_url: 300,
};

// Volumen del audio de fondo, de 0 a 100.
export const clampVolume = (value) => {
  const volume = Math.round(Number(value));
  if (!Number.isFinite(volume)) return 50;
  return Math.max(0, Math.min(100, volume));
};

export const isValidLink = (value) => !value || /^(\/(?!\/)|https?:\/\/)/.test(value);

export const buildPopup = (row) => ({ ...defaultPopup, ...(row || {}) });

// Imagen a mostrar: la subida por el vendedor o, si no hay, la navideña.
export const popupImage = (popup) => popup?.image_url || assets.navidad;
