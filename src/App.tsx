import { useState } from "react";

import { AllocationControls } from "@/components/AllocationControls";
import { StockGrid } from "@/components/StockGrid";
import type {
  CashHandlingStrategy,
  FractionalSettings,
  SourceStock,
  WeightingModel,
} from "@/lib/allocate";

// Visual checkpoint only (tasks.md 3.7 and 4.3) - this is NOT
// AllocationPage's real state wiring, that's section 5. Just enough
// local state, and a handful of made-up stocks, so the controls and
// the grid are interactive to look at and tweak in the browser. Real
// synced-list data isn't wired up until later.
const SAMPLE_STOCKS: SourceStock[] = [
  {
    symbol: "AAPL",
    lowerBoundSlope: 0.62,
    normalizedSlope: 0.58,
    r2: 0.91,
    percentGrowth: 12.4,
    first: 180,
    last: 202.15,
    min: 175,
    avg: 190,
    max: 205,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 88,
    profile: { marketCapitalization: 3_100_000_000_000 },
  },
  {
    symbol: "MSFT",
    lowerBoundSlope: 0.45,
    normalizedSlope: 0.4,
    r2: 0.87,
    percentGrowth: 6.1,
    first: 410,
    last: 435.02,
    min: 400,
    avg: 420,
    max: 440,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 82,
    profile: { marketCapitalization: 3_300_000_000_000 },
  },
  {
    symbol: "PLTR",
    lowerBoundSlope: 0.9,
    normalizedSlope: 0.95,
    r2: 0.78,
    percentGrowth: -3.8,
    first: 30,
    last: 28.86,
    min: 27,
    avg: 29,
    max: 32,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 61,
    profile: null,
  },
];

function App() {
  const [dollarAmount, setDollarAmount] = useState(1000);
  const [n, setN] = useState(SAMPLE_STOCKS.length);
  const [model, setModel] = useState<WeightingModel>("equal");
  const [globalFractionalAllowed, setGlobalFractionalAllowed] = useState(true);
  const [cashHandlingStrategy, setCashHandlingStrategy] =
    useState<CashHandlingStrategy>("maximizeInvested");
  const [perStockOverrides, setPerStockOverrides] = useState<Record<string, boolean>>({});

  const fractional: FractionalSettings = {
    globalFractionalAllowed,
    perStockOverrides,
  };

  // The global toggle always controls every card - flipping it wipes
  // out any per-stock overrides so every card snaps back to matching
  // it, rather than leaving a previously-overridden card stuck. See
  // design.md's "global fractional-shares toggle always overwrites
  // every per-stock override" decision.
  function handleGlobalFractionalAllowedChange(value: boolean) {
    setGlobalFractionalAllowed(value);
    setPerStockOverrides({});
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 min-w-64 border-r border-border p-8">
        <h1 className="mb-6 text-2xl font-semibold">Stock Allocation</h1>
        <AllocationControls
          dollarAmount={dollarAmount}
          onDollarAmountChange={setDollarAmount}
          n={n}
          maxN={SAMPLE_STOCKS.length}
          onNChange={setN}
          model={model}
          onModelChange={setModel}
          globalFractionalAllowed={globalFractionalAllowed}
          onGlobalFractionalAllowedChange={handleGlobalFractionalAllowedChange}
          cashHandlingStrategy={cashHandlingStrategy}
          onCashHandlingStrategyChange={setCashHandlingStrategy}
          onAllocate={(values) => console.log("allocate", values)}
        />
      </div>
      <div className="w-3/4 overflow-y-auto p-8">
        <StockGrid
          stocks={SAMPLE_STOCKS.slice(0, n)}
          n={n}
          fractional={fractional}
          onFractionalOverrideChange={(symbol, allowed) =>
            setPerStockOverrides((prev) => ({ ...prev, [symbol]: allowed }))
          }
        />
      </div>
    </div>
  );
}

export default App;
