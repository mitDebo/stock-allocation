import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("StockCard - drag handle", () => {
  // The handle needs to live inline with the ticker (not float as a
  // separate overlay), and specifically inside the post-allocation
  // content that CardStack's front card wraps - otherwise it doesn't
  // rise with the card during the reveal animation. This just confirms
  // StockCard actually renders whatever handle it's given, in both
  // views; the visual "does it move with the card" check is manual
  // (same as the animation itself).
  it("renders a provided dragHandle before allocation", () => {
    render(
      <StockCard
        {...baseProps({ dragHandle: <span data-testid="handle">::</span> })}
      />,
    );

    expect(screen.getByTestId("handle")).toBeInTheDocument();
  });

  it("renders a provided dragHandle after allocation, inside the CardStack-wrapped content", () => {
    render(
      <StockCard
        {...baseProps({
          dragHandle: <span data-testid="handle">::</span>,
          result: { symbol: "AAPL", dollarTarget: 100, shares: 10, dollarsInvested: 100, fractionalAllowed: true },
        })}
      />,
    );

    expect(screen.getByTestId("handle")).toBeInTheDocument();
  });

  it("renders nothing extra when no dragHandle is given", () => {
    render(<StockCard {...baseProps()} />);

    expect(screen.queryByTestId("handle")).not.toBeInTheDocument();
  });
});

describe("StockCard - post-allocation view", () => {
  it("shows the exact share count and dollar amount as text once a result is provided", () => {
    render(
      <StockCard
        {...baseProps({
          stock: stock({ symbol: "AAPL", last: 10 }),
          result: {
            symbol: "AAPL",
            dollarTarget: 100,
            shares: 10,
            dollarsInvested: 100,
            fractionalAllowed: true,
          },
        })}
      />,
    );

    expect(screen.getByText(/10 shares/i)).toBeInTheDocument();
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
  });

  it("renders a 'mark as bought' checkbox reflecting the current bought state", () => {
    render(
      <StockCard
        {...baseProps({
          result: { symbol: "AAPL", dollarTarget: 100, shares: 10, dollarsInvested: 100, fractionalAllowed: true },
          bought: true,
        })}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /mark aapl as bought/i })).toBeChecked();
  });

  it("reports a change via onBoughtChange when the checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onBoughtChange = vi.fn();
    render(
      <StockCard
        {...baseProps({
          result: { symbol: "AAPL", dollarTarget: 100, shares: 10, dollarsInvested: 100, fractionalAllowed: true },
          bought: false,
          onBoughtChange,
        })}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /mark aapl as bought/i }));

    expect(onBoughtChange).toHaveBeenCalledWith(true);
  });
});

describe("StockCard - post-allocation view with a capped share count", () => {
  // CardStack slides its backing cards in progressively (one per
  // round, on a timer) rather than all at once - fake timers let us
  // fast-forward past that reveal so we can assert on the settled
  // stack, deterministically.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the exact share count as text even when the visual stack is capped", () => {
    render(
      <StockCard
        {...baseProps({
          result: {
            symbol: "AAPL",
            dollarTarget: 400,
            shares: 40,
            dollarsInvested: 400,
            fractionalAllowed: true,
          },
        })}
      />,
    );

    // The exact figure is always shown as text, regardless of the
    // visual stack's cap.
    expect(screen.getByText(/40 shares/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10 * 150);
    });

    // The visual stack itself never renders more than the cap's worth
    // of cards - see src/lib/card-schedule.ts. The front card (the
    // StockCard's own content) is the 1st card of the cap and isn't
    // counted as a "card-stack-card", so a cap of 6 leaves 5 backing
    // cards.
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(5);
  });

  it("renders one backing card per share (beyond the front card) when under the cap", () => {
    render(
      <StockCard
        {...baseProps({
          result: {
            symbol: "AAPL",
            dollarTarget: 30,
            shares: 3,
            dollarsInvested: 30,
            fractionalAllowed: true,
          },
        })}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10 * 150);
    });

    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(2);
  });
});
