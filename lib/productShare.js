import { getEffectiveUnitPrice, hasActiveOffer } from "@/lib/pricing";
import { specificationsToText } from "@/lib/specsText";

const MAX_DESCRIPTION_LENGTH = 700;

function truncateDescription(description) {
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;

  const cut = description.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace >= MAX_DESCRIPTION_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trimEnd()}…`;
}

function truncateWords(value, maxLength) {
  const text = String(value || "").trim();
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace >= maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trimEnd()}…`;
}

// WhatsApp limita el pie de foto de una imagen a 1024 caracteres. Si el texto
// enviado junto con la imagen es más largo, WhatsApp descarta el texto y deja
// solo la imagen. Esta versión compacta cabe en ese límite y conserva nombre,
// descripción, características principales, precio y enlace.
export function buildProductShareCaption(
  product,
  { canShop = false, currency = "$", url = "", category = "", maxLength = 1000 } = {},
) {
  if (!product) return "";

  const header = `*${String(product.name || "Producto").trim()}*`;
  const categoryLine = category ? `Categoría: ${category}` : "";
  const price = canShop ? formatSharePrice(product, currency) : "";
  const priceBlock = price
    ? hasActiveOffer(product) && formatSharePrice({ price: product.price, offerPrice: null }, currency) !== price
      ? `*Precio:* ${price} (antes ${formatSharePrice({ price: product.price, offerPrice: null }, currency)})`
      : `*Precio:* ${price}`
    : "";
  const urlBlock = url ? `Ver producto: ${url}` : "";

  const head = [header, categoryLine].filter(Boolean).join("\n\n");
  const tail = [priceBlock, urlBlock].filter(Boolean).join("\n\n");
  const available = maxLength - head.length - tail.length - 4;

  if (available <= 0) return `${head}${tail ? `\n\n${tail}` : ""}`.slice(0, maxLength);

  const descriptionRaw = String(product.description || "").trim();
  const specsLines = specificationsToText(product.specifications)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const specsHeader = "*Características:*\n";

  const descriptionBudget = specsLines.length ? Math.min(260, Math.round(available * 0.45)) : available;
  const description = truncateWords(descriptionRaw, Math.max(0, descriptionBudget));

  let specs = "";
  if (specsLines.length) {
    const specsBudget = available - description.length - (description ? 2 : 0) - specsHeader.length;
    if (specsBudget > 40) {
      const selected = [];
      let used = 0;

      for (const line of specsLines) {
        const clipped = truncateWords(line, 110);
        if (used + clipped.length + 1 > specsBudget) break;
        selected.push(clipped);
        used += clipped.length + 1;
      }

      if (selected.length) specs = `${specsHeader}${selected.join("\n")}`;
    }
  }

  const middle = [description, specs].filter(Boolean).join("\n\n");
  return [head, middle, tail].filter(Boolean).join("\n\n").slice(0, maxLength);
}

export function formatSharePrice(product, currency = "$") {
  const amount = getEffectiveUnitPrice(product);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  return `${currency || "$"}${amount.toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildProductShareText(
  product,
  { canShop = false, currency = "$", url = "", category = "" } = {},
) {
  if (!product) return "";

  const blocks = [`*${String(product.name || "Producto").trim()}*`];

  if (category) blocks.push(`Categoría: ${category}`);

  const description = String(product.description || "").trim();
  if (description) blocks.push(truncateDescription(description));

  const specifications = specificationsToText(product.specifications).trim();
  if (specifications) blocks.push(`*Características:*\n${specifications}`);

  // El precio solo se incluye a quien puede verlo en la tienda (usuarios con
  // sesión y comercio habilitado), igual que en la página del producto.
  if (canShop) {
    const price = formatSharePrice(product, currency);
    if (price) {
      const before = hasActiveOffer(product)
        ? formatSharePrice({ price: product.price, offerPrice: null }, currency)
        : "";
      blocks.push(before && before !== price ? `*Precio:* ${price} (antes ${before})` : `*Precio:* ${price}`);
    }
  }

  if (url) blocks.push(`Ver producto: ${url}`);

  return blocks.join("\n\n");
}
