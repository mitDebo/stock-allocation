import { describe, expect, it } from "vitest";
import { reorderStocks } from "../../../src/lib/reorder-stocks";

describe("reorderStocks", () => {
  it("moves a symbol later in the order when dragged onto a symbol further down the list", () => {
    const order = ["AAPL", "MSFT", "GOOG", "AMZN"];

    expect(reorderStocks(order, "AAPL", "GOOG")).toEqual([
      "MSFT",
      "GOOG",
      "AAPL",
      "AMZN",
    ]);
  });

  it("moves a symbol earlier in the order when dragged onto a symbol further up the list", () => {
    const order = ["AAPL", "MSFT", "GOOG", "AMZN"];

    expect(reorderStocks(order, "GOOG", "AAPL")).toEqual([
      "GOOG",
      "AAPL",
      "MSFT",
      "AMZN",
    ]);
  });

  it("swaps two adjacent symbols", () => {
    expect(reorderStocks(["AAPL", "MSFT", "GOOG"], "AAPL", "MSFT")).toEqual([
      "MSFT",
      "AAPL",
      "GOOG",
    ]);
  });

  it("returns the order unchanged when the symbol is dragged onto itself", () => {
    const order = ["AAPL", "MSFT", "GOOG"];

    expect(reorderStocks(order, "MSFT", "MSFT")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("returns the order unchanged when the dragged symbol isn't in the list", () => {
    const order = ["AAPL", "MSFT", "GOOG"];

    expect(reorderStocks(order, "ZZZZ", "MSFT")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("returns the order unchanged when the drop target isn't in the list", () => {
    const order = ["AAPL", "MSFT", "GOOG"];

    expect(reorderStocks(order, "MSFT", "ZZZZ")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });
});
