import { useEffect, useState } from "react";
import { reorderStocks } from "@/lib/reorder-stocks";

export interface UseStockOrderResult {
  order: string[];
  moveStock: (fromSymbol: string, toSymbol: string) => void;
}

// Purely cosmetic display-order state (see design.md) - local to
// whichever component owns it (StockGrid), not lifted into
// AllocationPage, and not persisted. `symbols` is expected to be a
// plain slice of the current top-N selection, so it's a fresh array
// every render even when nothing meaningful has changed; comparing by
// a sorted, joined key (rather than by reference, or by order) means
// the custom arrangement only resets when the actual set of stocks on
// screen changes - a new N - not on every unrelated re-render.
export function useStockOrder(symbols: string[]): UseStockOrderResult {
  const [order, setOrder] = useState(symbols);
  const membershipKey = [...symbols].sort().join("|");

  useEffect(() => {
    setOrder(symbols);
    // Only the membership key matters here - see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipKey]);

  function moveStock(fromSymbol: string, toSymbol: string) {
    setOrder((current) => reorderStocks(current, fromSymbol, toSymbol));
  }

  return { order, moveStock };
}
