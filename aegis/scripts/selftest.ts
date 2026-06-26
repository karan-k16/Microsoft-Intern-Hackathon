// Self-test: runs every scenario through the real engine and prints verdicts.
// Run: npx esbuild scripts/selftest.ts --bundle --platform=node --format=esm \
//        --external:@huggingface/transformers --outfile=scripts/_selftest.mjs && node scripts/_selftest.mjs

import { SCENARIOS } from "../src/agent/scenarios";
import { scanAction, scanInput, scanOutput } from "../src/engine";

async function run() {
  let pass = 0;
  for (const s of SCENARIOS) {
    const inp = await scanInput(s.input);
    let final = inp.decision;
    let detail = `input=${inp.decision}(${inp.score.toFixed(2)}) [${inp.signals
      .map((x) => x.id)
      .join(",")}]`;

    if (inp.decision === "allow" && s.action) {
      const a = scanAction(s.action);
      detail += ` | action:${s.action.tool}=${a.decision}(${a.score.toFixed(2)})`;
      if (a.decision !== "allow") final = a.decision;
    }
    if (final === "allow" && s.answer) {
      const o = scanOutput(s.answer);
      detail += ` | output=${o.decision}(${o.score.toFixed(2)})`;
      if (o.decision !== "allow") final = o.decision;
    }

    const got = final === "block" ? "blocked" : final === "quarantine" ? "quarantined" : "allowed";
    const ok = got === s.expected;
    if (ok) pass++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${s.id.padEnd(22)} got=${got.padEnd(11)} want=${s.expected.padEnd(11)}  ${detail}`);
  }
  console.log(`\n${pass}/${SCENARIOS.length} scenarios match expected outcome.`);
}

run();
