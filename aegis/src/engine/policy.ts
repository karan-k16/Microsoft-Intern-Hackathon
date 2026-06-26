// Policy engine — aggregates signals into a decision + threat score.

import type { Decision, Direction, Signal } from "./types";

export interface Verdict {
  decision: Decision;
  /** 0..1 aggregate threat score (noisy-OR over signal contributions). */
  score: number;
}

export function decide(signals: Signal[], _direction: Direction): Verdict {
  let score = 0;
  let hasCritical = false;

  for (const s of signals) {
    // Noisy-OR accumulation: each signal raises the score with diminishing return.
    score = score + s.score * (1 - score);
    if (s.severity === "critical") hasCritical = true;
  }

  score = Math.min(1, score);

  let decision: Decision = "allow";
  if (hasCritical || score >= 0.7) decision = "block";
  else if (score >= 0.34) decision = "quarantine";

  return { decision, score };
}
