import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateStockData } from "../../scripts/generate-stock-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fixture mirrors the real page's markup shape (stocks.jseeeweaver.cc): a
// single-cell layout table first, then the real data table with the same
// 13 columns in the same order, same link-wrapped Symbol/slope cells.
const fixtureHtml = readFileSync(
  path.join(__dirname, "../fixtures/stocks-list.html"),
  "utf-8",
);

// Fake company-profile lookup, standing in for the real Finnhub
// /stock/profile2 call — keeps this test fast/deterministic and focused
// on parse+enrich wiring, not network behavior. We capture the whole
// profile response (not just market cap), since the other fields it
// returns for free in the same call. BBB has no profile available,
// matching the real possibility that Finnhub has no data for a symbol.
const companyProfiles = {
  AAA: {
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
  },
  CCC: {
    country: "US",
    currency: "USD",
    exchange: "NYSE",
    finnhubIndustry: "Industrials",
    ipo: "2005-11-03",
    logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/CCC.png",
    marketCapitalization: 850_000_000,
    name: "Ccc Industries",
    phone: "1.555.987.6543",
    shareOutstanding: 17_000_000,
    ticker: "CCC",
    weburl: "https://www.cccindustries.example",
  },
};
async function fakeGetCompanyProfile(symbol) {
  return companyProfiles[symbol] ?? null;
}

describe("generateStockData (integration)", () => {
  it("parses the source HTML and enriches every stock with its Finnhub company profile", async () => {
    const result = await generateStockData({
      html: fixtureHtml,
      getCompanyProfile: fakeGetCompanyProfile,
    });

    expect(result).toEqual([
      {
        symbol: "AAA",
        lowerBoundSlope: 0.30,
        normalizedSlope: 0.35,
        r2: 0.75,
        percentGrowth: 20.1,
        first: 10.00,
        last: 12.00,
        min: 9.50,
        avg: 11.00,
        max: 13.00,
        periodStart: "2026-08-01",
        periodStop: "2026-09-01",
        investorGrade: 25,
        profile: companyProfiles.AAA,
      },
      {
        symbol: "BBB",
        lowerBoundSlope: 0.22,
        normalizedSlope: 0.28,
        r2: 0.60,
        percentGrowth: 14.4,
        first: 5.00,
        last: 5.72,
        min: 4.80,
        avg: 5.30,
        max: 5.90,
        periodStart: "2026-08-01",
        periodStop: "2026-09-01",
        investorGrade: 21,
        profile: null,
      },
      {
        symbol: "CCC",
        lowerBoundSlope: 0.15,
        normalizedSlope: 0.18,
        r2: 0.55,
        percentGrowth: 9.7,
        first: 50.00,
        last: 54.85,
        min: 48.20,
        avg: 52.10,
        max: 56.00,
        periodStart: "2026-08-01",
        periodStop: "2026-09-01",
        investorGrade: 20,
        profile: companyProfiles.CCC,
      },
    ]);
  });

  it("preserves the source's existing rank order rather than re-sorting", async () => {
    const result = await generateStockData({
      html: fixtureHtml,
      getCompanyProfile: fakeGetCompanyProfile,
    });

    expect(result.map((stock) => stock.symbol)).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("fails loudly end-to-end when the source HTML is malformed, rather than producing partial data", async () => {
    const malformedHtml = "<html><body><p>stocks.jseeeweaver.cc is down or changed shape.</p></body></html>";

    await expect(
      generateStockData({ html: malformedHtml, getCompanyProfile: fakeGetCompanyProfile }),
    ).rejects.toThrow(/expected a second <table>/);
  });
});
