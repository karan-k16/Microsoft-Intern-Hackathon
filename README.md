<div align="center">

# 🛡️ AEGIS — The Firewall for AI Agents

### A real-time security gateway that sits in front of any AI agent and intercepts prompt injection, jailbreaks, data exfiltration, and secret/PII leakage — **before** they reach the model or leave it.

**Global Intern Hackathon 2026 · Challenge: Security & Trustworthy Systems**

*Runs 100% locally — no API keys, no accounts, no data ever leaves the machine.*

**▶ [Watch the demo video](aegis/docs/video/AEGIS-demo.mp4)**

</div>

---

## The problem(s)

Microsoft is putting AI agents everywhere — Copilot, Microsoft Foundry, Copilot Studio. But agents introduce a brand-new attack surface that traditional security tools don't cover. **Prompt injection is ranked #1 (LLM01) on the OWASP Top 10 for LLM Applications**, and there's currently no "firewall" between an enterprise's agents and the untrusted text they ingest from users, documents, web pages, and tool outputs.

A single poisoned email, support ticket, or RAG document can hijack an agent into leaking its system prompt, exfiltrating the customer database, or pasting secrets into a reply. Today most teams ship agents with **nothing** in front of them.

## What we built

**AEGIS is a security gateway for AI agents.** Every inbound message, every tool call the agent attempts, and every answer it produces is routed through AEGIS first. It's defense-in-depth, mapped onto the agent's lifecycle:

```
 ┌──────────┐   🛡️ INPUT GUARD    ┌───────────┐   🚦 OUTPUT GUARD   ┌──────────┐
 │ User /    │ ─ normalize ──────▶ │  AI Agent │ ─ action guard ───▶ │ Tools /  │
 │ Document /│   heuristics        │  (Copilot)│   output guard      │ Reply    │
 │ Tool data │   semantic AI       └───────────┘                     └──────────┘
 └──────────┘        │                                    │
                 BLOCK / QUARANTINE / ALLOW          BLOCK / REDACT
```

The interface is a live **"interceptor"** command deck: you watch the agent's reasoning stream in real time, and when something malicious appears it gets caught in a glowing **quarantine net** with an explain-why verdict — so a human can see *exactly* what was caught and why.

![AEGIS blocking a direct prompt injection](aegis/docs/screens/02-injection.png)

## How it works — 5 detection layers

| Layer | What it catches |
|-------|-----------------|
| **Normalizer** | Unwraps evasion: base64, hex, URL-encoding, leetspeak, homoglyphs, zero-width chars — *then* scans the revealed payload |
| **Heuristics** | High-precision pattern families: instruction override, jailbreak/DAN, system-prompt extraction, exfil directives, boundary spoofing |
| **Semantic AI** | Local sentence-embedding model (`all-MiniLM-L6-v2` via transformers.js) catches *paraphrased / novel* attacks regex misses — with a deterministic lexical fallback so it never fails offline |
| **Output / Action Guard** | Blocks unauthorized tools, untrusted egress domains, and bulk data exfiltration **before the tool executes** |
| **Secret / PII Guard** | Detects & **redacts** API keys, tokens, private keys, SSNs, and card numbers in the agent's reply |

A policy engine fuses the signals into an explainable **ALLOW / QUARANTINE / BLOCK** verdict with a threat score.

### Defense-in-depth, demonstrated

Some attacks slip past input scanning — AEGIS catches them later. A poisoned RAG document that *looks* benign on input gets blocked when the agent tries to email the customer database to an external address:

![AEGIS blocking data exfiltration from a poisoned document](aegis/docs/screens/04-rag-exfil.png)

And when an agent is about to leak secrets in its reply, AEGIS redacts them in flight:

![AEGIS redacting secrets and PII in the agent's answer](aegis/docs/screens/05-leak-redacted.png)

## Why "fully local" is a feature, not a limitation

AEGIS performs **zero external calls** — the heuristics, the deobfuscation, and even the neural model all run on-device (the model runs in-browser via WebAssembly). For a security product that inspects your most sensitive traffic, "no data ever leaves your network, no third-party API, no key to leak" is exactly the trust posture enterprises require. It deploys into air-gapped and regulated environments unchanged.

## The detection is real

Every verdict in the demo is computed live by the engine — nothing is hard-coded. A self-test runs all 7 attack scenarios end-to-end through the real scanner:

```
PASS  direct-injection      blocked   PASS  indirect-injection   blocked (action guard)
PASS  jailbreak-dan         blocked   PASS  secret-leak          blocked (output redacted)
PASS  system-prompt-exfil   blocked   PASS  benign               allowed
PASS  obfuscated-injection  blocked
7/7 scenarios match expected outcome.
```

Run it yourself: `npm run selftest` (from `aegis/`).

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · transformers.js (`@huggingface/transformers`) — all local, no backend required for the demo.

## Run it

```bash
cd aegis
npm install
npm run dev      # http://localhost:5173
```

Build for production: `npm run build`.

## Demo video — produced entirely by code

The demo video was generated end-to-end with zero manual editing:

```bash
cd aegis
npm run video    # Edge-TTS narration -> Playwright screen recording -> ffmpeg mux -> MP4
```

`narrate` synthesizes per-scene narration with Edge neural voices (no key), `record`
drives the live app on a timeline with Playwright and screen-records it, and `mux`
lays the narration over the video with ffmpeg. Output: `docs/video/AEGIS-demo.mp4`.

## Business value for Microsoft

- **Unlocks safe enterprise agent adoption.** The #1 blocker to deploying Copilot/Foundry agents on sensitive data is exactly the risk class AEGIS mitigates. Removing that blocker drives Azure, Foundry, and Copilot consumption.
- **Directly aligned with the Secure Future Initiative** — security and trust as a default, not an add-on.
- **A natural product surface**: an "Agent Gateway" / Defender-for-AI-Agents control plane, or a Foundry guardrail SDK.

**Target customer:** any enterprise deploying AI agents on internal or customer data — and the Microsoft product teams shipping the agent platforms themselves.

## Next steps

- Server-side sidecar/reverse-proxy deployment (the demo runs client-side for portability; production sits inline as a gateway in front of the agent runtime).
- Pluggable policy packs per industry (finance, healthcare) and per-tenant egress allow-lists.
- Telemetry export to Microsoft Sentinel / Defender; analyst review queue for quarantined traffic.
- Expand the semantic corpus and add a fine-tuned on-device classifier.

---

<div align="center">
<i>Built for the Microsoft Global Intern Hackathon 2026.</i>
</div>
