const clean = (value, max) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9()\s.-]{6,40}$/;

/**
 * Valida el formulario de asesoría.
 * Requiere nombre, consentimiento y al menos un medio de contacto.
 */
export function validateLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "La solicitud no es válida." };
  }

  // Honeypot: los bots suelen completar campos ocultos.
  if (clean(body.website, 120)) {
    return { error: "No se pudo enviar la solicitud." };
  }

  const name = clean(body.name, 80);
  const company = clean(body.company, 100);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const interest = clean(body.interest, 200);
  const volume = clean(body.volume, 100);
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";

  if (!name) return { error: "Ingresa tu nombre." };
  if (!email && !phone) return { error: "Ingresa un correo o un teléfono de contacto." };
  if (email && !EMAIL_PATTERN.test(email)) return { error: "El correo no es válido." };
  if (phone && !PHONE_PATTERN.test(phone)) return { error: "El teléfono no es válido." };
  if (body.consent !== true) return { error: "Debes aceptar ser contactado por COMPEL." };

  return {
    lead: {
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      interest: interest || null,
      volume: volume || null,
      message: message || null,
      consent: true,
    },
  };
}
