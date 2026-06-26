import { motion } from "framer-motion";
import type { Signal } from "../../engine";
import { LAYER_META, TONE, sevTone } from "../format";

export function SignalCard({ sig, index }: { sig: Signal; index: number }) {
  const layer = LAYER_META[sig.layer] ?? { label: sig.layer.toUpperCase(), tone: "mute" as const };
  const st = sevTone(sig.severity);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border ${TONE[st].border} ${TONE[st].bg} p-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`chip ${TONE[layer.tone].border} ${TONE[layer.tone].text}`}>
          {layer.label}
        </span>
        <span className={`mono text-[10px] font-semibold uppercase tracking-wider ${TONE[st].text}`}>
          {sig.severity}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-ink">{sig.title}</div>
      <div className="mt-1 text-xs leading-relaxed text-mute">{sig.detail}</div>
      {sig.match && (
        <div
          className="mono mt-2 truncate rounded bg-void/70 px-2 py-1 text-[11px] text-threat"
          title={sig.match}
        >
          “{sig.match}”
        </div>
      )}
    </motion.div>
  );
}
