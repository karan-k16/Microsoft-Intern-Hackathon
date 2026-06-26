import { useEffect } from "react";
import { useAegis } from "./store/useAegis";
import { Header } from "./ui/components/Header";
import { Controls } from "./ui/components/Controls";
import { Interceptor } from "./ui/components/Interceptor";
import { VerdictPanel } from "./ui/components/VerdictPanel";
import { ThreatFeed } from "./ui/components/ThreatFeed";

export default function App() {
  const initModel = useAegis((s) => s.initModel);
  useEffect(() => {
    initModel();
  }, [initModel]);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-12 gap-4 p-4">
        <div className="col-span-12 min-h-0 lg:col-span-3">
          <Controls />
        </div>
        <div className="col-span-12 min-h-0 lg:col-span-6">
          <Interceptor />
        </div>
        <div className="col-span-12 flex min-h-0 flex-col gap-4 lg:col-span-3">
          <VerdictPanel />
          <ThreatFeed />
        </div>
      </main>
    </div>
  );
}
