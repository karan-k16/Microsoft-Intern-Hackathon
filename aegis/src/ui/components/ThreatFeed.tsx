import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAegis } from "../../store/useAegis";
import { CATEGORY_LABEL } from "../../engine";
import { TONE, outcomeTone, timeAgo } from "../format";

function Stat({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE }) {
  return (
    <div className="rounded-xl border border-edge bg-void/40 px-2 py-2 text-center">
      <div className={`mono text-xl font-bold tabular-nums ${TONE[tone].text}`}>{value}</div>
      <div className="mono text-[9px] tracking-wider text-mute">{label}</div>
    </div>
  );
}

export function ThreatFeed() {
  const counters = useAegis((s) => s.counters);
  const feed = useAegis((s) => s.feed);
  // re-render every few seconds so "Ns ago" stays fresh
  const [, tick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <section className="panel flex flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="mono text-xs tracking-[0.18em] text-mute">THREAT FEED</h2>
        <span className="mono text-[11px] text-mute">{counters.signals} signals</span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Stat label="SCANNED" value={counters.scanned} tone="scan" />
        <Stat label="BLOCKED" value={counters.blocked} tone="threat" />
        <Stat label="HELD" value={counters.quarantined} tone="warn" />
        <Stat label="ALLOWED" value={counters.allowed} tone="safe" />
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
        {feed.length === 0 ? (
          <div className="grid h-full place-items-center py-6 text-center text-xs text-faint">
            No events yet — interceptions will stream here.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {feed.map((f) => {
                const tone = outcomeTone(f.outcome);
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-edge bg-void/40 px-2.5 py-1.5"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${TONE[tone].dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-ink">{f.label}</span>
                      <span className="mono block truncate text-[10px] text-mute">
                        {CATEGORY_LABEL[f.category]} · {f.source}
                      </span>
                    </span>
                    <span className={`mono text-[10px] uppercase ${TONE[tone].text}`}>
                      {f.outcome}
                    </span>
                    <span className="mono w-12 shrink-0 text-right text-[10px] text-faint">
                      {timeAgo(f.ts)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
