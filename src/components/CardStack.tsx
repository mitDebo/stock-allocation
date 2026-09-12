import { computeCardSchedule, DEFAULT_CARD_STACK_CAP } from "@/lib/card-schedule";

export interface CardStackProps {
  shares: number;
  cap?: number;
}

// The animated per-stock stack (design.md) - one card per share, capped
// at `cap` cards, each carrying its own round index. For now this
// renders the schedule as a plain static stack; the Motion fade/slide
// animation (section 6.4) layers on top of this same list (keyed off
// each card's data-round) without changing its structure, so nothing
// here needs to change once that's wired in.
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
        <div
          key={index}
          data-testid="card-stack-card"
          data-round={round}
          className="absolute h-10 w-14 rounded-lg border border-border bg-card shadow-sm"
          style={{ bottom: `${index * 3}px`, left: `${index * 3}px`, zIndex: index }}
        />
      ))}
    </div>
  );
}
