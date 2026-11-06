import {
  describeReferrer,
  describeUserAgent,
  getClientIp,
  isLikelyBot,
  isValidIp,
} from "../lib/visits";

function requestWith(headers: Record<string, string>) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return { headers: { get: (name: string) => normalized[name.toLowerCase()] ?? null } };
}

describe("visits helpers", () => {
  test("getClientIp uses the first forwarded address", () => {
    expect(
      getClientIp(requestWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))
    ).toBe("203.0.113.7");
  });

  test("getClientIp removes the IPv4-mapped prefix", () => {
    expect(getClientIp(requestWith({ "x-forwarded-for": "::ffff:198.51.100.4" }))).toBe(
      "198.51.100.4"
    );
  });

  test("getClientIp falls back to cloudflare and returns empty when missing", () => {
    expect(getClientIp(requestWith({ "cf-connecting-ip": "192.0.2.10" }))).toBe("192.0.2.10");
    expect(getClientIp(requestWith({}))).toBe("");
  });

  test("isValidIp accepts IPv4 and IPv6 and rejects invalid values", () => {
    expect(isValidIp("192.168.0.1")).toBe(true);
    expect(isValidIp("255.255.255.255")).toBe(true);
    expect(isValidIp("2001:db8::1")).toBe(true);
    expect(isValidIp("256.1.1.1")).toBe(false);
    expect(isValidIp("not-an-ip")).toBe(false);
    expect(isValidIp("")).toBe(false);
  });

  test("isLikelyBot detects common crawlers", () => {
    expect(isLikelyBot("Googlebot/2.1")).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe(false);
    expect(isLikelyBot("")).toBe(false);
  });

  test("describeUserAgent summarizes browser and system", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      )
    ).toBe("Chrome · macOS");
    expect(describeUserAgent("")).toBe("Desconocido");
  });

  test("describeReferrer shows the hostname or direct traffic", () => {
    expect(describeReferrer("https://www.google.com/search?q=compel")).toBe("google.com");
    expect(describeReferrer("")).toBe("Directo");
    expect(describeReferrer("https://instagram.com/p/123")).toBe("instagram.com");
  });
});
