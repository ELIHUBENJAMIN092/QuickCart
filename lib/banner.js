export const defaultBanner = {
  enabled: true,
  message: "Envíos a todo el Ecuador · Soporte especializado B2B",
  message_url: "",
  left_label: "¿Necesitas ayuda?",
  left_url: "/Contactos",
  right_label: "Contáctanos",
  right_url: "/Contactos",
  bg_color: "#0b1b2b",
  text_color: "#ffffff",
};

export const BANNER_LIMITS = {
  message: 160, message_url: 300, left_label: 40, left_url: 300, right_label: 40, right_url: 300,
};

export const isValidLink = (value) => !value || /^(\/(?!\/)|https?:\/\/)/.test(value);

export const buildBanner = (row) => ({ ...defaultBanner, ...(row || {}) });
