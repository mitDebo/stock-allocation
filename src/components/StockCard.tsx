import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SourceStock } from "@/lib/allocate";

export interface StockCardProps {
  stock: SourceStock;
  /** This stock's resolved fractional-shares setting - already resolved
   * (by whoever renders StockGrid) against any per-stock override, so
   * StockCard itself doesn't need to know about the global default. */
  fractionalAllowed: boolean;
  onFractionalAllowedChange: (allowed: boolean) => void;
}

// One card per stock. Currently only renders the pre-allocation view
// (ticker, price, percent growth, investor grade, and this stock's own
// fractional-shares toggle). The post-allocation view (CardStack plus
// the "mark as bought" checkbox) is added as a conditional branch here
// in section 6, per design.md's "one component, not two" decision -
// almost all of this layout is shared between the two states.
export function StockCard({
  stock,
  fractionalAllowed,
  onFractionalAllowedChange,
}: StockCardProps) {
  const switchId = `fractional-shares-switch-${stock.symbol}`;
  const isPositiveGrowth = stock.percentGrowth >= 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">{stock.symbol}</span>
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
