export interface DataFreshnessProps {
  /** ISO timestamp from stocks.json's generatedAt field. */
  generatedAt: string;
}

// Small standalone display component - formats the build-time
// generatedAt timestamp into a human-readable date. Uses an explicit
// "en-US" locale (rather than the system default) so the rendered text
// is deterministic across environments, including in tests.
export function DataFreshness({ generatedAt }: DataFreshnessProps) {
  // timeZone: "UTC" pins this to the UTC calendar date regardless of
  // the viewer's local timezone - without it, a midnight-UTC timestamp
  // rolls back to the previous day in any timezone behind UTC, which is
  // both misleading (the date silently varies per viewer) and made this
  // component's own test non-deterministic.
  const formatted = new Date(generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <p className="text-xs text-muted-foreground" data-testid="data-freshness">
      Data as of {formatted}
    </p>
  );
}
