import { describe, expect, it } from "vitest";
import { selectTopN } from "../../../src/lib/select-top-n";
import type { SourceStock } from "../../../src/lib/allocate";

function stock(symbol: string): SourceStock {
  return {
    symbol,
    lowerBoundSlope: 0.5,
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
    profile: null,
  };
}

// Already in the synced list's rank order - index 0 is the top-ranked
// stock. selectTopN must not re-sort, only slice.
const STOCKS = [stock("AAA"), stock("BBB"), stock("CCC"), stock("DDD")];

describe("selectTopN", () => {
  it("returns only the first N stocks, in their existing order, when N is below the full list size", () => {
    expect(selectTopN(STOCKS, 2).map((s) => s.symbol)).toEqual(["AAA", "BBB"]);
  });

  it("returns the full list, in order, when N equals the full list size", () => {
    expect(selectTopN(STOCKS, STOCKS.length).map((s) => s.symbol)).toEqual([
      "AAA",
      "BBB",
      "CCC",
      "DDD",
    ]);
  });
});
