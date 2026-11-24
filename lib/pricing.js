/**
 * Precio efectivo único para todo el sitio.
 *
 * El panel permite guardar `offer_price = 0` (o `null` en datos antiguos) como
 * "sin oferta". Tratar ese 0 como un precio real mostraba $0.00 y dejaba el
 * subtotal, el IVA y el total de la orden en cero.
 *
 * Esta regla la usan: tarjetas, PDP, carrito, navbar, filtros, inventario,
 * resumen de pedido y asistente de IA.
 */
export function hasActiveOffer(product) {
  if (!product) return false;
  const price = Number(product.price);
  const rawOffer = product.offerPrice ?? product.offer_price;

  if (rawOffer === null || rawOffer === undefined || rawOffer === "") return false;

  const offer = Number(rawOffer);
  return Number.isFinite(price) && price > 0 && Number.isFinite(offer) && offer > 0 && offer < price;
}

export function getEffectiveUnitPrice(product) {
  if (!product) return 0;
  const price = Number(product.price);
  const normalPrice = Number.isFinite(price) && price > 0 ? price : 0;
  return hasActiveOffer(product) ? Number(product.offerPrice ?? product.offer_price) : normalPrice;
}

export function getDiscountedPrice(product) {
  return hasActiveOffer(product) ? Number(product.offerPrice ?? product.offer_price) : null;
}
