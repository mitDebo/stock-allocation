import { describe, expect, it } from "vitest";
import { equalWeight, marketCapWeight, rankWeight } from "../../../src/lib/weighting-models";
import type { SourceStock } from "../../../src/lib/allocate";

function stock(
  symbol: string,
  marketCap: number | null = null,
  lowerBoundSlope = 0.5,
): SourceStock {
  return {
    symbol,
    lowerBoundSlope,
    normalizedSlope: 0.5,
    r2: 0.9,
    percentGrowth: 10,
    first: 10,
    last: 10,
    min: 10,
    avg: 10,
    max: 10,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 50,
    profile: marketCap == null ? null : { marketCapitalization: marketCap },
  };
}

describe("equalWeight", () => {
  it("splits the dollar amount evenly across every stock", () => {
    const stocks = [stock("AAA"), stock("BBB"), stock("CCC")];

    expect(equalWeight(stocks, 300)).toEqual([
      { symbol: "AAA", dollarTarget: 100 },
      { symbol: "BBB", dollarTarget: 100 },
      { symbol: "CCC", dollarTarget: 100 },
    ]);
  });

  it("splits evenly even when the amount doesn't divide cleanly", () => {
    const stocks = [stock("AAA"), stock("BBB"), stock("CCC")];
    const result = equalWeight(stocks, 100);

    for (const target of result) {
      expect(target.dollarTarget).toBeCloseTo(100 / 3, 10);
    }
  });
});

describe("marketCapWeight", () => {
  it("splits the dollar amount proportional to each stock's market cap", () => {
    const stocks = [stock("AAA", 500), stock("BBB", 300), stock("CCC", 200)];

    const result = marketCapWeight(stocks, 300);

    expect(result[0]).toMatchObject({ symbol: "AAA", dollarTarget: 150 });
    expect(result[1]).toMatchObject({ symbol: "BBB", dollarTarget: 90 });
    expect(result[2]).toMatchObject({ symbol: "CCC", dollarTarget: 60 });
  });

  it("gives a stock with no known market cap a zero target, and recalculates the rest from just the stocks that have it", () => {
    // BBB has no Finnhub profile at all - a lookup gap. Only AAA (500)
    // and CCC (200) count toward the combined market cap (700).
    const stocks = [stock("AAA", 500), stock("BBB", null), stock("CCC", 200)];

    const result = marketCapWeight(stocks, 300);

    expect(result[0].symbol).toBe("AAA");
    expect(result[0].dollarTarget).toBeCloseTo((300 * 500) / 700, 10);
    expect(result[1]).toEqual({ symbol: "BBB", dollarTarget: 0 });
    expect(result[2].symbol).toBe("CCC");
    expect(result[2].dollarTarget).toBeCloseTo((300 * 200) / 700, 10);
  });
});

describe("rankWeight", () => {
  it("splits the dollar amount proportional to each stock's lower-bound-slope statistic", () => {
    const stocks = [
      stock("AAA", null, 0.6),
      stock("BBB", null, 0.25),
      stock("CCC", null, 0.15),
    ];

    const result = rankWeight(stocks, 300);

    expect(result[0]).toMatchObject({ symbol: "AAA", dollarTarget: 180 });
    expect(result[1]).toMatchObject({ symbol: "BBB", dollarTarget: 75 });
    expect(result[2]).toMatchObject({ symbol: "CCC", dollarTarget: 45 });
  });
});

describe("every model's targets sum to the input dollar amount", () => {
  const dollarAmount = 300;

  it("equalWeight", () => {
    const stocks = [stock("AAA"), stock("BBB"), stock("CCC")];
    const total = equalWeight(stocks, dollarAmount).reduce(
      (sum, t) => sum + t.dollarTarget,
      0,
    );
    expect(total).toBeCloseTo(dollarAmount, 10);
  });

  it("marketCapWeight, including when one stock has no known market cap", () => {
    const stocks = [stock("AAA", 500), stock("BBB", null), stock("CCC", 200)];
    const total = marketCapWeight(stocks, dollarAmount).reduce(
      (sum, t) => sum + t.dollarTarget,
      0,
    );
    expect(total).toBeCloseTo(dollarAmount, 10);
  });

  it("rankWeight", () => {
    const stocks = [
      stock("AAA", null, 0.6),
      stock("BBB", null, 0.25),
      stock("CCC", null, 0.15),
    ];
    const total = rankWeight(stocks, dollarAmount).reduce(
      (sum, t) => sum + t.dollarTarget,
      0,
    );
    expect(total).toBeCloseTo(dollarAmount, 10);
  });
});
