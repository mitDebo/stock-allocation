import { describe, expect, it } from "vitest";
import { computeCardSchedule } from "../../../src/lib/card-schedule";

describe("computeCardSchedule", () => {
  it("returns one card per whole share, each entering on its own round", () => {
    expect(computeCardSchedule(3, 6)).toEqual({ rounds: [0, 1, 2], isCapped: false });
  });

  it("rounds a fractional share count up to the next whole card, since you can't show a partial card", () => {
    expect(computeCardSchedule(3.25, 6)).toEqual({ rounds: [0, 1, 2, 3], isCapped: false });
  });

  it("returns no cards for zero shares", () => {
    expect(computeCardSchedule(0, 6)).toEqual({ rounds: [], isCapped: false });
  });

  it("returns exactly the cap's worth of cards at the cap boundary, not flagged as capped", () => {
    expect(computeCardSchedule(6, 6)).toEqual({ rounds: [0, 1, 2, 3, 4, 5], isCapped: false });
  });

  it("caps the visual stack when shares exceed the cap, flagging it as capped", () => {
    expect(computeCardSchedule(40, 6)).toEqual({ rounds: [0, 1, 2, 3, 4, 5], isCapped: true });
  });

  it("caps a fractional share count that rounds up past the cap", () => {
    expect(computeCardSchedule(6.5, 6)).toEqual({ rounds: [0, 1, 2, 3, 4, 5], isCapped: true });
  });

  it("returns a single card, round 0, for a fractional share count under one share", () => {
    expect(computeCardSchedule(0.5, 6)).toEqual({ rounds: [0], isCapped: false });
  });
});
