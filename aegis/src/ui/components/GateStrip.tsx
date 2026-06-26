import { motion } from "framer-motion";
import { useAegis } from "../../store/useAegis";
import { TONE } from "../format";
import type { Tone } from "../format";

type GS = "idle" | "active" | "pass" | "block" | "hold";

function toneFor(s: GS): Tone {
  return s === "block" ? "threat" : s === "hold" ? "warn" : s === "pass" ? "safe" : s === "active" ? "scan" : "mute";
}
function labelFor(s: GS): string {
  return s === "block" ? "BLOCKED" : s === "hold" ? "HELD" : s === "pass" ? "CLEAR" : s === "active" ? "SCANNING" : "—";
}

function Gate({ icon, name, state }: { icon: string; name: string; state: GS }) {
  const tone = toneFor(state);
  const t = TONE[tone];
  return (
    <div className={`flex flex-1 items-center gap-2.5 rounded-xl border ${t.border} ${t.bg} ${state === "active" ? t.glow : ""} px-3 py-2`}>
      <span className="text-lg">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-ink">{name}</span>
        <span className={`mono flex items-center gap-1 text-[10px] ${t.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${t.dot} ${state === "active" ? "animate-pulse" : ""}`} />
          {labelFor(state)}
        </span>
      </span>
    </div>
  );
}

function Connector({ on }: { on: boolean }) {
  return (
    <div className="relative mx-0.5 h-px w-5 self-center overflow-hidden bg-edge">
      {on && (
        <motion.div
          className="absolute inset-y-0 w-3"
          style={{ background: "linear-gradient(90deg, transparent, #4d8dff, transparent)" }}
          initial={{ x: "-120%" }}
          animate={{ x: "260%" }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

export function GateStrip() {
  const inputScan = useAegis((s) => s.inputScan);
  const actionScan = useAegis((s) => s.actionScan);
  const outputScan = useAegis((s) => s.outputScan);
  const intercepted = useAegis((s) => s.intercepted);
  const thoughts = useAegis((s) => s.thoughts);
  const stage = useAegis((s) => s.stage);

  const inBlocked = intercepted?.phase === "input";
  const g1: GS = inBlocked
    ? intercepted!.result.decision === "block"
      ? "block"
      : "hold"
    : inputScan
      ? "pass"
      : stage === "inbound" || stage === "input"
        ? "active"
        : "idle";

  const g2: GS = inBlocked
    ? "idle"
    : thoughts.length > 0
      ? stage === "thinking"
        ? "active"
        : "pass"
      : stage === "thinking"
        ? "active"
        : "idle";

  const outBlocked = !!intercepted && intercepted.phase !== "input";
  const g3: GS = outBlocked
    ? intercepted!.result.decision === "block"
      ? "block"
      : "hold"
    : actionScan || outputScan
      ? "pass"
      : stage === "action" || stage === "output"
        ? "active"
        : "idle";

  return (
    <div className="flex items-stretch">
      <Gate icon="🛡️" name="Input Guard" state={g1} />
      <Connector on={g1 === "pass"} />
      <Gate icon="🧠" name="Agent Core" state={g2} />
      <Connector on={g2 === "pass"} />
      <Gate icon="🚦" name="Output Guard" state={g3} />
    </div>
  );
}
