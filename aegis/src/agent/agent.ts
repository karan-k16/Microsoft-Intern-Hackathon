// Agent runtime — a simulated enterprise Copilot whose every input, action, and
// output is routed through AEGIS. Emits a timed event stream the UI animates.
// Verdicts are real (computed by the engine); only pacing + narrative are scripted.

import { scanAction, scanInput, scanOutput } from "../engine";
import type { ScanResult, ToolCall } from "../engine";
import type { Scenario } from "./scenarios";

export type Outcome = "allowed" | "blocked" | "quarantined";
export type Phase = "input" | "action" | "output";

export type AgentEvent =
  | { kind: "request"; text: string; source: string }
  | { kind: "scan"; phase: Phase; subject: string; result: ScanResult }
  | { kind: "thought"; text: string }
  | { kind: "tool"; call: ToolCall; allowed: boolean }
  | { kind: "answer"; text: string }
  | { kind: "intercepted"; phase: Phase; result: ScanResult; redacted?: string }
  | { kind: "done"; outcome: Outcome };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function outcomeFrom(result: ScanResult): Outcome {
  return result.decision === "block" ? "blocked" : "quarantined";
}

export async function* runScenario(s: Scenario): AsyncGenerator<AgentEvent> {
  yield { kind: "request", text: s.input, source: s.source };
  await sleep(450);

  const inScan = await scanInput(s.input);
  yield { kind: "scan", phase: "input", subject: s.source, result: inScan };
  await sleep(350);

  if (inScan.decision !== "allow") {
    yield { kind: "intercepted", phase: "input", result: inScan };
    yield { kind: "done", outcome: outcomeFrom(inScan) };
    return;
  }

  for (const t of s.thoughts) {
    yield { kind: "thought", text: t };
    await sleep(620);
  }

  if (s.action) {
    const actScan = scanAction(s.action);
    yield { kind: "scan", phase: "action", subject: s.action.tool, result: actScan };
    await sleep(320);
    if (actScan.decision !== "allow") {
      yield { kind: "tool", call: s.action, allowed: false };
      yield { kind: "intercepted", phase: "action", result: actScan };
      yield { kind: "done", outcome: outcomeFrom(actScan) };
      return;
    }
    yield { kind: "tool", call: s.action, allowed: true };
    await sleep(360);
  }

  if (s.answer) {
    const outScan = scanOutput(s.answer);
    yield { kind: "scan", phase: "output", subject: "final answer", result: outScan };
    await sleep(320);
    if (outScan.decision !== "allow") {
      yield {
        kind: "intercepted",
        phase: "output",
        result: outScan,
        redacted: outScan.redacted,
      };
      yield { kind: "done", outcome: outcomeFrom(outScan) };
      return;
    }
    yield { kind: "answer", text: s.answer };
  }

  yield { kind: "done", outcome: "allowed" };
}

/** Live console: route arbitrary judge-supplied input through the input guard. */
export async function* runUserInput(text: string): AsyncGenerator<AgentEvent> {
  yield { kind: "request", text, source: "Console (live)" };
  await sleep(250);

  const inScan = await scanInput(text);
  yield { kind: "scan", phase: "input", subject: "console", result: inScan };
  await sleep(250);

  if (inScan.decision !== "allow") {
    yield { kind: "intercepted", phase: "input", result: inScan };
    yield { kind: "done", outcome: outcomeFrom(inScan) };
    return;
  }

  yield { kind: "thought", text: "Input cleared every guard. Handling the request normally…" };
  await sleep(500);
  yield {
    kind: "answer",
    text: "✅ This request looks safe — the agent would now respond as usual.",
  };
  yield { kind: "done", outcome: "allowed" };
}
