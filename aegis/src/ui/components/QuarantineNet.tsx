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
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ x: 0 }}
        animate={{ x: [0, -6, 6, -4, 2, 0] }}
        transition={{ duration: 0.45 }}
      >
        {/* impact flash */}
        <motion.div
          className="absolute inset-0"
          style={{ background: c }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
        {/* flowing mesh */}
        <motion.div
          initial={{ scale: 1.18, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="qnet-mesh absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${c}29 0 2px, transparent 2px 13px), repeating-linear-gradient(-45deg, ${c}29 0 2px, transparent 2px 13px)`,
          }}
        />
        {/* inner glow */}
        <div
          className="absolute inset-0"
          style={{ boxShadow: `inset 0 0 70px ${c}55, inset 0 0 0 1px ${c}88` }}
        />
        {/* shock rings */}
        {[0, 0.45].map((d, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60, border: `2px solid ${c}` }}
            initial={{ scale: 0.3, opacity: 0.55 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: d, ease: "easeOut" }}
          />
        ))}
        {/* stamp */}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -16 }}
            animate={{ scale: [0.4, 1.14, 1], opacity: 1, rotate: [-16, -5, -7] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="mono rounded-lg border-2 bg-void/45 px-4 py-1.5 text-2xl font-extrabold backdrop-blur-sm"
            style={{ color: c, borderColor: c, textShadow: `0 0 22px ${c}` }}
          >
            🔒 {label}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
