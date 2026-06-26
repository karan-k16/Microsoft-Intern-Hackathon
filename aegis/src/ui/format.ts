import type { Decision, Severity } from "../engine";

export type Tone = "safe" | "warn" | "threat" | "scan" | "violet" | "mute";

// Literal class strings so Tailwind's scanner picks them up.
export const TONE: Record<
  Tone,
  { text: string; bg: string; border: string; glow: string; dot: string }
> = {
  safe: { text: "text-safe", bg: "bg-safe/10", border: "border-safe/40", glow: "glow-safe", dot: "bg-safe" },
  warn: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/40", glow: "glow-warn", dot: "bg-warn" },
  threat: { text: "text-threat", bg: "bg-threat/10", border: "border-threat/40", glow: "glow-threat", dot: "bg-threat" },
  scan: { text: "text-scan", bg: "bg-scan/10", border: "border-scan/40", glow: "glow-scan", dot: "bg-scan" },
  violet: { text: "text-violet", bg: "bg-violet/10", border: "border-violet/40", glow: "", dot: "bg-violet" },
  mute: { text: "text-mute", bg: "bg-white/5", border: "border-edge", glow: "", dot: "bg-mute" },
};

export function decisionTone(d: Decision | "allow"): Tone {
  return d === "allow" ? "safe" : d === "quarantine" ? "warn" : "threat";
}

export const DECISION_LABEL: Record<Decision, string> = {
  allow: "ALLOW",
  quarantine: "QUARANTINE",
  block: "BLOCK",
};

export function sevTone(s: Severity): Tone {
  if (s === "critical" || s === "high") return "threat";
  if (s === "medium") return "warn";
  if (s === "low") return "scan";
  return "mute";
}

export const LAYER_META: Record<string, { label: string; tone: Tone }> = {
  normalizer: { label: "NORMALIZER", tone: "violet" },
  heuristic: { label: "HEURISTIC", tone: "scan" },
  semantic: { label: "SEMANTIC AI", tone: "violet" },
  "output-guard": { label: "OUTPUT GUARD", tone: "threat" },
  pii: { label: "PII / SECRETS", tone: "warn" },
};

export function outcomeTone(o: string): Tone {
  return o === "allowed" ? "safe" : o === "quarantined" ? "warn" : "threat";
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}
