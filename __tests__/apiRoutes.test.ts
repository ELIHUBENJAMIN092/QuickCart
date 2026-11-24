const UUID = "c62a5272-da79-4558-95ca-12c832c25204";
const OTHER_ID = "8d1c0c9e-2a3b-4c5d-8e7f-1a2b3c4d5e6f";

jest.mock("@/lib/authSeller", () => ({ __esModule: true, default: jest.fn(async () => true) }));
jest.mock("@/lib/categoryServer", () => ({ syncCategories: jest.fn(async () => {}) }));
jest.mock("@/lib/categories", () => ({
  categories: [{ slug: "rfid", subcategories: [] }],
  isLabelPrinterSubcategory: () => false,
  isValidHttpsUrl: () => true,
  printerTypes: [],
}));
jest.mock("@/lib/commerce", () => ({ getCommerceEnabled: jest.fn(async () => true) }));
jest.mock("@/lib/logger", () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));
jest.mock("@/lib/supabase/server", () => ({
  getAuthenticatedSupabase: jest.fn(),
  createSupabasePublicClient: jest.fn(),
}));

interface FakeState {
  filters: Array<[string, unknown]>;
  updateCalled: boolean;
  rpcCalled: boolean;
}

function makeSupabase(options: { row?: unknown; rpcResult?: unknown } = {}) {
  const state: FakeState = { filters: [], updateCalled: false, rpcCalled: false };

  const query: Record<string, any> = {
    select: jest.fn(() => query),
    eq: jest.fn((column: string, value: unknown) => {
      state.filters.push([column, value]);
      return query;
    }),
    maybeSingle: jest.fn(async () => ({ data: options.row ?? null, error: null })),
    single: jest.fn(async () => ({ data: options.row ?? null, error: null })),
    update: jest.fn(() => {
      state.updateCalled = true;
      return query;
    }),
    delete: jest.fn(() => query),
    in: jest.fn(() => query),
    order: jest.fn(() => query),
    range: jest.fn(() => query),
    insert: jest.fn(() => query),
    upsert: jest.fn(() => query),
  };

  const supabase = {
    from: jest.fn(() => query),
    rpc: jest.fn(async () => {
      state.rpcCalled = true;
      return { data: options.rpcResult ?? { id: UUID }, error: null };
    }),
    auth: { getUser: jest.fn() },
  };

  return { supabase, state };
}

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validAddress = {
  fullName: "Juan Pérez",
  email: "juan@example.com",
  phoneNumber: "0987654321",
  idNumber: "1712345678",
  area: "Av. Amazonas",
  city: "Quito",
  state: "Pichincha",
};

describe("API authorization and validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("a seller cannot update another seller's product", async () => {
    const { supabase, state } = makeSupabase({ row: null });
    const { getAuthenticatedSupabase } = require("@/lib/supabase/server");
    getAuthenticatedSupabase.mockResolvedValue({ supabase, user: { id: "seller-a" } });

    const { PUT } = require("../app/api/product/update/[id]/route");
    const response = await PUT(
      jsonRequest(`/api/product/update/${OTHER_ID}`, {
        name: "Producto",
        description: "Descripción",
        category: "rfid",
        price: 10,
        offerPrice: 0,
        stock: 1,
        imageSlots: [{ keep: "img" }],
      }),
      { params: { id: OTHER_ID } }
    );

    expect(response.status).toBe(404);
    expect(state.filters).toContainEqual(["user_id", "seller-a"]);
    expect(state.updateCalled).toBe(false);
  });

  test("order creation rejects malformed address before calling create_order", async () => {
    const { supabase, state } = makeSupabase();
    const { getAuthenticatedSupabase } = require("@/lib/supabase/server");
    getAuthenticatedSupabase.mockResolvedValue({ supabase, user: { id: "buyer" } });

    const { POST } = require("../app/api/order/create/route");
    const response = await POST(
      jsonRequest("/api/order/create", {
        address: { ...validAddress, email: "correo-invalido" },
        items: [{ product: UUID, quantity: 1 }],
      })
    );

    expect(response.status).toBe(400);
    expect(state.rpcCalled).toBe(false);
  });

  test("a repeated Idempotency-Key returns the existing order", async () => {
    const existing = { id: UUID };
    const { supabase, state } = makeSupabase({ row: existing });
    const { getAuthenticatedSupabase } = require("@/lib/supabase/server");
    getAuthenticatedSupabase.mockResolvedValue({ supabase, user: { id: "buyer" } });

    const { POST } = require("../app/api/order/create/route");
    const response = await POST(
      jsonRequest(
        "/api/order/create",
        { address: validAddress, items: [{ product: UUID, quantity: 1 }] },
        { "idempotency-key": UUID }
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alreadyCreated).toBe(true);
    expect(body.orderId).toBe(UUID);
    expect(state.rpcCalled).toBe(false);
  });

  test("an already paid order cannot be confirmed twice", async () => {
    const { supabase, state } = makeSupabase({ row: { id: UUID, is_paid: true, status: "paid" } });
    const { getAuthenticatedSupabase } = require("@/lib/supabase/server");
    getAuthenticatedSupabase.mockResolvedValue({ supabase, user: { id: "seller-a" } });

    const { PUT } = require("../app/api/order/update-payment/[id]/route");
    const response = await PUT(jsonRequest(`/api/order/update-payment/${UUID}`, {}), {
      params: { id: UUID },
    });

    expect(response.status).toBe(409);
    expect(state.updateCalled).toBe(false);
  });
});
