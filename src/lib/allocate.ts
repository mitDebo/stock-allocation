import { selectTopN } from "./select-top-n";
import { equalWeight, marketCapWeight, rankWeight } from "./weighting-models";
import { applyCashHandlingStrategy, resolveFractionalAllowed, roundStock } from "./rounding";

// The shape produced by scripts/generate-stock-data.js (see
// src/data/stocks.json at build time) - one entry per stock in the
// synced list's existing rank order.
export interface SourceStock {
  symbol: string;
  lowerBoundSlope: number;
  normalizedSlope: number;
  r2: number;
  percentGrowth: number;
  first: number;
  last: number;
  min: number;
  avg: number;
  max: number;
  periodStart: string;
  periodStop: string;
  investorGrade: number;
  profile: { marketCapitalization: number; [key: string]: unknown } | null;
}

export type WeightingModel = "equal" | "marketCap" | "rank";

export type CashHandlingStrategy = "simple" | "maximizeInvested";

export interface FractionalSettings {
  /** The default applied to every stock unless overridden below. */
  globalFractionalAllowed: boolean;
  /** Per-stock overrides, keyed by symbol. Only present for stocks the
   * user has explicitly overridden away from the global default. */
  perStockOverrides?: Record<string, boolean>;
}

export interface AllocateOptions {
  /** The full synced list, already in rank order - selectTopN slices
   * this down to the N stocks actually used. */
  stocks: SourceStock[];
  n: number;
  dollarAmount: number;
  model: WeightingModel;
  fractional: FractionalSettings;
  cashHandlingStrategy: CashHandlingStrategy;
}

export interface StockAllocationResult {
  symbol: string;
  /** The weighting model's dollar target, before any rounding. */
  dollarTarget: number;
  /** Final share count - a whole number unless fractional shares are
   * allowed for this stock. */
  shares: number;
  /** shares * price - what actually gets invested in this stock. */
  dollarsInvested: number;
  /** Whether fractional shares applied to this stock (global default,
   * resolved against any per-stock override). */
  fractionalAllowed: boolean;
}

export interface AllocationResult {
  perStock: StockAllocationResult[];
  /** Cash left uninvested after the cash-handling strategy ran. Always
   * 0 when every stock in N has fractional shares allowed. */
  leftoverCash: number;
}

/**
 * Turns a dollar amount, an N-stock selection, a weighting model, and
 * fractional-share settings into a per-stock share count and dollar
 * amount. See openspec/changes/allocation-engine/specs for the full
 * behavioral spec this implements. Each step (top-N selection, the
 * weighting models, and rounding/cash-handling) is its own tested
 * module - this function just wires them together in order.
 */
export function allocate(options: AllocateOptions): AllocationResult {
  const { stocks, n, dollarAmount, model, fractional, cashHandlingStrategy } =
    options;

  const topN = selectTopN(stocks, n);

  const weightingModel =
    model === "equal" ? equalWeight : model === "marketCap" ? marketCapWeight : rankWeight;
  const weightedTargets = weightingModel(topN, dollarAmount);

  const priceBySymbol = new Map(topN.map((s) => [s.symbol, s.last]));

  const roundedStocks = weightedTargets.map((target) =>
    roundStock({
      symbol: target.symbol,
      price: priceBySymbol.get(target.symbol)!,
      dollarTarget: target.dollarTarget,
      fractionalAllowed: resolveFractionalAllowed(target.symbol, fractional),
    }),
  );

  const { perStock, leftoverCash } = applyCashHandlingStrategy(
    roundedStocks,
    cashHandlingStrategy,
  );

  return {
    perStock: perStock.map(
      ({ symbol, dollarTarget, shares, dollarsInvested, fractionalAllowed }) => ({
        symbol,
        dollarTarget,
        shares,
        dollarsInvested,
        fractionalAllowed,
      }),
    ),
    leftoverCash,
  };
}
