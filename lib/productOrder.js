// Ordena los productos según las posiciones guardadas. Los que no tienen posición
// van primero y conservan el orden en que llegaron; el resto sigue su posición.
export function sortByPosition(products, positions = {}) {
  const rank = (product) => {
    const position = positions[product._id ?? product.id];
    return Number.isFinite(position) ? position : null;
  };
  const unpositioned = products.filter((product) => rank(product) === null);
  const positioned = products
    .filter((product) => rank(product) !== null)
    .sort((a, b) => rank(a) - rank(b));
  return [...unpositioned, ...positioned];
}

// Reubica en `fullOrder` solo los ids de `visibleOrder`: ocupan los mismos huecos
// que tenían, pero en el nuevo orden. Sirve para reordenar una lista filtrada.
export function applyVisibleOrder(fullOrder, visibleOrder) {
  const visible = new Set(visibleOrder);
  const queue = [...visibleOrder];
  return fullOrder.map((id) => (visible.has(id) ? queue.shift() : id));
}

export function moveItem(list, index, step) {
  const target = index + step;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export async function loadPositions(supabase) {
  try {
    const { data, error } = await supabase.from("product_positions").select("product_id, position");
    if (error) throw error;
    return Object.fromEntries(data.map((row) => [row.product_id, row.position]));
  } catch {
    return {};
  }
}
