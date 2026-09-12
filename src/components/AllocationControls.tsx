import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CashHandlingStrategy, WeightingModel } from "@/lib/allocate";

// Display labels and hover-tooltip copy for each weighting model. Kept
// here (not in allocate.ts) since this is UI copy, not calculation logic.
const MODEL_LABELS: Record<WeightingModel, string> = {
  equal: "Equal weight",
  marketCap: "Market cap weight",
  rank: "Rank weight",
};

const MODEL_DESCRIPTIONS: Record<WeightingModel, string> = {
  equal:
    "Splits your money evenly across every stock, regardless of size or ranking.",
  marketCap:
    "Puts more money into stocks with a larger market cap, less into smaller ones.",
  rank:
    "Puts more money into stocks the source model ranks higher, less into lower-ranked ones.",
};

const CASH_HANDLING_LABELS: Record<CashHandlingStrategy, string> = {
  simple: "Simple (leave leftover cash unspent)",
  maximizeInvested: "Maximize invested (top up shares with leftover cash)",
};

export interface AllocationControlsProps {
  dollarAmount: number;
  onDollarAmountChange: (value: number) => void;
  n: number;
  maxN: number;
  onNChange: (value: number) => void;
  model: WeightingModel;
  onModelChange: (value: WeightingModel) => void;
  globalFractionalAllowed: boolean;
  onGlobalFractionalAllowedChange: (value: boolean) => void;
  cashHandlingStrategy: CashHandlingStrategy;
  onCashHandlingStrategyChange: (value: CashHandlingStrategy) => void;
  onAllocate: (values: {
    dollarAmount: number;
    n: number;
    model: WeightingModel;
    globalFractionalAllowed: boolean;
    cashHandlingStrategy: CashHandlingStrategy;
  }) => void;
  /** Wipes the saved allocation and puts every input back to its
   * default. AllocationControls doesn't know or care what "reset" means
   * beyond calling this - the confirmation prompt and the actual reset
   * both live in AllocationPage, which owns the state. */
  onReset: () => void;
}

// The left pane. Fully controlled - every value it shows comes in via
// props and every change is reported back out via callback props. It
// holds no state of its own; AllocationPage (section 5) owns all of it.
export function AllocationControls({
  dollarAmount,
  onDollarAmountChange,
  n,
  maxN,
  onNChange,
  model,
  onModelChange,
  globalFractionalAllowed,
  onGlobalFractionalAllowedChange,
  cashHandlingStrategy,
  onCashHandlingStrategyChange,
  onAllocate,
  onReset,
}: AllocationControlsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dollar-amount-input">Dollar amount</Label>
        <Input
          id="dollar-amount-input"
          type="number"
          value={dollarAmount}
          onValueChange={(value) => onDollarAmountChange(Number(value))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="n-number-input">Number of stocks</Label>
        <div className="flex items-center gap-3">
          <Slider
            aria-label="Stocks to include"
            min={1}
            max={maxN}
            value={[n]}
            onValueChange={(value) =>
              onNChange(Array.isArray(value) ? value[0] : value)
            }
          />
          <Input
            id="n-number-input"
            type="number"
            min={1}
            max={maxN}
            className="w-20 shrink-0"
            value={n}
            onValueChange={(value) => onNChange(Number(value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="weighting-model-trigger">Weighting model</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="What does this model mean?"
                className="text-muted-foreground"
              >
                <CircleHelp className="size-4" />
              </TooltipTrigger>
              <TooltipContent>{MODEL_DESCRIPTIONS[model]}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          items={MODEL_LABELS}
          value={model}
          onValueChange={(value) => onModelChange(value as WeightingModel)}
        >
          <SelectTrigger id="weighting-model-trigger" aria-label="Weighting model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MODEL_LABELS) as WeightingModel[]).map((key) => (
              <SelectItem key={key} value={key}>
                {MODEL_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="fractional-shares-switch">Allow fractional shares</Label>
        <Switch
          id="fractional-shares-switch"
          aria-label="Fractional shares"
          checked={globalFractionalAllowed}
          onCheckedChange={(checked) => onGlobalFractionalAllowedChange(checked)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cash-handling-trigger">Cash-handling strategy</Label>
        <Select
          items={CASH_HANDLING_LABELS}
          value={cashHandlingStrategy}
          onValueChange={(value) =>
            onCashHandlingStrategyChange(value as CashHandlingStrategy)
          }
        >
          <SelectTrigger id="cash-handling-trigger" aria-label="Cash-handling strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CASH_HANDLING_LABELS) as CashHandlingStrategy[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {CASH_HANDLING_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={() =>
          onAllocate({
            dollarAmount,
            n,
            model,
            globalFractionalAllowed,
            cashHandlingStrategy,
          })
        }
      >
        Allocate
      </Button>

      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
