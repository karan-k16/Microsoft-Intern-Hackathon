import { motion } from "framer-motion";

const HEX: Record<string, string> = {
  scan: "#4d8dff",
  safe: "#2ee6c0",
  warn: "#ffb020",
  threat: "#ff2d6b",
};

/** A thin light bar that sweeps top→bottom to signal active scanning. */
export function ScanSweep({ tone = "scan" }: { tone?: "scan" | "safe" | "warn" | "threat" }) {
  const c = HEX[tone];
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20"
      style={{
        background: `linear-gradient(180deg, transparent, ${c}1f 45%, ${c}40 50%, ${c}1f 55%, transparent)`,
      }}
      initial={{ y: "-40%", opacity: 0 }}
      animate={{ y: "150%", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
    />
  );
}
