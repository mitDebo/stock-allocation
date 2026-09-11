import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Stock Allocation</h1>
      {/* Sample shadcn/ui component - proves 4.2's setup renders correctly.
          Swapped out once allocation-engine's real page design lands. */}
      <Button>Generate allocation</Button>
    </div>
  );
}

export default App;
