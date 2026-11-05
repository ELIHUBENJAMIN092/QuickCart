export const WHATSAPP_COUNTRY_CODE = "593";

export const defaultContacts = [
  { id: "default-contact-1", phone: "0984617873", position: 1 },
  { id: "default-contact-2", phone: "0995768770", position: 2 },
  { id: "default-contact-3", phone: "0999033418", position: 3 },
];

// Acepta formatos como 0984617873, 098 461 7873, +593 98 461 7873 o 984617873.
export const normalizeContactPhone = (value) => {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith(WHATSAPP_COUNTRY_CODE) && digits.length === 12) {
    digits = `0${digits.slice(WHATSAPP_COUNTRY_CODE.length)}`;
  }
  if (digits.length === 9 && digits.startsWith("9")) {
    digits = `0${digits}`;
  }
  return digits;
};

export const isValidContactPhone = (value) => /^09\d{8}$/.test(normalizeContactPhone(value));

export const formatContactPhone = (value) => {
  const phone = normalizeContactPhone(value);
  if (!isValidContactPhone(phone)) return String(value ?? "");
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
};

export const whatsappHref = (phone) => {
  const normalized = normalizeContactPhone(phone);
  return `https://wa.me/${WHATSAPP_COUNTRY_CODE}${normalized.replace(/^0/, "")}`;
};

export function buildContacts(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.phone)
    .map((row) => ({
      id: row.id,
      name: String(row.name || "Contacto").slice(0, 80),
      phone: normalizeContactPhone(row.phone),
      position: Number(row.position),
      updated_at: row.updated_at,
    }))
    .filter((row) => isValidContactPhone(row.phone) && Number.isInteger(row.position) && row.position > 0)
    .sort((a, b) => a.position - b.position);
}

export const isContactId = (value) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
