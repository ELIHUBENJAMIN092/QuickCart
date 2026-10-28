export function hideProductPrices(product) {
  const { price, offerPrice, offer_price, ...productDetails } = product;
  return productDetails;
}
