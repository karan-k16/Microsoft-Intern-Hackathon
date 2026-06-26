import { AnimatePresence, motion } from "framer-motion";
import { useAegis } from "../../store/useAegis";
import { toolSpec } from "../../agent/tools";
import { GateStrip } from "./GateStrip";
import { ThoughtStream } from "./ThoughtStream";
import { QuarantineNet } from "./QuarantineNet";
import { TONE, outcomeTone } from "../format";

function EmptyState() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div className="max-w-sm">
        <div className="floaty text-5xl">🛰️</div>
        <h2 className="mt-4 text-lg font-semibold text-ink">The gateway is watching</h2>
        <p className="mt-2 text-sm text-mute">
          Every message, tool call, and answer to your AI agent passes through AEGIS
          first. Launch a scenario on the left — or type your own attack in the live
          console — to see it intercept threats in real time.
        </p>
      </div>
    </div>
  );
}

function NodeCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`panel relative overflow-hidden p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ArgRows({ args }: { args: Record<string, unknown> }) {
  return (
    <div className="mono mt-2 flex flex-col gap-1 text-[12px]">
      {Object.entries(args).map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="shrink-0 text-faint">{k}:</span>
          <span className="truncate text-ink/80" title={String(v)}>
            {String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Interceptor() {
  const request = useAegis((s) => s.request);
  const inputScan = useAegis((s) => s.inputScan);
  const intercepted = useAegis((s) => s.intercepted);
  const tool = useAegis((s) => s.tool);
  const answer = useAegis((s) => s.answer);
  const outcome = useAegis((s) => s.outcome);
  const stage = useAegis((s) => s.stage);

  if (!request) return <EmptyState />;

  const inBlocked = intercepted?.phase === "input";
  const actionBlocked = intercepted?.phase === "action";
  const outputBlocked = intercepted?.phase === "output";
  const netTone = intercepted?.result.decision === "block" ? "threat" : "warn";
  const netLabel = intercepted?.result.decision === "block" ? "BLOCKED" : "HELD";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <GateStrip />

      {/* Inbound */}
      <NodeCard>
        <div className="flex items-center justify-between">
          <h3 className="mono text-xs tracking-[0.18em] text-mute">INBOUND</h3>
          <span className="chip border-edge text-mute">{request.source}</span>
        </div>
        <pre className="mono mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink/90">
          {request.text}
        </pre>
        {inputScan?.techniques && inputScan.techniques.length > 0 && (
          <div className="mt-3 rounded-lg border border-violet/40 bg-violet/10 p-2.5">
            <div className="mono text-[11px] font-semibold tracking-wider text-violet">
              ⚗ DEOBFUSCATED · {inputScan.techniques.join(" · ")}
            </div>
            <div className="mt-1 text-[11px] text-mute">
              AEGIS unwrapped the encoded payload before matching — see the revealed
              instruction in the verdict signals.
            </div>
          </div>
        )}
        {inBlocked && <QuarantineNet label={netLabel} tone={netTone} />}
      </NodeCard>

      {inBlocked && (
        <p className="mono px-1 text-center text-[11px] text-mute">
          ⛔ Intercepted at the gate — the agent core never received this input.
        </p>
      )}

      {/* Agent reasoning */}
      <ThoughtStream />

      {/* Tool attempt */}
      {tool && (
        <NodeCard>
          <div className="flex items-center justify-between">
            <h3 className="mono text-xs tracking-[0.18em] text-mute">TOOL CALL</h3>
            <span
              className={`chip ${
                toolSpec(tool.call.tool).scope === "external"
                  ? "border-threat/40 text-threat"
                  : "border-edge text-mute"
              }`}
            >
              {toolSpec(tool.call.tool).scope.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg">{toolSpec(tool.call.tool).icon}</span>
            <span className="mono text-sm text-ink">{tool.call.tool}()</span>
            {tool.allowed ? (
              <span className="chip ml-auto border-safe/40 text-safe">✓ EXECUTED</span>
            ) : (
              <span className="chip ml-auto border-threat/40 text-threat">✕ STOPPED</span>
            )}
          </div>
          <ArgRows args={tool.call.args} />
          {actionBlocked && <QuarantineNet label={netLabel} tone={netTone} />}
        </NodeCard>
      )}

      {/* Final answer / redaction */}
      {outputBlocked && intercepted?.redacted ? (
        <NodeCard>
          <h3 className="mono text-xs tracking-[0.18em] text-mute">
            OUTGOING ANSWER · REDACTED
          </h3>
          <pre className="mono mt-3 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink/90">
            {intercepted.redacted}
          </pre>
          <div className="mt-2 text-[11px] text-warn">
            Secrets &amp; PII masked before they could leak to the requester.
          </div>
          <QuarantineNet label={netLabel} tone={netTone} />
        </NodeCard>
      ) : (
        answer && (
          <NodeCard className="border-safe/30">
            <h3 className="mono text-xs tracking-[0.18em] text-mute">
              OUTGOING ANSWER
            </h3>
            <pre className="mono mt-3 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-safe">
              {answer}
            </pre>
          </NodeCard>
        )
      )}

      {/* Outcome */}
      <AnimatePresence>
        {stage === "done" && outcome && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border ${TONE[outcomeTone(outcome)].border} ${TONE[outcomeTone(outcome)].bg} px-4 py-2.5 text-center`}
          >
            <span className={`mono text-sm font-semibold ${TONE[outcomeTone(outcome)].text}`}>
              {outcome === "allowed"
                ? "✓ REQUEST COMPLETED SAFELY"
                : outcome === "quarantined"
                  ? "⏸ HELD FOR REVIEW"
                  : "⛔ THREAT NEUTRALIZED"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
