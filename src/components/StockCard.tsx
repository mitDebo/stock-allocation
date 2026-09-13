import type { ReactNode } from "react";

import { CardStack } from "@/components/CardStack";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SourceStock, StockAllocationResult } from "@/lib/allocate";

export interface StockCardProps {
  stock: SourceStock;
  /** This stock's resolved fractional-shares setting - already resolved
   * (by whoever renders StockGrid) against any per-stock override, so
   * StockCard itself doesn't need to know about the global default. */
  fractionalAllowed: boolean;
  onFractionalAllowedChange: (allowed: boolean) => void;
  /** Present once an allocation has been generated for this stock -
   * switches the card to its post-allocation view. Undefined/absent
   * means "no allocation yet," not "zero shares." */
  result?: StockAllocationResult;
  /** Only meaningful once `result` is present. */
  bought?: boolean;
  onBoughtChange?: (bought: boolean) => void;
  /** An optional drag handle, rendered inline right beside the ticker.
   * StockCard doesn't know or care what it is (SortableStockCard is
   * what actually builds it) - it just needs to render inside the same
   * content CardStack wraps, so it visually rises together with the
   * card during the reveal animation instead of floating separately. */
  dragHandle?: ReactNode;
}

// One card per stock - one component with a conditional (per design.md),
// not two separate components, since almost all of the layout is shared.
// The post-allocation branch wraps its whole content in CardStack, which
// wraps rather than embeds so the card itself never resizes as backing
// cards stack up behind it.
export function StockCard({
  stock,
  fractionalAllowed,
  onFractionalAllowedChange,
  result,
  bought = false,
  onBoughtChange,
  dragHandle,
}: StockCardProps) {
  if (result) {
    return (
      <CardStack shares={result.shares}>
        <div className="flex aspect-square flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-1.5">
              {dragHandle}
              <span className="text-base font-semibold">{stock.symbol}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              ${stock.last.toFixed(2)}
            </span>
          </div>

          <div className="text-sm">
            {formatShares(result.shares)} shares (${result.dollarsInvested.toFixed(2)})
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={bought}
              onChange={(event) => onBoughtChange?.(event.target.checked)}
              aria-label={`Mark ${stock.symbol} as bought`}
            />
            Bought
          </label>
        </div>
      </CardStack>
    );
  }

  const switchId = `fractional-shares-switch-${stock.symbol}`;
  const isPositiveGrowth = stock.percentGrowth >= 0;

  return (
    <div className="flex aspect-square flex-col justify-between gap-3 rounded-2xl border border-border p-4">
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-1.5">
          {dragHandle}
          <span className="text-base font-semibold">{stock.symbol}</span>
        </span>
        <span className="text-sm text-muted-foreground">
          ${stock.last.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={isPositiveGrowth ? "text-emerald-600" : "text-destructive"}>
          {isPositiveGrowth ? "+" : ""}
          {stock.percentGrowth.toFixed(2)}%
        </span>
        <span className="text-muted-foreground">Grade: {stock.investorGrade}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={switchId}>Fractional shares</Label>
        <Switch
          id={switchId}
          aria-label={`Fractional shares for ${stock.symbol}`}
          checked={fractionalAllowed}
          onCheckedChange={(checked) => onFractionalAllowedChange(checked)}
        />
      </div>
    </div>
  );
}

// Whole share counts render as plain integers; fractional ones are
// trimmed to a readable handful of decimal places instead of dumping
// full floating-point precision on the card.
function formatShares(shares: number): string {
  return Number.isInteger(shares) ? String(shares) : shares.toFixed(4);
}
