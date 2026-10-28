import { hideProductPrices } from "../lib/productVisibility";

describe("product visibility", () => {
  test("removes price fields while preserving product details", () => {
    expect(hideProductPrices({
      _id: "product",
      name: "Reader",
      price: 100,
      offerPrice: 90,
      offer_price: 90,
    })).toEqual({
      _id: "product",
      name: "Reader",
    });
  });
});
