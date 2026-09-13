import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateStockData } from "../../../scripts/generate-stock-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fixture mirrors the real page's markup shape (stocks.jseeeweaver.cc): a
// single-cell layout table first, then the real data table with the same
// 13 columns in the same order, same link-wrapped Symbol/slope cells.
const fixtureHtml = readFileSync(
  path.join(__dirname, "../../fixtures/stocks-list.html"),
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

// Builds a synthetic page with more rows than the fixture above, matching
// the same markup shape parseStockList expects (layout table, then the
// 13-column data table), so the rate-limiting tests below don't need
// their own giant checked-in fixture file.
function buildStockRow(symbol) {
  return `<tr><td><a href="https://robinhood.com/stocks/${symbol}?source=search">${symbol}</a></td><td style="text-align: right;"><b><a href="${symbol}.png" target="_blank">0.30</a></b></td><td style="text-align: right;">0.35</td><td style="text-align: right;">0.75</td><td style="text-align: right;">20.1</td><td style="text-align: right;">10.00</td><td style="text-align: right;">12.00</td><td style="text-align: right;">9.50</td><td style="text-align: right;">11.00</td><td style="text-align: right;">13.00</td><td style="text-align: right;">2026-08-01</td><td style="text-align: right;">2026-09-01</td><td style="text-align: right;">25</td></tr>`;
}

function buildManyStocksHtml(count) {
  const headerRow =
    "<tr><th>Symbol</th><th>Lower-bound Slope</th><th>Normalized Slope</th>" +
    "<th>R2</th><th>Percent Growth</th><th>First</th><th>Last</th><th>Min</th>" +
    "<th>Avg</th><th>Max</th><th>Period Start</th><th>Period Stop</th><th>Investor Grade</th></tr>";
  const rows = Array.from({ length: count }, (_, i) => buildStockRow(`S${i}`)).join("");
  return `<html><body><table><tr><td>layout wrapper</td></tr></table><table>${headerRow}${rows}</table></body></html>`;
}

// Finnhub's free tier caps requests at 60/minute - but a real CI run
// showed that even a burst of 55 concurrent requests (comfortably under
// that per-minute number) is enough to trip a 429, so the fix isn't
// "batch under 60" - it's "never burst at all". generateStockData
// processes Finnhub lookups strictly one at a time, with a real delay
// between each individual request (see design.md).
describe("generateStockData - Finnhub rate limiting", () => {
  it("delays between every individual Finnhub lookup, never firing more than one at a time", async () => {
    const html = buildManyStocksHtml(5);
    const getCompanyProfile = vi.fn(async () => null);
    const delay = vi.fn(async () => {});

    const result = await generateStockData({ html, getCompanyProfile, delay });

    // 5 stocks processed one at a time means a delay before every
    // lookup after the first - 4 delays, not 0 (no throttling at all)
    // and not 5 (an unnecessary delay before the very first request).
    expect(delay).toHaveBeenCalledTimes(4);
    // ~50 requests/minute - comfortably under Finnhub's 60/minute cap
    // with no burst, unlike the batched approach that just failed in a
    // real CI run.
    expect(delay).toHaveBeenCalledWith(1_200);
    expect(getCompanyProfile).toHaveBeenCalledTimes(5);
    expect(result).toHaveLength(5);
  });

  it("does not delay at all for a single stock", async () => {
    const html = buildManyStocksHtml(1);
    const getCompanyProfile = vi.fn(async () => null);
    const delay = vi.fn(async () => {});

    await generateStockData({ html, getCompanyProfile, delay });

    expect(delay).not.toHaveBeenCalled();
  });
});
