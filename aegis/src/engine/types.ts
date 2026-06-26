// AEGIS detection engine — shared types.

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Decision = "allow" | "quarantine" | "block";
export type Direction = "input" | "output";

export type Layer =
  | "normalizer"
  | "heuristic"
  | "semantic"
  | "output-guard"
  | "pii";

export type ThreatCategory =
  | "prompt-injection"
  | "jailbreak"
  | "system-prompt-exfil"
  | "data-exfiltration"
  | "secret-leak"
  | "pii-leak"
  | "unauthorized-tool"
  | "obfuscation"
  | "benign";

export interface Signal {
  id: string;
  layer: Layer;
  category: ThreatCategory;
  severity: Severity;
  /** Short label, e.g. "Instruction override". */
  title: string;
  /** Human-readable explanation of why this fired. */
  detail: string;
  /** The offending substring, if any. */
  match?: string;
  /** Which normalized surface it matched on (raw, canonical, decoded…). */
  surface?: string;
  /** 0..1 contribution to the aggregate threat score. */
  score: number;
}

export interface ScanResult {
  direction: Direction;
  decision: Decision;
  /** 0..1 aggregate threat score. */
  score: number;
  signals: Signal[];
  /** Aggressively normalized text used for matching (if it differs from raw). */
  normalized?: string;
  /** Obfuscation/encoding techniques that were unwrapped. */
  techniques: string[];
  /** Output with secrets/PII masked (output scans only). */
  redacted?: string;
  durationMs: number;
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 1,
  high: 0.8,
  medium: 0.55,
  low: 0.3,
  info: 0.1,
};

export const CATEGORY_LABEL: Record<ThreatCategory, string> = {
  "prompt-injection": "Prompt Injection",
  jailbreak: "Jailbreak",
  "system-prompt-exfil": "System-Prompt Exfiltration",
  "data-exfiltration": "Data Exfiltration",
  "secret-leak": "Secret Leak",
  "pii-leak": "PII Leak",
  "unauthorized-tool": "Unauthorized Tool Use",
  obfuscation: "Obfuscation",
  benign: "Benign",
};

export const DECISION_COLOR: Record<Decision, string> = {
  allow: "safe",
  quarantine: "warn",
  block: "threat",
};
