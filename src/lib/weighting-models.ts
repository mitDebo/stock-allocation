import type { SourceStock } from "./allocate";

export interface WeightedTarget {
  symbol: string;
  dollarTarget: number;
}

/**
 * Every stock gets an identical dollar target (the input amount divided
 * by the stock count). Built first, ahead of the other two models, to
 * prove out the shared interface before adding model-specific
 * complexity (see design.md).
 */
export function equalWeight(
  stocks: SourceStock[],
  dollarAmount: number,
): WeightedTarget[] {
  const target = dollarAmount / stocks.length;
  return stocks.map((s) => ({ symbol: s.symbol, dollarTarget: target }));
}

/**
 * Each stock's dollar target is proportional to its market cap relative
 * to the combined market cap of only the stocks that have one. A stock
 * with no Finnhub profile at all (a lookup gap) gets a dollar target of
 * exactly 0 - it's excluded from the proportion entirely rather than,
 * say, treated as having zero market cap and diluting everyone else.
 */
export function marketCapWeight(
  stocks: SourceStock[],
  dollarAmount: number,
): WeightedTarget[] {
  const totalKnownMarketCap = stocks.reduce(
    (sum, s) => sum + (s.profile?.marketCapitalization ?? 0),
    0,
  );

  return stocks.map((s) => {
    const marketCap = s.profile?.marketCapitalization;
    if (marketCap == null) {
      return { symbol: s.symbol, dollarTarget: 0 };
    }
    return {
      symbol: s.symbol,
      dollarTarget: dollarAmount * (marketCap / totalKnownMarketCap),
    };
  });
}

/**
 * Each stock's dollar target is proportional to its lower-bound-slope
 * statistic (already present in the synced list) relative to the sum
 * of that statistic across every stock in N. Unlike market-cap weight,
 * every stock always has this value - it comes from the same source
 * site's ranking, not a separate lookup that can come up empty.
 */
export function rankWeight(
  stocks: SourceStock[],
  dollarAmount: number,
): WeightedTarget[] {
  const totalSlope = stocks.reduce((sum, s) => sum + s.lowerBoundSlope, 0);

  return stocks.map((s) => ({
    symbol: s.symbol,
    dollarTarget: dollarAmount * (s.lowerBoundSlope / totalSlope),
  }));
}
