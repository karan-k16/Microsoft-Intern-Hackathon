// Heuristic scanner — runs the pattern library across every normalized surface.

import { PATTERNS } from "./patterns";
import type { NormalizeResult } from "./normalize";
import { SEVERITY_WEIGHT } from "./types";
import type { Direction, Severity, Signal } from "./types";

function bump(sev: Severity): Severity {
  const order: Severity[] = ["info", "low", "medium", "high", "critical"];
  const i = order.indexOf(sev);
  return order[Math.min(i + 1, order.length - 1)];
}

export function runHeuristics(
  norm: NormalizeResult,
  direction: Direction,
): Signal[] {
  const signals: Signal[] = [];
  const seen = new Set<string>();
  let obfuscatedHit: string | null = null;

  for (const rule of PATTERNS) {
    if (rule.direction && rule.direction !== direction) continue;
    if (seen.has(rule.id)) continue;

    for (const surface of norm.surfaces) {
      const m = rule.regex.exec(surface.text);
      if (!m) continue;

      const obfuscated = surface.name !== "raw" && surface.name !== "canonical";
      // Hiding an attack behind encoding is itself strong evidence of intent.
      const severity = obfuscated ? bump(rule.severity) : rule.severity;
      if (obfuscated) obfuscatedHit = surface.name;

      signals.push({
        id: `heur:${rule.id}`,
        layer: "heuristic",
        category: rule.category,
        severity,
        title: rule.title,
        detail: obfuscated
          ? `${rule.detail} Hidden payload revealed after deobfuscation (${surface.name}).`
          : rule.detail,
        match: m[0].replace(/\s+/g, " ").trim().slice(0, 140),
        surface: surface.name,
        score: SEVERITY_WEIGHT[severity],
      });
      seen.add(rule.id);
      break;
    }
  }

  if (obfuscatedHit) {
    signals.unshift({
      id: "heur:obfuscation",
      layer: "normalizer",
      category: "obfuscation",
      severity: "high",
      title: "Obfuscated payload",
      detail: `Input concealed an instruction using ${norm.techniques.join(", ")}. AEGIS unwrapped it before matching.`,
      surface: obfuscatedHit,
      score: SEVERITY_WEIGHT.high,
    });
  }

  return signals;
}
