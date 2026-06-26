import { useEffect, useState } from "react";
import { useAegis } from "../../store/useAegis";

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="mono text-xs text-mute tabular-nums">
      {t.toLocaleTimeString([], { hour12: false })} UTC
    </span>
  );
}

function SemanticPill() {
  const sem = useAegis((s) => s.sem);
  let dot = "bg-warn";
  let label = "LEXICAL MODE";
  let tone = "text-warn border-warn/40";

  if (sem.loadState === "loading") {
    dot = "bg-scan animate-pulse";
    label = `LOADING NEURAL · ${sem.progress}%`;
    tone = "text-scan border-scan/40";
  } else if (sem.loadState === "ready" && sem.mode === "neural") {
    dot = "bg-violet";
    label = "NEURAL · all-MiniLM-L6-v2";
    tone = "text-violet border-violet/40";
  }

  return (
    <span className={`chip ${tone}`} title="Local semantic detection layer">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b hairline px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-lg bg-scan/15 glow-scan" />
          <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-9 w-9" fill="none">
            <path
              d="M12 2.5 4 5.5v6c0 4.6 3.2 7.9 8 10 4.8-2.1 8-5.4 8-10v-6L12 2.5Z"
              stroke="currentColor"
              className="text-scan"
              strokeWidth="1.4"
              fill="rgba(77,141,255,0.08)"
            />
            <path d="M8.6 12.2l2.3 2.3 4.5-4.7" stroke="currentColor" className="text-safe" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="mono font-semibold tracking-[0.34em] text-ink">AEGIS</div>
          <div className="mono text-[10px] text-mute tracking-[0.18em]">
            THE FIREWALL FOR AI AGENTS
          </div>
        </div>
        <span className="ml-3 hidden chip border-edge text-mute md:inline-flex">
          PROTECTING · Contoso Support Copilot
        </span>
      </div>

      <div className="flex items-center gap-3">
        <SemanticPill />
        <span className="hidden chip border-safe/40 text-safe sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-safe" />
          GATEWAY ONLINE
        </span>
        <Clock />
      </div>
    </header>
  );
}
