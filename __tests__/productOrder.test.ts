import { applyVisibleOrder, moveItem, sortByPosition } from "../lib/productOrder";

describe("product order", () => {
  test("puts products without a position first and sorts the rest by position", () => {
    const products = [{ _id: "a" }, { _id: "b" }, { _id: "c" }, { _id: "d" }];
    const sorted = sortByPosition(products, { a: 2, c: 1 });
    expect(sorted.map((product) => product._id)).toEqual(["b", "d", "c", "a"]);
  });

  test("keeps the original order when there are no positions", () => {
    const products = [{ _id: "x" }, { _id: "y" }];
    expect(sortByPosition(products, {}).map((product) => product._id)).toEqual(["x", "y"]);
  });

  test("reorders only the visible items inside their original slots", () => {
    expect(applyVisibleOrder(["a", "b", "c", "d", "e"], ["e", "c", "a"])).toEqual(["e", "b", "c", "d", "a"]);
  });

  test("moves an item by one step and ignores moves out of range", () => {
    const list = ["a", "b", "c"];
    expect(moveItem(list, 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 2, 1)).toBe(list);
  });
});
