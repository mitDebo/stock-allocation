import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStockOrder } from "../../../src/hooks/use-stock-order";

// The order-reset behavior lives here as a plain hook test rather than
// through StockGrid + a simulated drag: moveStock is just a function
// call, so this exercises the exact same reset logic StockGrid relies
// on without needing jsdom to simulate a real pointer-drag gesture.
describe("useStockOrder", () => {
  it("starts in the given natural order", () => {
    const { result } = renderHook(() => useStockOrder(["AAA", "BBB", "CCC"]));

    expect(result.current.order).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("reorders via moveStock", () => {
    const { result } = renderHook(() => useStockOrder(["AAA", "BBB", "CCC"]));

    act(() => {
      result.current.moveStock("CCC", "AAA");
    });

    expect(result.current.order).toEqual(["CCC", "AAA", "BBB"]);
  });

  it("keeps the custom order across a re-render with the same stocks, even as a brand new array", () => {
    const { result, rerender } = renderHook(
      ({ symbols }: { symbols: string[] }) => useStockOrder(symbols),
      { initialProps: { symbols: ["AAA", "BBB", "CCC"] } },
    );

    act(() => {
      result.current.moveStock("CCC", "AAA");
    });

    // A fresh array, same membership - simulates StockGrid re-rendering
    // with a re-sliced (but unchanged) top-N list, e.g. because the
    // dollar amount or weighting model changed rather than N.
    rerender({ symbols: ["AAA", "BBB", "CCC"] });

    expect(result.current.order).toEqual(["CCC", "AAA", "BBB"]);
  });

  it("resets to the new natural order once the underlying stock list's membership changes", () => {
    const { result, rerender } = renderHook(
      ({ symbols }: { symbols: string[] }) => useStockOrder(symbols),
      { initialProps: { symbols: ["AAA", "BBB", "CCC"] } },
    );

    act(() => {
      result.current.moveStock("CCC", "AAA");
    });

    // N changed, producing a different top-N selection.
    rerender({ symbols: ["AAA", "BBB", "DDD"] });

    expect(result.current.order).toEqual(["AAA", "BBB", "DDD"]);
  });
});
