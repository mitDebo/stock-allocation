import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { computeCardSchedule, DEFAULT_CARD_STACK_CAP } from "@/lib/card-schedule";

export interface CardStackProps {
  shares: number;
  cap?: number;
  /** The stock's real, always-visible card content - rendered as the
   * front/top card of the stack. CardStack wraps it rather than being
   * embedded inside it, so the stack can grow underneath without ever
   * resizing or reflowing this content. */
  children: ReactNode;
}

// How often a new backing card slides in, and how long each card's own
// slide/fade transition takes - visual tuning knobs (see design.md's
// Open Questions), not something the round-schedule calculation itself
// cares about.
const ROUND_STAGGER_MS = 150;
const CARD_ANIMATION_SECONDS = 0.25;

// Per-round "push" amounts: every existing card rises by PUSH_UP_PX and
// peeks out by PEEK_PX each time a new card slides in underneath it -
// the illusion that it's been pushed up because something now sits
// beneath it, per design.md's cascading-push-up decision.
const PUSH_UP_PX = 10;
const PEEK_PX = 6;

// Backing cards fade in based on how deep they'll finally sit in the
// stack (not their live, still-changing height) so a card's opacity
// settles once and doesn't visibly brighten again as later cards push
// it further - the deepest final position is only ever MIN_BACKING_OPACITY.
const MIN_BACKING_OPACITY = 0.35;

// The animated per-stock stack (design.md): the front card is always the
// real StockCard content, present from the very first render. Hitting
// Allocate reveals one backing card per round, most-recent round at the
// base, and every existing card - the front one included - rises by one
// notch each time a new one appears beneath it, like a reversed solitaire
// deal: instead of cards leaving a full deck one at a time, a full deck
// builds up one card at a time behind the single card that was always there.
export function CardStack({ shares, cap = DEFAULT_CARD_STACK_CAP, children }: CardStackProps) {
  const schedule = computeCardSchedule(shares, cap);
  const maxRound = schedule.rounds.length - 1;

  const [currentRound, setCurrentRound] = useState(0);
  // A plain ref, not just the currentRound state: setState updater
  // functions don't run until React flushes its batched update queue,
  // which happens only after every interval tick in a given burst of
  // elapsed time has already fired at the raw timer level. Deciding
  // "should this interval keep going" from inside the updater would
  // call clearInterval too late to stop ticks that already fired in
  // that same burst. The ref lets each tick check/update the round
  // synchronously, so the interval can stop itself exactly on time.
  const roundRef = useRef(0);

  useEffect(() => {
    if (maxRound <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const next = roundRef.current + 1;
      roundRef.current = next;
      setCurrentRound(next);

      if (next >= maxRound) {
        clearInterval(interval);
      }
    }, ROUND_STAGGER_MS);

    return () => clearInterval(interval);
  }, [maxRound]);

  // Round 0 is the front card itself (children, always present) - only
  // later rounds are separate backing cards, and only once they've
  // "been born" (their round has come up on the clock so far).
  const backingRounds = schedule.rounds
    .slice(1)
    .filter((round) => round <= currentRound);

  return (
    <div className="relative" data-testid="card-stack" data-capped={schedule.isCapped}>
      {backingRounds.map((round) => {
        const liveHeight = currentRound - round;
        const finalHeight = maxRound - round;
        const opacity =
          MIN_BACKING_OPACITY + (1 - MIN_BACKING_OPACITY) * (finalHeight / maxRound);

        return (
          <motion.div
            key={round}
            data-testid="card-stack-card"
            data-round={round}
            data-height={liveHeight}
            className="absolute inset-0 rounded-2xl border border-border bg-card shadow-sm"
            style={{ zIndex: liveHeight }}
            initial={false}
            animate={{
              x: liveHeight * PEEK_PX,
              y: -liveHeight * PUSH_UP_PX,
              opacity,
            }}
            transition={{ duration: CARD_ANIMATION_SECONDS }}
          />
        );
      })}

      <motion.div
        data-testid="card-stack-front"
        data-height={currentRound}
        className="relative"
        style={{ zIndex: currentRound }}
        initial={false}
        animate={{ x: currentRound * PEEK_PX, y: -currentRound * PUSH_UP_PX }}
        transition={{ duration: CARD_ANIMATION_SECONDS }}
      >
        {children}
      </motion.div>
    </div>
  );
}
