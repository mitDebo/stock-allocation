import { useState } from "react";

import { AllocationControls } from "@/components/AllocationControls";
import type { CashHandlingStrategy, WeightingModel } from "@/lib/allocate";

// Visual checkpoint only (tasks.md 3.7) - this is NOT AllocationPage's
// real state wiring, that's section 5. Just enough local state so the
// controls are interactive to look at and tweak in the browser.
function App() {
  const [dollarAmount, setDollarAmount] = useState(1000);
  const [n, setN] = useState(10);
  const [model, setModel] = useState<WeightingModel>("equal");
  const [globalFractionalAllowed, setGlobalFractionalAllowed] = useState(true);
  const [cashHandlingStrategy, setCashHandlingStrategy] =
    useState<CashHandlingStrategy>("maximizeInvested");

  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-semibold">Stock Allocation</h1>
      <div className="w-1/4 min-w-64">
        <AllocationControls
          dollarAmount={dollarAmount}
          onDollarAmountChange={setDollarAmount}
          n={n}
          maxN={50}
          onNChange={setN}
          model={model}
          onModelChange={setModel}
          globalFractionalAllowed={globalFractionalAllowed}
          onGlobalFractionalAllowedChange={setGlobalFractionalAllowed}
          cashHandlingStrategy={cashHandlingStrategy}
          onCashHandlingStrategyChange={setCashHandlingStrategy}
          onAllocate={(values) => console.log("allocate", values)}
        />
      </div>
    </div>
  );
}

export default App;
