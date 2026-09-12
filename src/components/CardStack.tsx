import { motion } from "motion/react";

import { computeCardSchedule, DEFAULT_CARD_STACK_CAP } from "@/lib/card-schedule";

export interface CardStackProps {
  shares: number;
  cap?: number;
}

// How long each round's stagger delay is, and how long a single card's
// entrance takes - visual tuning knobs (see design.md's Open Questions),
// not something the round-schedule calculation itself cares about.
const ROUND_STAGGER_SECONDS = 0.15;
const CARD_ANIMATION_SECONDS = 0.25;

// The animated per-stock stack (design.md): one card per share, capped
// at `cap` cards. Every card fades and slides slightly into place, and
// every card sharing the same round index (across every stock on the
// page) animates in at the same time, since they all compute their
// delay from that same round number - a "shared clock" with no
// cross-component coordination needed, per design.md's synchronized
// round-based reveal decision.
export function CardStack({ shares, cap = DEFAULT_CARD_STACK_CAP }: CardStackProps) {
  const schedule = computeCardSchedule(shares, cap);

  if (schedule.rounds.length === 0) {
    return null;
  }

  return (
    <div
      className="relative h-12 w-16"
      data-testid="card-stack"
      data-capped={schedule.isCapped}
    >
      {schedule.rounds.map((round, index) => (
        <motion.div
          key={index}
          data-testid="card-stack-card"
          data-round={round}
          className="absolute h-10 w-14 rounded-lg border border-border bg-card shadow-sm"
          style={{ bottom: `${index * 3}px`, left: `${index * 3}px`, zIndex: index }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: round * ROUND_STAGGER_SECONDS,
            duration: CARD_ANIMATION_SECONDS,
          }}
        />
      ))}
    </div>
  );
}
