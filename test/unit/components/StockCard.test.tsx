import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StockCard } from "../../../src/components/StockCard";
import type { StockCardProps } from "../../../src/components/StockCard";
import type { SourceStock } from "../../../src/lib/allocate";

function stock(overrides: Partial<SourceStock> = {}): SourceStock {
  return {
    symbol: "AAPL",
    lowerBoundSlope: 0.5,
    normalizedSlope: 0.5,
    r2: 0.9,
    percentGrowth: 12.5,
    first: 100,
    last: 150,
    min: 90,
    avg: 120,
    max: 160,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 87,
    profile: { marketCapitalization: 2_000_000_000 },
    ...overrides,
  };
}

function baseProps(overrides: Partial<StockCardProps> = {}): StockCardProps {
  return {
    stock: stock(),
    fractionalAllowed: true,
    onFractionalAllowedChange: vi.fn(),
    ...overrides,
  };
}

describe("StockCard - pre-allocation view", () => {
  it("renders the ticker, price, percent growth, and investor grade", () => {
    render(
      <StockCard
        {...baseProps({
          stock: stock({ symbol: "AAPL", last: 150, percentGrowth: 12.5, investorGrade: 87 }),
        })}
      />,
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/12\.5/)).toBeInTheDocument();
    expect(screen.getByText(/87/)).toBeInTheDocument();
  });

  it("renders a negative percent growth with its sign", () => {
    render(<StockCard {...baseProps({ stock: stock({ percentGrowth: -4.2 }) })} />);

    expect(screen.getByText(/-4\.2/)).toBeInTheDocument();
  });

  it("renders the current fractional-shares setting for this stock", () => {
    render(<StockCard {...baseProps({ fractionalAllowed: false })} />);

    expect(screen.getByRole("switch", { name: /fractional shares/i })).not.toBeChecked();
  });

  it("reports a change via onFractionalAllowedChange when toggled, independent of any global setting", async () => {
    const user = userEvent.setup();
    const onFractionalAllowedChange = vi.fn();
    render(
      <StockCard
        {...baseProps({ fractionalAllowed: true, onFractionalAllowedChange })}
      />,
    );

    await user.click(screen.getByRole("switch", { name: /fractional shares/i }));

    expect(onFractionalAllowedChange).toHaveBeenCalledWith(false);
    expect(onFractionalAllowedChange).toHaveBeenCalledTimes(1);
  });
});
