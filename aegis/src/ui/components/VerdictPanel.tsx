import { AnimatePresence, motion } from "framer-motion";
import { useAegis } from "../../store/useAegis";
import { CATEGORY_LABEL } from "../../engine";
import type { Decision } from "../../engine";
import { DECISION_LABEL, TONE, decisionTone } from "../format";
import { SignalCard } from "./SignalCard";

export function VerdictPanel() {
  const inputScan = useAegis((s) => s.inputScan);
  const actionScan = useAegis((s) => s.actionScan);
  const outputScan = useAegis((s) => s.outputScan);
  const intercepted = useAegis((s) => s.intercepted);
  const outcome = useAegis((s) => s.outcome);
  const stage = useAegis((s) => s.stage);

  const result = intercepted?.result ?? outputScan ?? actionScan ?? inputScan;
  const phase =
    intercepted?.phase ??
    (outputScan ? "output" : actionScan ? "action" : inputScan ? "input" : null);

  if (!result) {
    return (
      <section className="panel flex flex-col p-4">
        <h2 className="mono text-xs tracking-[0.18em] text-mute">VERDICT</h2>
        <div className="grid flex-1 place-items-center py-10 text-center">
          <div>
            <div className="floaty text-3xl">🛡️</div>
            <p className="mt-3 text-sm text-mute">Awaiting traffic.</p>
            <p className="text-xs text-faint">Launch a scenario or use the console.</p>
          </div>
        </div>
      </section>
    );
  }

  const decision: Decision = outcome === "allowed" ? "allow" : result.decision;
  const tone = decisionTone(decision);
  const t = TONE[tone];
  const pct = Math.round(result.score * 100);

  return (
    <section className="panel flex flex-col p-4" data-zoom="verdict">
      <div className="flex items-center justify-between">
        <h2 className="mono text-xs tracking-[0.18em] text-mute">VERDICT</h2>
        {phase && (
          <span className="chip border-edge text-mute">{phase.toUpperCase()} GUARD</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={decision + phase}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={
            decision === "block"
              ? { opacity: 1, scale: 1, x: [0, -7, 7, -4, 2, 0] }
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.4 }}
          className={`mt-3 rounded-2xl border ${t.border} ${t.bg} ${t.glow} p-4`}
        >
          <div className="flex items-center justify-between">
            <span className={`mono text-2xl font-bold tracking-wider ${t.text}`}>
              {DECISION_LABEL[decision]}
            </span>
            <span className={`mono text-sm ${t.text}`}>{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-void/70">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, pct)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${t.dot}`}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-mute">
            <span className="mono">threat score</span>
            <span className="mono">scanned in {result.durationMs}ms</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <span className="mono text-[11px] tracking-[0.16em] text-mute">
          DETECTION SIGNALS · {result.signals.length}
        </span>
        {stage !== "done" && (
          <span className="mono text-[11px] text-scan">scanning…</span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: 360 }}>
        {result.signals.length === 0 ? (
          <div className="rounded-xl border border-safe/30 bg-safe/5 p-3 text-sm text-safe">
            No threats detected across the normalizer, heuristic, and semantic layers.
          </div>
        ) : (
          result.signals.map((sig, i) => <SignalCard key={sig.id + i} sig={sig} index={i} />)
        )}
      </div>

      {result.signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...new Set(result.signals.map((s) => s.category))].map((c) => (
            <span key={c} className={`chip ${t.border} ${t.text}`}>
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
