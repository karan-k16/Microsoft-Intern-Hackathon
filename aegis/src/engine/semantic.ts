// Semantic detection layer.
//
// Two modes, with automatic graceful degradation:
//   neural  — local sentence embeddings via transformers.js (all-MiniLM-L6-v2),
//             runs fully in-browser (WASM), no API key, no account.
//   lexical — deterministic token/char-similarity fallback that works offline
//             and never fails. Ensures the demo is bulletproof.

import { TEMPLATES } from "./templates";
import { CATEGORY_LABEL, SEVERITY_WEIGHT } from "./types";
import type { Severity, Signal } from "./types";

export type SemanticMode = "neural" | "lexical";
export type LoadState = "idle" | "loading" | "ready" | "failed";

export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

interface Status {
  loadState: LoadState;
  mode: SemanticMode;
  progress: number;
  model: string;
}

const status: Status = {
  loadState: "idle",
  mode: "lexical",
  progress: 0,
  model: MODEL_ID,
};

export function semanticStatus(): Status {
  return { ...status };
}

// ── neural backing ───────────────────────────────────────────────────────────
let extractor: ((t: string, o: unknown) => Promise<{ data: Float32Array }>) | null =
  null;
const templateVecs: { id: string; vec: Float32Array }[] = [];

type ProgressCb = (s: Status) => void;

export async function initSemantic(onProgress?: ProgressCb): Promise<void> {
  if (status.loadState === "loading" || status.loadState === "ready") return;
  status.loadState = "loading";
  onProgress?.(semanticStatus());
  try {
    const mod = await import("@huggingface/transformers");
    const pipe = await mod.pipeline("feature-extraction", MODEL_ID, {
      progress_callback: (p: unknown) => {
        const prog = (p as { progress?: number }).progress;
        if (typeof prog === "number") {
          status.progress = Math.round(prog);
          onProgress?.(semanticStatus());
        }
      },
    });
    extractor = pipe as unknown as typeof extractor;
    for (const t of TEMPLATES) {
      templateVecs.push({ id: t.id, vec: await embed(t.text) });
    }
    status.mode = "neural";
    status.loadState = "ready";
    status.progress = 100;
  } catch {
    // Offline or unsupported — stay in deterministic lexical mode.
    status.mode = "lexical";
    status.loadState = "failed";
  }
  onProgress?.(semanticStatus());
}

async function embed(text: string): Promise<Float32Array> {
  const out = await extractor!(text, { pooling: "mean", normalize: true });
  return out.data;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are L2-normalized
}

// ── lexical fallback ─────────────────────────────────────────────────────────
const STOP = new Set([
  "the", "a", "an", "to", "of", "and", "or", "your", "you", "is", "are", "my",
  "me", "i", "it", "that", "this", "for", "with", "please", "can", "could",
  "would", "will", "do", "does", "all", "any", "as", "be", "so", "if",
]);

function toks(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => !STOP.has(t));
}
function bigrams(t: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t[i] + " " + t[i + 1]);
  return out;
}
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return (2 * inter) / (a.size + b.size);
}
function charTris(s: string): Set<string> {
  const g = new Set<string>();
  const p = "  " + s.toLowerCase().replace(/[^a-z0-9]+/g, " ") + "  ";
  for (let i = 0; i < p.length - 2; i++) g.add(p.slice(i, i + 3));
  return g;
}
function lexicalSim(a: string, b: string): number {
  const ta = toks(a);
  const tb = toks(b);
  const uni = dice(new Set(ta), new Set(tb));
  const bi = dice(new Set(bigrams(ta)), new Set(bigrams(tb)));
  const tri = dice(charTris(a), charTris(b));
  return 0.45 * uni + 0.2 * bi + 0.35 * tri;
}

// ── public scan ──────────────────────────────────────────────────────────────
export async function runSemantic(text: string): Promise<Signal[]> {
  if (text.trim().length < 3) return [];

  let bestSim = 0;
  let bestId = "";

  if (status.mode === "neural" && extractor) {
    try {
      const v = await embed(text);
      for (const tv of templateVecs) {
        const s = cosine(v, tv.vec);
        if (s > bestSim) {
          bestSim = s;
          bestId = tv.id;
        }
      }
    } catch {
      status.mode = "lexical";
    }
  }

  if (status.mode !== "neural") {
    for (const t of TEMPLATES) {
      const s = lexicalSim(text, t.text);
      if (s > bestSim) {
        bestSim = s;
        bestId = t.id;
      }
    }
  }

  const neural = status.mode === "neural";
  const threshold = neural ? 0.5 : 0.42;
  const tmpl = TEMPLATES.find((t) => t.id === bestId);
  if (!tmpl || bestSim < threshold) return [];

  const highCut = neural ? 0.72 : 0.62;
  const severity: Severity = bestSim >= highCut ? "high" : "medium";

  return [
    {
      id: "sem:" + tmpl.id,
      layer: "semantic",
      category: tmpl.category,
      severity,
      title: `Semantic match · ${tmpl.label}`,
      detail: `${neural ? "Neural embedding" : "Lexical"} similarity ${Math.round(
        bestSim * 100,
      )}% to a known ${CATEGORY_LABEL[tmpl.category]} pattern${
        neural ? "" : " (heuristic mode)"
      }.`,
      score: SEVERITY_WEIGHT[severity] * Math.min(1, bestSim + 0.15),
    },
  ];
}
