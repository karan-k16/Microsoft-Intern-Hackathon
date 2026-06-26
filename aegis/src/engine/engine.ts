// Engine orchestrator — the public scanning API used by the agent runtime + UI.

import { normalize } from "./normalize";
import { runHeuristics } from "./heuristics";
import { runSemantic } from "./semantic";
import {
  DEFAULT_POLICY,
  redact,
  scanTextForLeaks,
  scanToolCall,
} from "./outputGuard";
import type { AgentPolicy, ToolCall } from "./outputGuard";
import { decide } from "./policy";
import type { ScanResult } from "./types";

const round = (n: number) => Math.round(n * 100) / 100;

/** Scan an inbound message (user turn or untrusted tool/content). Async: runs the semantic layer. */
export async function scanInput(text: string): Promise<ScanResult> {
  const t0 = performance.now();
  const norm = normalize(text);
  const heur = runHeuristics(norm, "input");

  // Give the semantic layer the revealed payload when input was obfuscated.
  const decoded = norm.surfaces
    .filter((s) => s.name.startsWith("decoded"))
    .map((s) => s.text);
  const semTarget = decoded.length ? decoded.join(" ") : norm.canonical;
  const sem = await runSemantic(semTarget);

  const signals = [...heur, ...sem];
  const { decision, score } = decide(signals, "input");

  // Only report an *encoding* technique if it actually surfaced a detection —
  // otherwise incidental digits/@ in normal text would look "deobfuscated".
  const SURFACE_FOR: Record<string, string> = {
    base64: "decoded:b64",
    "url-encoding": "decoded:url",
    hex: "decoded:hex",
    leetspeak: "deleet",
  };
  const matchedSurfaces = new Set(
    signals.map((s) => s.surface).filter(Boolean) as string[],
  );
  const techniques = norm.techniques.filter((t) => {
    const surf = SURFACE_FOR[t];
    return surf ? matchedSurfaces.has(surf) : true; // zero-width/homoglyph always kept
  });

  return {
    direction: "input",
    decision,
    score,
    signals,
    normalized: techniques.length ? norm.canonical : undefined,
    techniques,
    durationMs: round(performance.now() - t0),
  };
}

/** Scan a proposed tool/action before it executes. Synchronous. */
export function scanAction(
  call: ToolCall,
  policy: AgentPolicy = DEFAULT_POLICY,
): ScanResult {
  const t0 = performance.now();
  const signals = scanToolCall(call, policy);
  const { decision, score } = decide(signals, "output");
  return {
    direction: "output",
    decision,
    score,
    signals,
    techniques: [],
    durationMs: round(performance.now() - t0),
  };
}

/** Scan a final natural-language answer for secret / PII leakage. Synchronous. */
export function scanOutput(text: string): ScanResult {
  const t0 = performance.now();
  const signals = scanTextForLeaks(text, "output");
  const { decision, score } = decide(signals, "output");
  return {
    direction: "output",
    decision,
    score,
    signals,
    techniques: [],
    redacted: decision !== "allow" ? redact(text) : undefined,
    durationMs: round(performance.now() - t0),
  };
}
