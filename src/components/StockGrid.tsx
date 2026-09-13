import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { SortableStockCard } from "@/components/SortableStockCard";
import { useStockOrder } from "@/hooks/use-stock-order";
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
// renders (results, bought state, the stocks themselves) - StockGrid is
// presentation only, same as AllocationControls on the left, with one
// exception: the on-screen card order is purely cosmetic display state
// that nothing else in the tree needs, so it lives here via
// useStockOrder rather than being lifted up too (see design.md).
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
  const stocksBySymbol = new Map(stocks.map((stock) => [stock.symbol, stock]));

  const { order, moveStock } = useStockOrder(stocks.map((stock) => stock.symbol));
  const orderedStocks = order
    .map((symbol) => stocksBySymbol.get(symbol))
    .filter((stock): stock is SourceStock => stock !== undefined);

  // A small drag-start threshold, not a bare PointerSensor default: it
  // lets an ordinary click on the handle (or a tap on touch) register
  // normally instead of always being interpreted as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveStock(String(active.id), String(over.id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Your stocks</h2>
        <p className="text-sm text-muted-foreground">
          Showing the top {n} stocks from the synced list. Adjust the
          controls on the left, then click Allocate to see your buy list.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {orderedStocks.map((stock) => (
              <SortableStockCard
                key={stock.symbol}
                id={stock.symbol}
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
        </SortableContext>
      </DndContext>
    </div>
  );
}
