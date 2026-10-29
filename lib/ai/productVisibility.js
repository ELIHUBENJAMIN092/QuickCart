export function toPublicProduct(product, canViewCommerce) {
  const { searchText, ...publicProduct } = product;
  return {
    ...publicProduct,
    price: canViewCommerce ? product.price : null,
    regularPrice: canViewCommerce ? product.regularPrice : null,
    stock: canViewCommerce ? product.stock : null,
    inStock: canViewCommerce ? product.inStock : null,
    priceHidden: !canViewCommerce,
  };
}

export function toPromptProduct(product) {
  return {
    id: product.id,
    nombre: product.name,
    categoria: product.categoryName,
    subcategoria: product.subcategoryName || undefined,
    descripcion: product.description || undefined,
    precio: product.priceHidden ? null : product.price,
    precio_regular: product.priceHidden ? null : product.regularPrice,
    stock: product.priceHidden ? null : product.stock,
    oferta: product.isOffer || undefined,
    nuevo: product.isNew || undefined,
    disponible: product.priceHidden ? null : product.inStock,
    nota_precio: product.priceHidden ? "Solo visible con sesión iniciada." : undefined,
    url: `/product/${product.id}`,
  };
}
