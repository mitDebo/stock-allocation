import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseStockList } from "../../scripts/lib/parse-stock-list.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixtureHtml = readFileSync(
  path.join(__dirname, "../fixtures/stocks-list.html"),
  "utf-8",
);

describe("parseStockList", () => {
  it("parses each row of the data table into a stock object with the expected fields and types", () => {
    const result = parseStockList(fixtureHtml);

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
      },
    ]);
  });

  it("parses the numeric columns as numbers, not strings", () => {
    const [first] = parseStockList(fixtureHtml);

    expect(typeof first.lowerBoundSlope).toBe("number");
    expect(typeof first.investorGrade).toBe("number");
    // Period dates stay strings (YYYY-MM-DD) — nothing needs them as Date
    // objects, and a string round-trips through JSON without surprises.
    expect(typeof first.periodStart).toBe("string");
  });

  it("throws when the source page has no second table (the data grid is missing)", () => {
    const noTablesAtAll = "<html><body><p>Nothing here.</p></body></html>";
    const onlyOneTable = "<html><body><table><tr><td>Just page layout, no data table.</td></tr></table></body></html>";

    expect(() => parseStockList(noTablesAtAll)).toThrow(/expected a second <table>/);
    expect(() => parseStockList(onlyOneTable)).toThrow(/expected a second <table>/);
    // Also covers the literal "empty source response" case from the spec.
    expect(() => parseStockList("")).toThrow(/expected a second <table>/);
  });

  it("throws when the data table exists but has no rows besides the header", () => {
    const headerOnly = `
      <html><body>
        <table><tr><td>Page layout.</td></tr></table>
        <table>
          <tr><th>Symbol</th><th>Lower-bound<br>Normalized<br>Slope<br>(95% Confidence)</th><th>Normalized<br>Slope</th><th>R<sup>2</sup> Value</th><th>Percent<br>Growth</th><th>First</th><th>Last</th><th>Min</th><th>Avg</th><th>Max</th><th>Period Start</th><th>Period Stop</th><th>Investor Grade</th></tr>
        </table>
      </body></html>
    `;

    expect(() => parseStockList(headerOnly)).toThrow(/no rows besides the header/);
  });

  it("targets the page's second table (the data grid), not the first table (the single-cell page layout wrapper)", () => {
    const html = `
      <html><body>
        <table><tr><td>Some page layout content, not stock data.</td></tr></table>
        <table>
          <tr><th>Symbol</th><th>Lower-bound<br>Normalized<br>Slope<br>(95% Confidence)</th><th>Normalized<br>Slope</th><th>R<sup>2</sup> Value</th><th>Percent<br>Growth</th><th>First</th><th>Last</th><th>Min</th><th>Avg</th><th>Max</th><th>Period Start</th><th>Period Stop</th><th>Investor Grade</th></tr>
          <tr><td><a href="https://robinhood.com/stocks/ZZZ?source=search">ZZZ</a></td><td style="text-align: right;"><b><a href="ZZZ.png" target="_blank">0.10</a></b></td><td style="text-align: right;">0.12</td><td style="text-align: right;">0.50</td><td style="text-align: right;">5.0</td><td style="text-align: right;">1.00</td><td style="text-align: right;">1.05</td><td style="text-align: right;">0.95</td><td style="text-align: right;">1.02</td><td style="text-align: right;">1.10</td><td style="text-align: right;">2026-08-01</td><td style="text-align: right;">2026-09-01</td><td style="text-align: right;">15</td></tr>
        </table>
      </body></html>
    `;

    const result = parseStockList(html);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("ZZZ");
  });
});
