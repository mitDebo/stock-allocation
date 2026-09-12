import { StockCard } from "@/components/StockCard";
import type { AllocationResult, FractionalSettings, SourceStock } from "@/lib/allocate";
import { resolveFractionalAllowed } from "@/lib/rounding";

export interface StockGridProps {
  /** Already sliced to the top N stocks - StockGrid doesn't do its own
   * selection, it just renders what it's given. */
  stocks: SourceStock[];
  n: number;
  fractional: FractionalSettings;
  onFractionalOverrideChange: (symbol: string, allowed: boolean) => void;
  /** Present once Allocate has been clicked - null/undefined means every
   * card renders its pre-allocation view. */
  results?: AllocationResult | null;
  boughtSymbols?: string[];
  onBoughtChange?: (symbol: string, bought: boolean) => void;
}

// The right pane: intro copy, a "showing top N stocks" line, and a
// StockCard per stock. AllocationPage owns all of the state this
// renders - StockGrid is presentation only, same as AllocationControls
// on the left. It matches each stock up with its own result (by symbol)
// and bought state, so StockCard never has to think about the list as a
// whole.
export function StockGrid({
  stocks,
  n,
  fractional,
  onFractionalOverrideChange,
  results,
  boughtSymbols,
  onBoughtChange,
}: StockGridProps) {
  const resultsBySymbol = new Map(results?.perStock.map((r) => [r.symbol, r]) ?? []);
  const boughtSet = new Set(boughtSymbols ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Your stocks</h2>
        <p className="text-sm text-muted-foreground">
          Showing the top {n} stocks from the synced list. Adjust the
          controls on the left, then click Allocate to see your buy list.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => (
          <StockCard
            key={stock.symbol}
            stock={stock}
            fractionalAllowed={resolveFractionalAllowed(stock.symbol, fractional)}
            onFractionalAllowedChange={(allowed) =>
              onFractionalOverrideChange(stock.symbol, allowed)
            }
            result={resultsBySymbol.get(stock.symbol)}
            bought={boughtSet.has(stock.symbol)}
            onBoughtChange={(bought) => onBoughtChange?.(stock.symbol, bought)}
          />
        ))}
      </div>
    </div>
  );
}
