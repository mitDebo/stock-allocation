import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockGrid } from "../../../src/components/StockGrid";
import type { StockGridProps } from "../../../src/components/StockGrid";
import type { SourceStock } from "../../../src/lib/allocate";

function stock(symbol: string, overrides: Partial<SourceStock> = {}): SourceStock {
  return {
    symbol,
    lowerBoundSlope: 0.5,
    normalizedSlope: 0.5,
    r2: 0.9,
    percentGrowth: 10,
    first: 10,
    last: 25,
    min: 10,
    avg: 15,
    max: 30,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 80,
    profile: { marketCapitalization: 1_000_000 },
    ...overrides,
  };
}

function baseProps(overrides: Partial<StockGridProps> = {}): StockGridProps {
  return {
    stocks: [stock("AAA"), stock("BBB"), stock("CCC")],
    n: 3,
    fractional: { globalFractionalAllowed: true },
    onFractionalOverrideChange: vi.fn(),
    ...overrides,
  };
}

describe("StockGrid", () => {
  it("renders the intro copy and a 'showing top N stocks' line", () => {
    render(<StockGrid {...baseProps({ n: 10 })} />);

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText(/top 10 stocks/i)).toBeInTheDocument();
  });

  it("renders one StockCard per stock in the provided list", () => {
    render(
      <StockGrid
        {...baseProps({ stocks: [stock("AAA"), stock("BBB"), stock("CCC")], n: 3 })}
      />,
    );

    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("BBB")).toBeInTheDocument();
    expect(screen.getByText("CCC")).toBeInTheDocument();
  });

  it("renders no cards when given an empty stock list", () => {
    render(<StockGrid {...baseProps({ stocks: [], n: 0 })} />);

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
