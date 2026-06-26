import { create } from "zustand";
import { runScenario, runUserInput } from "../agent/agent";
import type { Outcome, Phase } from "../agent/agent";
import { SCENARIOS, scenarioById } from "../agent/scenarios";
import type { Scenario } from "../agent/scenarios";
import { initSemantic, semanticStatus } from "../engine";
import type { Decision, ScanResult, ThreatCategory, ToolCall } from "../engine";

export interface FeedItem {
  id: string;
  ts: number;
  label: string;
  source: string;
  phase: Phase | "final";
  decision: Decision | "allow";
  outcome: Outcome;
  category: ThreatCategory | "benign";
  score: number;
}

export type Stage =
  | "idle"
  | "inbound"
  | "input"
  | "thinking"
  | "action"
  | "output"
  | "done";

interface Counters {
  scanned: number;
  blocked: number;
  quarantined: number;
  allowed: number;
  signals: number;
}

type SemStatus = ReturnType<typeof semanticStatus>;

interface AegisState {
  sem: SemStatus;
  // current run
  activeId: string | null;
  scenario: Scenario | null;
  request: { text: string; source: string } | null;
  inputScan?: ScanResult;
  actionScan?: ScanResult;
  outputScan?: ScanResult;
  thoughts: string[];
  tool?: { call: ToolCall; allowed: boolean };
  answer?: string;
  intercepted?: { phase: Phase; result: ScanResult; redacted?: string };
  outcome?: Outcome;
  stage: Stage;
  running: boolean;
  // telemetry
  feed: FeedItem[];
  counters: Counters;
  autoDemo: boolean;
  // actions
  scenarios: Scenario[];
  initModel: () => void;
  launch: (id: string) => Promise<void>;
  launchConsole: (text: string) => Promise<void>;
  reset: () => void;
  startAutoDemo: () => Promise<void>;
  stopAutoDemo: () => void;
}

let runToken = 0;
let autoToken = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FRESH = {
  request: null,
  inputScan: undefined,
  actionScan: undefined,
  outputScan: undefined,
  thoughts: [] as string[],
  tool: undefined,
  answer: undefined,
  intercepted: undefined,
  outcome: undefined,
  stage: "idle" as Stage,
};

export const useAegis = create<AegisState>((set, get) => {
  async function consume(
    gen: AsyncGenerator<import("../agent/agent").AgentEvent>,
    meta: { label: string },
  ) {
    const my = ++runToken;
    set({ running: true, ...FRESH, stage: "inbound" });

    for await (const ev of gen) {
      if (my !== runToken) return;
      switch (ev.kind) {
        case "request":
          set({ request: { text: ev.text, source: ev.source }, stage: "input" });
          break;
        case "scan": {
          const key =
            ev.phase === "input"
              ? "inputScan"
              : ev.phase === "action"
                ? "actionScan"
                : "outputScan";
          set((s) => ({
            [key]: ev.result,
            stage: ev.phase,
            counters: { ...s.counters, scanned: s.counters.scanned + 1, signals: s.counters.signals + ev.result.signals.length },
          }) as Partial<AegisState>);
          break;
        }
        case "thought":
          set((s) => ({ thoughts: [...s.thoughts, ev.text], stage: "thinking" }));
          break;
        case "tool":
          set({ tool: { call: ev.call, allowed: ev.allowed } });
          break;
        case "answer":
          set({ answer: ev.text, stage: "output" });
          break;
        case "intercepted":
          set({
            intercepted: { phase: ev.phase, result: ev.result, redacted: ev.redacted },
            stage: ev.phase,
          });
          break;
        case "done": {
          set((s) => ({
            outcome: ev.outcome,
            stage: "done",
            running: false,
            counters: bump(s.counters, ev.outcome),
            feed: [makeFeed(get(), meta.label, ev.outcome), ...s.feed].slice(0, 40),
          }));
          break;
        }
      }
    }
  }

  return {
    sem: semanticStatus(),
    activeId: null,
    scenario: null,
    running: false,
    feed: [],
    counters: { scanned: 0, blocked: 0, quarantined: 0, allowed: 0, signals: 0 },
    autoDemo: false,
    scenarios: SCENARIOS,
    ...FRESH,

    initModel: () => {
      initSemantic((s) => set({ sem: s }));
    },

    launch: async (id: string) => {
      const scenario = scenarioById(id) ?? null;
      if (!scenario) return;
      set({ activeId: id, scenario });
      await consume(runScenario(scenario), { label: scenario.title });
    },

    launchConsole: async (text: string) => {
      if (!text.trim()) return;
      set({ activeId: "console", scenario: null });
      await consume(runUserInput(text), { label: "Live console" });
    },

    reset: () => {
      runToken++;
      set({ activeId: null, scenario: null, running: false, ...FRESH });
    },

    startAutoDemo: async () => {
      const my = ++autoToken;
      set({ autoDemo: true });
      while (my === autoToken) {
        for (const s of SCENARIOS) {
          if (my !== autoToken) break;
          await get().launch(s.id);
          await sleep(2600);
          if (my !== autoToken) break;
        }
        if (my !== autoToken) break;
        await sleep(1200);
      }
    },

    stopAutoDemo: () => {
      autoToken++;
      set({ autoDemo: false });
    },
  };
});

function bump(c: Counters, outcome: Outcome): Counters {
  return {
    ...c,
    blocked: c.blocked + (outcome === "blocked" ? 1 : 0),
    quarantined: c.quarantined + (outcome === "quarantined" ? 1 : 0),
    allowed: c.allowed + (outcome === "allowed" ? 1 : 0),
  };
}

function makeFeed(s: AegisState, label: string, outcome: Outcome): FeedItem {
  const ic = s.intercepted;
  const cat: ThreatCategory | "benign" =
    ic?.result.signals[0]?.category ?? s.scenario?.primary ?? "benign";
  const result = ic?.result;
  return {
    id: Math.random().toString(36).slice(2),
    ts: Date.now(),
    label,
    source: s.request?.source ?? "—",
    phase: ic?.phase ?? "final",
    decision: result?.decision ?? "allow",
    outcome,
    category: cat,
    score: result?.score ?? 0,
  };
}
