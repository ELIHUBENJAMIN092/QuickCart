export const CERTIFICATION_HEIGHT = {
  min: 56,
  max: 176,
  step: 4,
  default: 104,
};

export const defaultCertifications = [
  { id: "default-1", name: "Zebra Supplies Specialist", image_url: "/certificaciones/zebra-supplies-specialist.png", position: 1, height: 104 },
  { id: "default-2", name: "Zebra Supplies Specialist", image_url: "/certificaciones/zebra-supplies-specialist.png", position: 2, height: 104 },
  { id: "default-3", name: "Zebra Supplies Specialist", image_url: "/certificaciones/zebra-supplies-specialist.png", position: 3, height: 104 },
];

export const clampCertificationHeight = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return CERTIFICATION_HEIGHT.default;
  return Math.min(CERTIFICATION_HEIGHT.max, Math.max(CERTIFICATION_HEIGHT.min, Math.round(number)));
};

export function buildCertifications(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.image_url)
    .map((row) => ({
      id: row.id,
      name: String(row.name || "Certificación").slice(0, 80),
      image_url: row.image_url,
      height: clampCertificationHeight(row.height),
      position: Number(row.position),
    }))
    .filter((row) => Number.isInteger(row.position) && row.position > 0)
    .sort((a, b) => a.position - b.position);
}

export const isCertificationId = (value) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
