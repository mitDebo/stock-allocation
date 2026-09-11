import { describe, it, expect, vi } from "vitest";
import { getCompanyProfile } from "../../scripts/lib/get-company-profile.js";

function fakeFetchResponse(body) {
  return { json: async () => body };
}

describe("getCompanyProfile", () => {
  it("returns the parsed profile when Finnhub has data for the symbol", async () => {
    const profile = {
      country: "US",
      currency: "USD",
      exchange: "NASDAQ",
      finnhubIndustry: "Technology",
      ipo: "1999-04-12",
      logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAA.png",
      marketCapitalization: 3_100_000_000,
      name: "Aaa Corp",
      phone: "1.555.123.4567",
      shareOutstanding: 310_000_000,
      ticker: "AAA",
      weburl: "https://www.aaacorp.example",
    };
    const fetchImpl = vi.fn(async () => fakeFetchResponse(profile));

    const result = await getCompanyProfile("AAA", { apiKey: "test-key", fetchImpl });

    expect(result).toEqual(profile);
    // Confirms we're hitting the documented free-tier endpoint with the
    // right symbol/token, not just that *some* fetch happened.
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://finnhub.io/api/v1/stock/profile2?symbol=AAA&token=test-key",
    );
  });

  it("returns null when Finnhub has no profile data for the symbol", async () => {
    // Finnhub signals "no data for this symbol" by returning an empty
    // JSON object, not an HTTP error — this is the real, documented
    // behavior we have to translate into null ourselves.
    const fetchImpl = vi.fn(async () => fakeFetchResponse({}));

    const result = await getCompanyProfile("BBB", { apiKey: "test-key", fetchImpl });

    expect(result).toBeNull();
  });
});
