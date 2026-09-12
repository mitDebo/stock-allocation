import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { StockCard } from "@/components/StockCard";
import type { StockCardProps } from "@/components/StockCard";

export interface SortableStockCardProps extends Omit<StockCardProps, "dragHandle"> {
  /** dnd-kit's sortable id for this card - the stock's own symbol, same
   * as what StockGrid tracks order by. */
  id: string;
}

// Wraps StockCard in dnd-kit's useSortable for the actual drag/drop
// mechanics, and builds the drag handle - but hands the handle to
// StockCard as a prop rather than overlaying it from out here. The
// handle has to render inside the same content CardStack wraps as its
// front card, or it doesn't share that card's push-up/peek transform:
// rendered from this outer wrapper, it would sit outside that
// transform entirely and visibly "float" in place while the real card
// rose away from it during the reveal animation.
export function SortableStockCard({ id, ...stockCardProps }: SortableStockCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      aria-label={`Drag to reorder ${id}`}
      className="flex h-5 w-5 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <StockCard {...stockCardProps} dragHandle={dragHandle} />
    </div>
  );
}
