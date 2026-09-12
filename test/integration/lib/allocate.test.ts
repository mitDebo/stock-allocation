import { describe, expect, it } from "vitest";
import { allocate, type SourceStock } from "../../../src/lib/allocate";

// Four stocks in the synced list's existing rank order (index 0 = top
// rank). DDD is deliberately ranked last so tests can confirm it gets
// dropped once N < 4. lowerBoundSlope and marketCapitalization are
// chosen so the rank-weight and market-cap-weight models produce
// different numbers from each other (and from equal-weight) - a test
// that accidentally wired the wrong stat into the wrong model would
// still fail even though both models divide the same way.
const STOCKS: SourceStock[] = [
  stock({ symbol: "AAA", last: 10, lowerBoundSlope: 0.6, marketCap: 500 }),
  stock({ symbol: "BBB", last: 20, lowerBoundSlope: 0.25, marketCap: 300 }),
  stock({ symbol: "CCC", last: 50, lowerBoundSlope: 0.15, marketCap: 200 }),
  stock({ symbol: "DDD", last: 5, lowerBoundSlope: 0.9, marketCap: 1000 }),
];

function stock({
  symbol,
  last,
  lowerBoundSlope,
  marketCap,
}: {
  symbol: string;
  last: number;
  lowerBoundSlope: number;
  marketCap: number;
}): SourceStock {
  return {
    symbol,
    lowerBoundSlope,
    normalizedSlope: lowerBoundSlope,
    r2: 0.9,
    percentGrowth: 10,
    first: last,
    last,
    min: last,
    avg: last,
    max: last,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 50,
    profile: { marketCapitalization: marketCap },
  };
}

describe("allocate (integration)", () => {
  // Fractional shares on and N=3 keep this test focused on "do the
  // three models and top-N selection wire together correctly" -
  // whole-share rounding and the cash-handling strategies get their own
  // dedicated unit tests (section 1.7-1.11), not exercised here.
  const baseOptions = {
    stocks: STOCKS,
    n: 3,
    dollarAmount: 300,
    fractional: { globalFractionalAllowed: true },
    cashHandlingStrategy: "simple" as const,
  };

  it("equal weight: splits evenly across the top N, drops the 4th stock", () => {
    const result = allocate({ ...baseOptions, model: "equal" });

    expect(result.perStock.map((s) => s.symbol)).toEqual(["AAA", "BBB", "CCC"]);
    expect(result.perStock).toEqual([
      expect.objectContaining({ symbol: "AAA", dollarTarget: 100, shares: 10 }),
      expect.objectContaining({ symbol: "BBB", dollarTarget: 100, shares: 5 }),
      expect.objectContaining({ symbol: "CCC", dollarTarget: 100, shares: 2 }),
    ]);
    expect(result.leftoverCash).toBe(0);
  });

  it("market-cap weight: proportional to market cap among the top N", () => {
    const result = allocate({ ...baseOptions, model: "marketCap" });

    // Combined market cap of AAA/BBB/CCC (DDD excluded by N=3) is 1000.
    expect(result.perStock).toEqual([
      expect.objectContaining({ symbol: "AAA", dollarTarget: 150, shares: 15 }),
      expect.objectContaining({ symbol: "BBB", dollarTarget: 90, shares: 4.5 }),
      expect.objectContaining({ symbol: "CCC", dollarTarget: 60, shares: 1.2 }),
    ]);
    expect(result.leftoverCash).toBe(0);
  });

  it("rank weight: proportional to lower-bound-slope among the top N", () => {
    const result = allocate({ ...baseOptions, model: "rank" });

    // Combined lowerBoundSlope of AAA/BBB/CCC (DDD excluded by N=3) is 1.0.
    expect(result.perStock).toEqual([
      expect.objectContaining({ symbol: "AAA", dollarTarget: 180, shares: 18 }),
      expect.objectContaining({ symbol: "BBB", dollarTarget: 75, shares: 3.75 }),
      expect.objectContaining({ symbol: "CCC", dollarTarget: 45, shares: 0.9 }),
    ]);
    expect(result.leftoverCash).toBe(0);
  });
});
