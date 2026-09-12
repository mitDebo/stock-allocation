import { describe, expect, it } from "vitest";
import {
  applyCashHandlingStrategy,
  resolveFractionalAllowed,
  roundStock,
} from "../../../src/lib/rounding";
import type { FractionalSettings } from "../../../src/lib/allocate";

describe("roundStock", () => {
  it("fractional shares allowed: divides exactly, no leftover", () => {
    const result = roundStock({
      symbol: "AAA",
      price: 10,
      dollarTarget: 57.5,
      fractionalAllowed: true,
    });

    expect(result).toMatchObject({
      symbol: "AAA",
      shares: 5.75,
      dollarsInvested: 57.5,
      fractionalAllowed: true,
      leftover: 0,
    });
  });

  it("fractional shares off: floors to a whole share, tracks the remainder as leftover", () => {
    const result = roundStock({
      symbol: "AAA",
      price: 10,
      dollarTarget: 57,
      fractionalAllowed: false,
    });

    expect(result).toMatchObject({
      symbol: "AAA",
      shares: 5,
      dollarsInvested: 50,
      fractionalAllowed: false,
      leftover: 7,
    });
  });

  it("can't-afford-it: a target below one share's price gets 0 shares", () => {
    const result = roundStock({
      symbol: "AAA",
      price: 10,
      dollarTarget: 8,
      fractionalAllowed: false,
    });

    expect(result).toMatchObject({
      symbol: "AAA",
      shares: 0,
      dollarsInvested: 0,
      leftover: 8,
    });
  });
});

describe("resolveFractionalAllowed", () => {
  it("uses the global default when a stock has no override", () => {
    const settings: FractionalSettings = { globalFractionalAllowed: true };
    expect(resolveFractionalAllowed("AAA", settings)).toBe(true);
  });

  it("uses a stock's own override instead of the global default", () => {
    const settings: FractionalSettings = {
      globalFractionalAllowed: true,
      perStockOverrides: { BBB: false },
    };
    expect(resolveFractionalAllowed("AAA", settings)).toBe(true);
    expect(resolveFractionalAllowed("BBB", settings)).toBe(false);
  });
});

describe("applyCashHandlingStrategy", () => {
  it('"simple": reports the combined leftover with no redistribution', () => {
    const roundedStocks = [
      roundStock({ symbol: "AAA", price: 10, dollarTarget: 25, fractionalAllowed: false }),
      roundStock({ symbol: "BBB", price: 8, dollarTarget: 25, fractionalAllowed: false }),
    ];

    const { perStock, leftoverCash } = applyCashHandlingStrategy(roundedStocks, "simple");

    expect(perStock.map((s) => s.shares)).toEqual([2, 3]);
    expect(leftoverCash).toBeCloseTo(6, 10); // 5 leftover from AAA + 1 from BBB
  });

  it('"maximizeInvested": tops up whichever stock is closest to affording another share, using the shared pool', () => {
    // AAA: floor(25/10) = 2 shares, leftover 5. BBB: floor(25/8) = 3
    // shares, leftover 1. Pool = 6. AAA needs only 5 more to afford a
    // 3rd share (closer than BBB's 7), so it goes first; the remaining
    // 1 in the pool can't afford anyone another share, so it's reported
    // as leftover.
    const roundedStocks = [
      roundStock({ symbol: "AAA", price: 10, dollarTarget: 25, fractionalAllowed: false }),
      roundStock({ symbol: "BBB", price: 8, dollarTarget: 25, fractionalAllowed: false }),
    ];

    const { perStock, leftoverCash } = applyCashHandlingStrategy(
      roundedStocks,
      "maximizeInvested",
    );

    const bySymbol = Object.fromEntries(perStock.map((s) => [s.symbol, s]));
    expect(bySymbol.AAA).toMatchObject({ shares: 3, dollarsInvested: 30 });
    expect(bySymbol.BBB).toMatchObject({ shares: 3, dollarsInvested: 24 });
    expect(leftoverCash).toBeCloseTo(1, 10);
  });

  it('"maximizeInvested" has no effect when every stock has fractional shares on', () => {
    const roundedStocks = [
      roundStock({ symbol: "AAA", price: 10, dollarTarget: 25, fractionalAllowed: true }),
      roundStock({ symbol: "BBB", price: 8, dollarTarget: 25, fractionalAllowed: true }),
    ];

    const { perStock, leftoverCash } = applyCashHandlingStrategy(
      roundedStocks,
      "maximizeInvested",
    );

    expect(perStock.map((s) => s.shares)).toEqual([2.5, 3.125]);
    expect(leftoverCash).toBe(0);
  });
});
