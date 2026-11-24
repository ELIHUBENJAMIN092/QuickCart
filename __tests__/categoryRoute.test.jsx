const { renderToStaticMarkup } = require("react-dom/server");

let mockParams = { slug: ["rfid", "lectores-rfid"] };
let mockContext = {};
const mockNotFound = jest.fn(() => {
  throw new Error("NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
  notFound: () => mockNotFound(),
}));

jest.mock("@/assets/assets", () => ({ assets: {} }));

jest.mock("@/context/AppContext", () => ({
  useAppContext: () => mockContext,
}));

jest.mock("@/components/ProductCard", () => () => <div>producto</div>);
jest.mock("@/components/BrandLogos", () => () => <div>marcas</div>);
jest.mock("@/components/CategoryHero", () => ({ category, subcategory }) => (
  <h1>{subcategory?.name || category.name}</h1>
));
jest.mock("@/components/Loading", () => () => <div>cargando</div>);
jest.mock("@/components/ui/Container", () => ({ children }) => <div>{children}</div>);

const CategoryPage = require("../app/(shop)/categoria/[...slug]/page").default;
const { applyCategories } = require("../lib/categories");

describe("rutas de categoría", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockParams = { slug: ["rfid", "lectores-rfid"] };
    applyCategories([{
      slug: "rfid",
      name: "RFID",
      description: "Soluciones RFID",
      subcategories: [{ name: "Lectores RFID", slug: "lectores-rfid" }],
    }]);
    mockContext = {
      products: [{ _id: "p1", name: "Lector", category: "rfid", subcategory: "lectores-rfid" }],
      categoriesLoaded: true,
      categoriesVersion: 1,
    };
  });

  test("espera a que lleguen las categorías antes de validar una subcategoría personalizada", () => {
    mockContext.categoriesLoaded = false;
    const markup = renderToStaticMarkup(<CategoryPage />);
    expect(markup).toContain("cargando");
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  test("renderiza una subcategoría personalizada recibida desde la API", () => {
    const markup = renderToStaticMarkup(<CategoryPage />);
    expect(markup).toContain("Lectores RFID");
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  test("muestra 404 cuando la subcategoría no existe después de cargar categorías", () => {
    mockParams = { slug: ["rfid", "no-existe"] };
    expect(() => renderToStaticMarkup(<CategoryPage />)).toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
