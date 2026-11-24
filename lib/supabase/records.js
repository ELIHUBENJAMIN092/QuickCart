const MEDIA_BUCKET = "product-media";

// Algunos registros antiguos guardaron rutas del bucket en vez de la URL pública.
function toPublicMediaUrl(value) {
  if (!value) return value;
  const text = String(value).trim();
  if (!text || /^(https?:\/\/|\/)/i.test(text)) return text;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return text;
  const path = text.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

export function mapProduct(product) {
  if (!product) return null;

  return {
    ...product,
    _id: product.id,
    userId: product.user_id,
    offerPrice: Number(product.offer_price),
    image: (product.image_urls || []).map(toPublicMediaUrl),
    video: toPublicMediaUrl(product.video),
    catalog_pdf: toPublicMediaUrl(product.catalog_pdf),
    brand_logo: toPublicMediaUrl(product.brand_logo),
    date: new Date(product.created_at).getTime(),
  };
}

export function mapOrder(order) {
  if (!order) return null;

  return {
    ...order,
    _id: order.id,
    userId: order.user_id,
    isPaid: order.is_paid,
    date: order.created_at,
    items: (order.order_items || []).map((item) => ({
      product: item.product_id
        ? {
            _id: item.product_id,
            name: item.product_name,
            image: item.product_image ? [item.product_image] : [],
            price: Number(item.unit_price),
            offerPrice: Number(item.unit_price),
          }
        : null,
      quantity: item.quantity,
    })),
  };
}
