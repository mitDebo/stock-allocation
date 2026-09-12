import type {
  AllocationResult,
  CashHandlingStrategy,
  FractionalSettings,
  WeightingModel,
} from "./allocate";

const STORAGE_KEY = "stock-allocation:allocation-state";

export interface PersistedAllocationInputs {
  dollarAmount: number;
  n: number;
  model: WeightingModel;
  fractional: FractionalSettings;
  cashHandlingStrategy: CashHandlingStrategy;
}

export interface PersistedAllocationState {
  inputs: PersistedAllocationInputs;
  /** null before the first Allocate click, or right after the inputs
   * have changed and invalidated the previous results (see design.md). */
  results: AllocationResult | null;
  /** Which stocks the user has checked off as "bought," by symbol. */
  boughtSymbols: string[];
}

/**
 * Saves the full allocation state (inputs, results, and the bought
 * checklist) as one blob, so a page reload can restore exactly what the
 * user was looking at. Storage access can fail (private browsing, a
 * browser blocking it) - when it does, this silently does nothing rather
 * than crash the app, since persistence is a nice-to-have, not something
 * the app depends on to function.
 */
export function saveAllocationState(state: PersistedAllocationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable - degrade to "no persistence" silently.
  }
}

/**
 * Loads the last-saved allocation state, or null if there isn't one, the
 * stored value isn't valid JSON (a corrupted or hand-edited entry), or
 * storage access itself fails.
 */
export function loadAllocationState(): PersistedAllocationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    return JSON.parse(raw) as PersistedAllocationState;
  } catch {
    return null;
  }
}

/**
 * Returns a new state with the results and bought checklist cleared,
 * leaving the inputs exactly as they were. A pure transform - it doesn't
 * touch storage itself; the caller decides when (and whether) to save
 * the result via saveAllocationState.
 */
export function clearAllocationResults(
  state: PersistedAllocationState,
): PersistedAllocationState {
  return {
    inputs: state.inputs,
    results: null,
    boughtSymbols: [],
  };
}
