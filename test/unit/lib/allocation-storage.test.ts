import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllocationResults,
  clearAllocationState,
  loadAllocationState,
  saveAllocationState,
  type PersistedAllocationState,
} from "../../../src/lib/allocation-storage";

function sampleState(): PersistedAllocationState {
  return {
    inputs: {
      dollarAmount: 300,
      n: 3,
      model: "equal",
      fractional: { globalFractionalAllowed: true },
      cashHandlingStrategy: "simple",
    },
    results: {
      perStock: [
        {
          symbol: "AAA",
          dollarTarget: 100,
          shares: 10,
          dollarsInvested: 100,
          fractionalAllowed: true,
        },
      ],
      leftoverCash: 0,
    },
    boughtSymbols: ["AAA"],
  };
}

describe("saveAllocationState / loadAllocationState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a full state object through localStorage", () => {
    const state = sampleState();
    saveAllocationState(state);

    expect(loadAllocationState()).toEqual(state);
  });

  it("returns null when nothing has been saved yet", () => {
    expect(loadAllocationState()).toBeNull();
  });

  it("returns null instead of throwing when the stored value isn't valid JSON", () => {
    localStorage.setItem("stock-allocation:allocation-state", "not json");

    expect(loadAllocationState()).toBeNull();
  });

  describe("when storage access itself throws (private browsing, blocked storage)", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("loadAllocationState returns null instead of throwing", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage blocked");
      });

      expect(loadAllocationState()).toBeNull();
    });

    it("saveAllocationState does not throw", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("storage blocked");
      });

      expect(() => saveAllocationState(sampleState())).not.toThrow();
    });
  });
});

describe("clearAllocationResults", () => {
  it("clears the results and bought set but keeps the inputs untouched", () => {
    const state = sampleState();

    const cleared = clearAllocationResults(state);

    expect(cleared).toEqual({
      inputs: state.inputs,
      results: null,
      boughtSymbols: [],
    });
    // The original object passed in is left alone - this is a pure
    // transform, not a mutation.
    expect(state.results).not.toBeNull();
  });
});


describe("clearAllocationState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes a previously saved blob entirely", () => {
    saveAllocationState(sampleState());

    clearAllocationState();

    expect(loadAllocationState()).toBeNull();
  });

  it("does not throw when nothing has been saved yet", () => {
    expect(() => clearAllocationState()).not.toThrow();
  });

  it("does not throw when storage access itself fails", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(() => clearAllocationState()).not.toThrow();

    vi.restoreAllMocks();
  });
});
