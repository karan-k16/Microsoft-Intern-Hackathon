import { motion } from "framer-motion";

const HEX: Record<string, string> = {
  threat: "#ff2d6b",
  warn: "#ffb020",
  safe: "#2ee6c0",
  scan: "#4d8dff",
};

export function QuarantineNet({
  label,
  tone = "threat",
}: {
  label: string;
  tone?: "threat" | "warn" | "safe" | "scan";
}) {
  const c = HEX[tone];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl"
    >
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${c}26 0 2px, transparent 2px 13px), repeating-linear-gradient(-45deg, ${c}26 0 2px, transparent 2px 13px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 70px ${c}55, inset 0 0 0 1px ${c}88` }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: -7 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="mono rounded-lg border-2 bg-void/40 px-4 py-1.5 text-2xl font-extrabold backdrop-blur-sm"
          style={{ color: c, borderColor: c, textShadow: `0 0 20px ${c}aa` }}
        >
          🔒 {label}
        </motion.div>
      </div>
    </motion.div>
  );
}
