export function getCartCount(cartItems = {}) {
  return Object.values(cartItems).reduce(
    (total, quantity) => total + (quantity > 0 ? quantity : 0),
    0
  );
}

export function getCartAmount(cartItems = {}, products = []) {
  if (!products.length) return 0;

  let totalAmount = 0;
  for (const [id, quantity] of Object.entries(cartItems)) {
    const product = products.find((item) => item._id === id);
    if (!product || quantity <= 0) continue;

    const price = product.offerPrice !== undefined
      ? product.offerPrice
      : product.price || 0;
    totalAmount += price * quantity;
  }

  return Math.floor(totalAmount * 100) / 100;
}

export function getOrderTotals(subtotal, taxRate = 0.15) {
  const roundedSubtotal = Math.round((Number(subtotal) + Number.EPSILON) * 100) / 100;
  const tax = Math.round((roundedSubtotal * taxRate + Number.EPSILON) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    tax,
    total: roundedSubtotal + tax,
  };
}
