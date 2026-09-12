import { StockCard } from "@/components/StockCard";
import type { FractionalSettings, SourceStock } from "@/lib/allocate";
import { resolveFractionalAllowed } from "@/lib/rounding";

export interface StockGridProps {
  /** Already sliced to the top N stocks - StockGrid doesn't do its own
   * selection, it just renders what it's given. */
  stocks: SourceStock[];
  n: number;
  fractional: FractionalSettings;
  onFractionalOverrideChange: (symbol: string, allowed: boolean) => void;
}

// The right pane: intro copy, a "showing top N stocks" line, and a
// StockCard per stock. AllocationPage (section 5) owns all of the state
// this renders - StockGrid is presentation only, same as
// AllocationControls on the left.
export function StockGrid({
  stocks,
  n,
  fractional,
  onFractionalOverrideChange,
}: StockGridProps) {
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
          />
        ))}
      </div>
    </div>
  );
}
