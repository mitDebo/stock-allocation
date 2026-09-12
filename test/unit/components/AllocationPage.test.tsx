import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AllocationPage } from "../../../src/components/AllocationPage";
import type { SourceStock } from "../../../src/lib/allocate";

function stock(symbol: string, overrides: Partial<SourceStock> = {}): SourceStock {
  return {
    symbol,
    lowerBoundSlope: 0.5,
    normalizedSlope: 0.5,
    r2: 0.9,
    percentGrowth: 10,
    first: 10,
    last: 10,
    min: 10,
    avg: 10,
    max: 10,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 50,
    profile: null,
    ...overrides,
  };
}

// Three identical, cleanly-priced stocks - $10/share, equal weight - so
// the resulting math (a $300 allocation across 3 stocks at $10 each =
// 10 shares apiece) is exact and easy to assert on without rounding.
const STOCKS: SourceStock[] = [stock("AAA"), stock("BBB"), stock("CCC")];

describe("AllocationPage - before Allocate has ever been clicked", () => {
  it("renders both panes with no results", () => {
    render(<AllocationPage stocks={STOCKS} />);

    // Left pane
    expect(screen.getByLabelText(/dollar amount/i)).toBeInTheDocument();
    // Right pane, pre-allocation cards - no bought checkboxes yet
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("still shows no results after changing an input", () => {
    render(<AllocationPage stocks={STOCKS} />);

    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "500" },
    });

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("AllocationPage - clicking Allocate", () => {
  it("runs the calculation engine with the current inputs and displays the results", async () => {
    const user = userEvent.setup();
    render(<AllocationPage stocks={STOCKS} />);

    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "300" },
    });

    await user.click(screen.getByRole("button", { name: /allocate/i }));

    // equal weight: $300 / 3 stocks = $100 each; at $10/share that's 10
    // shares apiece.
    expect(screen.getAllByText(/10 shares/i)).toHaveLength(3);
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
});

describe("AllocationPage - editing a left-pane input after results exist", () => {
  it("immediately clears the results and the bought set", async () => {
    const user = userEvent.setup();
    render(<AllocationPage stocks={STOCKS} />);

    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "300" },
    });
    await user.click(screen.getByRole("button", { name: /allocate/i }));
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();

    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "600" },
    });

    // Back to the pre-allocation view - no checkboxes at all.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    // Allocating again starts from a clean bought set, proving it was
    // actually cleared and not just hidden behind the missing results.
    await user.click(screen.getByRole("button", { name: /allocate/i }));
    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();
  });
});

describe("AllocationPage - no persistence", () => {
  // Kdubs decided every page load should start completely fresh (see
  // design.md) - so AllocationPage should never read from or write to
  // localStorage at all, even after allocating and marking stocks bought.
  it("never touches localStorage", async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();

    render(<AllocationPage stocks={STOCKS} />);
    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "300" },
    });
    await user.click(screen.getByRole("button", { name: /allocate/i }));
    await user.click(screen.getAllByRole("checkbox")[0]);

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("renders no Reset button", () => {
    render(<AllocationPage stocks={STOCKS} />);

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });
});
