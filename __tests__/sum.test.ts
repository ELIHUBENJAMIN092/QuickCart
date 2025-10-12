// __tests__/sum.test.ts
function suma(a: number, b: number) {
  return a + b;
}

test("1 + 2 debe ser 3", () => {
  expect(suma(1, 2)).toBe(3);
});
