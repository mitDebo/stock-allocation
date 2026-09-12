import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AllocationControls } from "../../../src/components/AllocationControls";
import type { AllocationControlsProps } from "../../../src/components/AllocationControls";

// Every field here is a stand-in for state AllocationPage will own for
// real in section 5 - AllocationControls itself holds none of its own,
// per design.md's "state lives in one place" decision.
function baseProps(
  overrides: Partial<AllocationControlsProps> = {},
): AllocationControlsProps {
  return {
    dollarAmount: 1000,
    onDollarAmountChange: vi.fn(),
    n: 10,
    maxN: 50,
    onNChange: vi.fn(),
    model: "equal",
    onModelChange: vi.fn(),
    globalFractionalAllowed: true,
    onGlobalFractionalAllowedChange: vi.fn(),
    cashHandlingStrategy: "maximizeInvested",
    onCashHandlingStrategyChange: vi.fn(),
    onAllocate: vi.fn(),
    ...overrides,
  };
}

describe("AllocationControls - dollar amount input", () => {
  it("renders the current dollar amount", () => {
    render(<AllocationControls {...baseProps()} />);

    expect(screen.getByLabelText(/dollar amount/i)).toHaveValue(1000);
  });

  it("reports the new value via onDollarAmountChange when edited", () => {
    const onDollarAmountChange = vi.fn();
    render(<AllocationControls {...baseProps({ onDollarAmountChange })} />);

    fireEvent.change(screen.getByLabelText(/dollar amount/i), {
      target: { value: "500" },
    });

    expect(onDollarAmountChange).toHaveBeenCalledWith(500);
  });
});

describe("AllocationControls - N slider and its paired numeric input", () => {
  it("renders the current N in both the slider and the numeric input", () => {
    render(<AllocationControls {...baseProps({ n: 15 })} />);

    // A native <input type="range"> reports its value as a string.
    // jsdom does no real layout, so Base UI's Slider (which needs to
    // measure itself to position its thumb) never marks itself visible -
    // hidden: true tells the query to look past that testing-only gap.
    expect(screen.getByRole("slider", { hidden: true })).toHaveValue("15");
    expect(screen.getByLabelText(/number of stocks/i)).toHaveValue(15);
  });

  it("reports a new value via onNChange when the slider moves", () => {
    const onNChange = vi.fn();
    render(<AllocationControls {...baseProps({ onNChange })} />);

    fireEvent.change(screen.getByRole("slider", { hidden: true }), { target: { value: "25" } });

    expect(onNChange).toHaveBeenCalledWith(25);
  });

  it("reports a new value via onNChange when the numeric input is edited", () => {
    const onNChange = vi.fn();
    render(<AllocationControls {...baseProps({ onNChange })} />);

    fireEvent.change(screen.getByLabelText(/number of stocks/i), {
      target: { value: "7" },
    });

    expect(onNChange).toHaveBeenCalledWith(7);
  });
});

describe("AllocationControls - weighting model selector", () => {
  it("renders the current model", () => {
    render(<AllocationControls {...baseProps({ model: "marketCap" })} />);

    expect(
      screen.getByRole("combobox", { name: /weighting model/i }),
    ).toHaveTextContent(/market.cap/i);
  });

  it("reports the chosen model via onModelChange", async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    render(<AllocationControls {...baseProps({ model: "equal", onModelChange })} />);

    await user.click(screen.getByRole("combobox", { name: /weighting model/i }));
    await user.click(await screen.findByRole("option", { name: /rank/i }));

    expect(onModelChange).toHaveBeenCalledWith("rank");
  });
});

describe("AllocationControls - model-selector help tooltip", () => {
  it("describes the currently selected model on hover", async () => {
    const user = userEvent.setup();
    render(<AllocationControls {...baseProps({ model: "marketCap" })} />);

    await user.hover(screen.getByRole("button", { name: /what does this model mean/i }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(/market cap/i);
  });

  it("updates to describe a different model once one is selected", async () => {
    const user = userEvent.setup();
    render(<AllocationControls {...baseProps({ model: "rank" })} />);

    await user.hover(screen.getByRole("button", { name: /what does this model mean/i }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(/rank/i);
  });
});

describe("AllocationControls - global fractional-shares toggle", () => {
  it("renders the current state", () => {
    render(<AllocationControls {...baseProps({ globalFractionalAllowed: true })} />);

    expect(screen.getByRole("switch", { name: /fractional shares/i })).toBeChecked();
  });

  it("reports the flipped value via onGlobalFractionalAllowedChange when clicked", async () => {
    const user = userEvent.setup();
    const onGlobalFractionalAllowedChange = vi.fn();
    render(
      <AllocationControls
        {...baseProps({ globalFractionalAllowed: true, onGlobalFractionalAllowedChange })}
      />,
    );

    await user.click(screen.getByRole("switch", { name: /fractional shares/i }));

    expect(onGlobalFractionalAllowedChange).toHaveBeenCalledWith(false);
  });
});

describe("AllocationControls - cash-handling strategy selector", () => {
  it("renders the current strategy", () => {
    render(<AllocationControls {...baseProps({ cashHandlingStrategy: "simple" })} />);

    expect(
      screen.getByRole("combobox", { name: /cash-handling strategy/i }),
    ).toHaveTextContent(/simple/i);
  });

  it("reports the chosen strategy via onCashHandlingStrategyChange", async () => {
    const user = userEvent.setup();
    const onCashHandlingStrategyChange = vi.fn();
    render(
      <AllocationControls
        {...baseProps({
          cashHandlingStrategy: "maximizeInvested",
          onCashHandlingStrategyChange,
        })}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /cash-handling strategy/i }));
    await user.click(await screen.findByRole("option", { name: /simple/i }));

    expect(onCashHandlingStrategyChange).toHaveBeenCalledWith("simple");
  });
});

describe("AllocationControls - Allocate button", () => {
  it("reports the current input values via onAllocate when clicked", async () => {
    const user = userEvent.setup();
    const onAllocate = vi.fn();
    render(
      <AllocationControls
        {...baseProps({
          dollarAmount: 2500,
          n: 12,
          model: "marketCap",
          globalFractionalAllowed: false,
          cashHandlingStrategy: "simple",
          onAllocate,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /allocate/i }));

    expect(onAllocate).toHaveBeenCalledWith({
      dollarAmount: 2500,
      n: 12,
      model: "marketCap",
      globalFractionalAllowed: false,
      cashHandlingStrategy: "simple",
    });
  });
});
