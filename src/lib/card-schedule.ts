export const DEFAULT_CARD_STACK_CAP = 6;

export interface CardSchedule {
  /** One entry per visible card (bottom to top), each naming the round
   * (0-based) it enters on. Round 0 already exists with no animation;
   * later rounds are added round-by-round by the Motion stagger
   * (section 6.4) - this module only computes the schedule, it doesn't
   * animate anything. */
  rounds: number[];
  /** True when the real share count needed more cards than the cap
   * allows. The exact share count is always shown as text elsewhere
   * (see StockCard) regardless of this flag - it only describes the
   * visual stack itself. */
  isCapped: boolean;
}

/**
 * Turns a share count into the capped, round-scheduled list of visual
 * cards for CardStack. A fractional share (e.g. 3.25) still needs a 4th
 * card - you can't show 0.25 of one - so the needed count always rounds
 * up before the cap is applied.
 */
export function computeCardSchedule(shares: number, cap: number): CardSchedule {
  const neededCards = Math.ceil(shares);
  const cardCount = Math.min(neededCards, cap);

  return {
    rounds: Array.from({ length: cardCount }, (_, index) => index),
    isCapped: neededCards > cap,
  };
}
