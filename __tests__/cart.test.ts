import { getCartAmount, getCartCount, getOrderTotals } from "../lib/cart";

describe("cart calculations", () => {
  test("counts only positive quantities", () => {
    expect(getCartCount({ first: 2, second: 0, third: -1 })).toBe(2);
  });

  test("uses offer prices and ignores products missing from the catalog", () => {
    const products = [
      { _id: "first", price: 10, offerPrice: 8.25 },
      { _id: "second", price: 2 },
    ];

    expect(getCartAmount({ first: 2, second: 3, missing: 1 }, products)).toBe(22.5);
  });

  test("rounds the 15 percent tax and total to cents", () => {
    expect(getOrderTotals(12.99)).toEqual({
      subtotal: 12.99,
      tax: 1.95,
      total: 14.94,
    });
  });
});
