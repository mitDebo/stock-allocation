import { useState } from "react";

import { AllocationControls } from "@/components/AllocationControls";
import { StockGrid } from "@/components/StockGrid";
import { allocate } from "@/lib/allocate";
import type {
  AllocationResult,
  CashHandlingStrategy,
  FractionalSettings,
  SourceStock,
  WeightingModel,
} from "@/lib/allocate";
import { selectTopN } from "@/lib/select-top-n";

export interface AllocationPageProps {
  /** The full synced list, already in the source site's rank order -
   * AllocationPage slices it down to the top N for display/allocation. */
  stocks: SourceStock[];
}

const DEFAULT_DOLLAR_AMOUNT = 1000;
const DEFAULT_N = 10;
const DEFAULT_MODEL: WeightingModel = "equal";
const DEFAULT_GLOBAL_FRACTIONAL_ALLOWED = true;
const DEFAULT_CASH_HANDLING_STRATEGY: CashHandlingStrategy = "maximizeInvested";

// The only component that holds state (design.md). Renders the two
// panes and wires them together: left-pane changes update state and
// (per design.md's rule) immediately clear any existing results and
// bought checklist; Allocate runs the calculation engine. Every page
// load starts completely fresh from these same defaults - nothing here
// is persisted anywhere (see design.md's "no persistence" decision).
export function AllocationPage({ stocks }: AllocationPageProps) {
  const [dollarAmount, setDollarAmount] = useState(DEFAULT_DOLLAR_AMOUNT);
  const [n, setN] = useState(Math.min(DEFAULT_N, stocks.length));
  const [model, setModel] = useState<WeightingModel>(DEFAULT_MODEL);
  const [globalFractionalAllowed, setGlobalFractionalAllowed] = useState(
    DEFAULT_GLOBAL_FRACTIONAL_ALLOWED,
  );
  const [perStockOverrides, setPerStockOverrides] = useState<Record<string, boolean>>({});
  const [cashHandlingStrategy, setCashHandlingStrategy] = useState<CashHandlingStrategy>(
    DEFAULT_CASH_HANDLING_STRATEGY,
  );
  const [results, setResults] = useState<AllocationResult | null>(null);
  const [boughtSymbols, setBoughtSymbols] = useState<string[]>([]);

  const fractional: FractionalSettings = {
    globalFractionalAllowed,
    perStockOverrides,
  };

  // Any left-pane input, once results exist, invalidates them - the
  // existing results no longer match the (about to change) inputs that
  // would produce them. Cleared directly in each handler below, not a
  // separate effect.
  function clearResults() {
    setResults(null);
    setBoughtSymbols([]);
  }

  function handleDollarAmountChange(value: number) {
    setDollarAmount(value);
    clearResults();
  }

  function handleNChange(value: number) {
    setN(value);
    clearResults();
  }

  function handleModelChange(value: WeightingModel) {
    setModel(value);
    clearResults();
  }

  // The global toggle always controls every card - flipping it wipes out
  // any per-stock overrides so every card snaps back to matching it,
  // rather than leaving a previously-overridden card stuck (see
  // design.md's "global fractional-shares toggle always overwrites every
  // per-stock override" decision).
  function handleGlobalFractionalAllowedChange(value: boolean) {
    setGlobalFractionalAllowed(value);
    setPerStockOverrides({});
    clearResults();
  }

  function handleCashHandlingStrategyChange(value: CashHandlingStrategy) {
    setCashHandlingStrategy(value);
    clearResults();
  }

  function handleFractionalOverrideChange(symbol: string, allowed: boolean) {
    setPerStockOverrides((prev) => ({ ...prev, [symbol]: allowed }));
  }

  function handleAllocate() {
    const result = allocate({
      stocks,
      n,
      dollarAmount,
      model,
      fractional,
      cashHandlingStrategy,
    });

    setResults(result);
    setBoughtSymbols([]);
  }

  function handleBoughtChange(symbol: string, bought: boolean) {
    const nextBoughtSymbols = bought
      ? Array.from(new Set([...boughtSymbols, symbol]))
      : boughtSymbols.filter((s) => s !== symbol);

    setBoughtSymbols(nextBoughtSymbols);
  }

  const topNStocks = selectTopN(stocks, n);

  return (
    <div className="flex h-screen">
      <div className="w-1/4 min-w-64 border-r border-border p-8">
        <h1 className="mb-6 text-2xl font-semibold">Stock Allocation</h1>
        <AllocationControls
          dollarAmount={dollarAmount}
          onDollarAmountChange={handleDollarAmountChange}
          n={n}
          maxN={stocks.length}
          onNChange={handleNChange}
          model={model}
          onModelChange={handleModelChange}
          globalFractionalAllowed={globalFractionalAllowed}
          onGlobalFractionalAllowedChange={handleGlobalFractionalAllowedChange}
          cashHandlingStrategy={cashHandlingStrategy}
          onCashHandlingStrategyChange={handleCashHandlingStrategyChange}
          onAllocate={handleAllocate}
        />
      </div>
      <div className="w-3/4 overflow-y-auto p-8">
        <StockGrid
          stocks={topNStocks}
          n={n}
          fractional={fractional}
          onFractionalOverrideChange={handleFractionalOverrideChange}
          results={results}
          boughtSymbols={boughtSymbols}
          onBoughtChange={handleBoughtChange}
        />
      </div>
    </div>
  );
}
