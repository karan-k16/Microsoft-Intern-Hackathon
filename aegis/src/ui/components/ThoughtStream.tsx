import { AnimatePresence, motion } from "framer-motion";
import { useAegis } from "../../store/useAegis";
import { useTypewriter } from "../useTypewriter";

function ThoughtLine({ text, active }: { text: string; active: boolean }) {
  const typed = useTypewriter(text);
  const display = active ? typed : text;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2 text-ink/90"
    >
      <span className="text-scan">›</span>
      <span>
        {display}
        {active && <span className="caret" />}
      </span>
    </motion.div>
  );
}

export function ThoughtStream() {
  const thoughts = useAegis((s) => s.thoughts);
  const stage = useAegis((s) => s.stage);
  if (thoughts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel relative overflow-hidden p-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">🧠</span>
        <h3 className="mono text-xs tracking-[0.18em] text-mute">
          AGENT REASONING · INTERCEPTED STREAM
        </h3>
        <span className="ml-auto h-2 w-2 rounded-full bg-violet pulse-ring" />
      </div>
      <div className="mono mt-3 flex flex-col gap-1.5 text-[13px] leading-relaxed">
        <AnimatePresence initial={false}>
          {thoughts.map((t, i) => (
            <ThoughtLine
              key={i}
              text={t}
              active={i === thoughts.length - 1 && stage === "thinking"}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
