import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardStack } from "../../../src/components/CardStack";

// CardStack advances its own internal round timer every 150ms (see
// ROUND_STAGGER_MS in the component) - fake timers make that
// deterministic instead of racing real animation frames.
describe("CardStack", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders only the front content when the share count needs just one card", () => {
    render(
      <CardStack shares={1}>
        <div>front content</div>
      </CardStack>,
    );

    expect(screen.getByText("front content")).toBeInTheDocument();
    expect(screen.queryAllByTestId("card-stack-card")).toHaveLength(0);

    // Advancing time shouldn't conjure up backing cards that were never
    // scheduled - a single share is just a single card, forever.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryAllByTestId("card-stack-card")).toHaveLength(0);
  });

  it("slides in one backing card per round, not all at once", () => {
    render(
      <CardStack shares={3}>
        <div>front content</div>
      </CardStack>,
    );

    // Round 0: just the front content exists so far.
    expect(screen.queryAllByTestId("card-stack-card")).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(2);

    // 3 shares = 3 total cards (front + 2 backing) - no third backing
    // card should ever appear, however much more time passes.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(2);
  });

  it("pushes every existing card up one notch each time a new one slides in underneath", () => {
    render(
      <CardStack shares={3}>
        <div>front content</div>
      </CardStack>,
    );

    // Only the front card exists so far - it hasn't been pushed by
    // anything yet.
    expect(screen.getByTestId("card-stack-front").dataset.height).toBe("0");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    // A backing card just slid in at height 0; the front card - which
    // has been there since the start - gets pushed up to height 1.
    expect(screen.getByTestId("card-stack-front").dataset.height).toBe("1");
    expect(screen.getByTestId("card-stack-card").dataset.height).toBe("0");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    // Another backing card slides in at height 0; everything already
    // there - the front card AND the first backing card - rises again.
    expect(screen.getByTestId("card-stack-front").dataset.height).toBe("2");
    const heights = screen
      .getAllByTestId("card-stack-card")
      .map((card) => card.dataset.height)
      .sort();
    expect(heights).toEqual(["0", "1"]);
  });

  it("caps the total visible cards (front + backing) at the configured cap", () => {
    render(
      <CardStack shares={40} cap={6}>
        <div>front content</div>
      </CardStack>,
    );

    act(() => {
      vi.advanceTimersByTime(10 * 150);
    });

    // 6 total cards: the front card plus 5 backing cards.
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(5);
    expect(screen.getByTestId("card-stack-front").dataset.height).toBe("5");
  });

  it("starts a fresh stack (no backing cards) each time it mounts with a new share count", () => {
    const { unmount } = render(
      <CardStack shares={3}>
        <div>first allocation</div>
      </CardStack>,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getAllByTestId("card-stack-card")).toHaveLength(2);
    unmount();

    render(
      <CardStack shares={2}>
        <div>second allocation</div>
      </CardStack>,
    );
    expect(screen.queryAllByTestId("card-stack-card")).toHaveLength(0);
  });
});
