import type { CashHandlingStrategy, FractionalSettings } from "./allocate";

export interface RoundingInput {
  symbol: string;
  price: number;
  dollarTarget: number;
  fractionalAllowed: boolean;
}

export interface RoundedStock {
  symbol: string;
  price: number;
  dollarTarget: number;
  shares: number;
  dollarsInvested: number;
  fractionalAllowed: boolean;
  /** Cash from this stock's own target that hasn't been invested yet -
   * always 0 when fractional shares are allowed. Consumed/redistributed
   * by applyCashHandlingStrategy, which runs across every stock at once. */
  leftover: number;
}

/**
 * Converts one stock's dollar target into a share count. Fractional
 * shares divide exactly with no leftover; otherwise the target floors
 * to a whole share and the remainder becomes leftover cash. Flooring
 * naturally produces 0 shares (with the full target as leftover) when
 * the target can't cover even one share - that's the spec's
 * can't-afford-it rule, not a separate case to special-case here.
 */
export function roundStock(input: RoundingInput): RoundedStock {
  const { symbol, price, dollarTarget, fractionalAllowed } = input;

  if (fractionalAllowed) {
    return {
      symbol,
      price,
      dollarTarget,
      shares: dollarTarget / price,
      dollarsInvested: dollarTarget,
      fractionalAllowed,
      leftover: 0,
    };
  }

  const shares = Math.floor(dollarTarget / price);
  const dollarsInvested = shares * price;

  return {
    symbol,
    price,
    dollarTarget,
    shares,
    dollarsInvested,
    fractionalAllowed,
    leftover: dollarTarget - dollarsInvested,
  };
}

/** Resolves a stock's fractional-shares setting: its own override if it
 * has one, otherwise the global default. */
export function resolveFractionalAllowed(
  symbol: string,
  fractional: FractionalSettings,
): boolean {
  return fractional.perStockOverrides?.[symbol] ?? fractional.globalFractionalAllowed;
}

/**
 * Applies the chosen cash-handling strategy to a set of already-rounded
 * stocks. "simple" just reports the combined leftover. "maximizeInvested"
 * repeatedly grants one more whole share to whichever eligible stock
 * (fractionalAllowed === false) is closest to affording it - the
 * smallest gap between its price and its own leftover - paid for out of
 * the shared pool of every stock's leftover combined, until no stock's
 * gap fits in what remains.
 */
export function applyCashHandlingStrategy(
  roundedStocks: RoundedStock[],
  strategy: CashHandlingStrategy,
): { perStock: RoundedStock[]; leftoverCash: number } {
  const totalLeftover = roundedStocks.reduce((sum, s) => sum + s.leftover, 0);

  if (strategy === "simple") {
    return { perStock: roundedStocks, leftoverCash: totalLeftover };
  }

  const candidates = roundedStocks.map((s) => ({ ...s }));
  let pool = totalLeftover;

  while (true) {
    let bestIndex = -1;
    let bestGap = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.fractionalAllowed) continue;

      const gap = c.price - c.leftover;
      if (gap <= pool && gap < bestGap) {
        bestGap = gap;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) break;

    const winner = candidates[bestIndex];
    pool -= bestGap;
    winner.shares += 1;
    winner.dollarsInvested += winner.price;
    winner.leftover = 0;
  }

  return { perStock: candidates, leftoverCash: pool };
}
