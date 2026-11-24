import { getCartAmount, getCartCount, getOrderTotals } from "../lib/cart";
import { getEffectiveUnitPrice, hasActiveOffer } from "../lib/pricing";

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

  test("treats offerPrice 0/null/empty as no offer instead of a free product", () => {
    const normal = { price: 25, offerPrice: 0 };
    const legacyNull = { price: 25, offerPrice: null };
    const empty = { price: 25, offerPrice: "" };
    const absent = { price: 25 };
    const realOffer = { price: 25, offerPrice: 18.5 };

    expect(hasActiveOffer(normal)).toBe(false);
    expect(hasActiveOffer(legacyNull)).toBe(false);
    expect(hasActiveOffer(empty)).toBe(false);
    expect(hasActiveOffer(absent)).toBe(false);
    expect(hasActiveOffer(realOffer)).toBe(true);

    expect(getEffectiveUnitPrice(normal)).toBe(25);
    expect(getEffectiveUnitPrice(legacyNull)).toBe(25);
    expect(getEffectiveUnitPrice(empty)).toBe(25);
    expect(getEffectiveUnitPrice(absent)).toBe(25);
    expect(getEffectiveUnitPrice(realOffer)).toBe(18.5);

    const productWithId = { ...normal, _id: "a" };
    expect(getCartAmount({ a: 2 }, [productWithId])).toBe(50);
    expect(getOrderTotals(getCartAmount({ a: 2 }, [productWithId]))).toEqual({
      subtotal: 50,
      tax: 7.5,
      total: 57.5,
    });
  });

  test("rounds the 15 percent tax and total to cents", () => {
    expect(getOrderTotals(12.99)).toEqual({
      subtotal: 12.99,
      tax: 1.95,
      total: 14.94,
    });
  });
});
