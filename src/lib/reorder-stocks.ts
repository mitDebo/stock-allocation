/**
 * Moves `fromSymbol` to occupy `toSymbol`'s slot, shifting everything
 * between them over by one - standard drag-and-drop reorder semantics
 * (drop the dragged item exactly where the target currently sits). A
 * no-op (the original order, untouched) when either symbol isn't in
 * the list, or when they're the same symbol.
 *
 * Purely cosmetic display-order logic - has no knowledge of, and no
 * effect on, which stocks are actually selected (see design.md).
 */
export function reorderStocks(
  order: string[],
  fromSymbol: string,
  toSymbol: string,
): string[] {
  const fromIndex = order.indexOf(fromSymbol);
  const toIndex = order.indexOf(toSymbol);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return order;
  }

  const next = [...order];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromSymbol);
  return next;
}
