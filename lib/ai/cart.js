const TAX_RATE = 0.15;
const MAX_ITEMS = 20;
const MAX_QUANTITY = 99;

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Normaliza el carrito que envía el cliente.
 * Acepta { items: [{ id, quantity }] } o el mapa { [id]: quantity } de AppContext.
 */
export function normalizeCart(cart) {
  const raw = Array.isArray(cart?.items)
    ? cart.items
    : cart && typeof cart === "object" && !Array.isArray(cart)
      ? Object.entries(cart).map(([id, quantity]) => ({ id, quantity }))
      : [];

  const merged = new Map();
  for (const item of raw) {
    const id = typeof item?.id === "string" ? item.id.trim() : "";
    const quantity = Number(item?.quantity);
    if (!id || id.length > 64 || !Number.isInteger(quantity) || quantity < 1) continue;

    const total = Math.min(MAX_QUANTITY, (merged.get(id) || 0) + quantity);
    if (!merged.has(id) && merged.size >= MAX_ITEMS) continue;
    merged.set(id, total);
  }

  return [...merged.entries()].map(([id, quantity]) => ({ id, quantity }));
}

/**
 * Resume el carrito contra el catálogo real.
 * Si el usuario no puede ver el comercio, no se incluyen precios ni totales.
 */
export function buildCartSummary(cart, catalog = [], canViewCommerce = false) {
  const items = normalizeCart(cart);
  const byId = new Map((catalog || []).map((product) => [product.id, product]));

  const lines = items.map(({ id, quantity }) => {
    const product = byId.get(id);
    if (!product) {
      return {
        id,
        name: "Producto no disponible",
        quantity,
        unitPrice: null,
        lineTotal: null,
        available: false,
      };
    }

    const unitPrice = canViewCommerce ? Number(product.price) : null;
    return {
      id,
      name: product.name,
      quantity,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
      lineTotal: Number.isFinite(unitPrice) ? round(unitPrice * quantity) : null,
      available: canViewCommerce ? product.inStock !== false : null,
    };
  });

  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = canViewCommerce
    ? round(lines.reduce((total, line) => total + (line.lineTotal || 0), 0))
    : null;
  const tax = subtotal == null ? null : round(subtotal * TAX_RATE);

  return {
    items: lines,
    count,
    subtotal,
    tax,
    total: subtotal == null ? null : round(subtotal + tax),
    priceHidden: !canViewCommerce,
  };
}
