// Heuristic pattern library. High-precision regexes for known attack families.
// Kept deterministic so the demo never depends on the network or a model.

import type { Direction, Severity, ThreatCategory } from "./types";

export interface PatternRule {
  id: string;
  category: ThreatCategory;
  severity: Severity;
  title: string;
  detail: string;
  regex: RegExp;
  /** If set, only evaluated for this direction. */
  direction?: Direction;
}

export const PATTERNS: PatternRule[] = [
  // ── Instruction override / prompt injection ────────────────────────────────
  {
    id: "instr-override",
    category: "prompt-injection",
    severity: "high",
    title: "Instruction override",
    detail:
      "Attempts to cancel the agent's existing instructions — the classic prompt-injection opener.",
    regex:
      /\b(ignore|disregard|forget|override|nevermind|drop)\b[\s\S]{0,40}\b(previous|prior|earlier|above|all|the)\b[\s\S]{0,24}\b(instruction|prompt|rule|direction|context|message)s?\b/i,
  },
  {
    id: "new-instructions",
    category: "prompt-injection",
    severity: "medium",
    title: "Injected new directive",
    detail:
      "Tries to install fresh instructions that supersede the system policy.",
    regex:
      /\b(new|updated|real|actual)\b[\s\S]{0,16}\b(instruction|task|directive|rule)s?\b[\s\S]{0,16}\b(are|is|follow|obey)\b/i,
  },
  {
    id: "boundary-spoof",
    category: "prompt-injection",
    severity: "high",
    title: "Prompt-boundary spoofing",
    detail:
      "Injects fake system/role delimiters to impersonate the trusted system prompt.",
    regex:
      /(\[\s*system\s*\]|<\s*\/?\s*system\s*>|###\s*system|<\|\s*im_start\s*\|>|<\|\s*system\s*\|>|^\s*system\s*:)/im,
  },

  // ── System-prompt exfiltration ─────────────────────────────────────────────
  {
    id: "sysprompt-exfil",
    category: "system-prompt-exfil",
    severity: "high",
    title: "System-prompt extraction",
    detail:
      "Attempts to make the agent disclose its hidden system prompt / instructions.",
    regex:
      /\b(reveal|show|print|repeat|display|expose|leak|tell me|what (is|are|were))\b[\s\S]{0,40}\b(system prompt|system message|your (instruction|prompt|rule|system|config)|initial (instruction|prompt)|the (prompt|text|words) above)\b/i,
  },
  {
    id: "repeat-above",
    category: "system-prompt-exfil",
    severity: "medium",
    title: "Verbatim context echo",
    detail:
      "Classic 'repeat the words above' trick used to dump hidden context.",
    regex:
      /\b(repeat|print|output|echo)\b[\s\S]{0,24}\b(words?|text|everything|content)\b[\s\S]{0,16}\b(above|before|verbatim)\b/i,
  },

  // ── Jailbreak / guardrail bypass ───────────────────────────────────────────
  {
    id: "persona-jailbreak",
    category: "jailbreak",
    severity: "high",
    title: "Persona jailbreak",
    detail:
      "Reassigns the agent to an unrestricted persona (DAN / developer mode / etc.).",
    regex:
      /\b(you are now|act as|pretend (to be|you are)|roleplay as|from now on,? you are|enable)\b[\s\S]{0,48}\b(dan|do anything now|unrestricted|jailbroken|developer mode|god mode|no (restriction|filter|rule|guideline|limit)|without (restriction|filter|rule|guideline|limit))\b/i,
  },
  {
    id: "dan-keyword",
    category: "jailbreak",
    severity: "high",
    title: "Known jailbreak signature",
    detail: "Matches a well-known jailbreak token (DAN / 'do anything now').",
    regex: /\b(d\.?a\.?n\b|do anything now|stay in character|jailbreak)\b/i,
  },
  {
    id: "safety-bypass",
    category: "jailbreak",
    severity: "high",
    title: "Guardrail bypass",
    detail: "Explicitly asks to disable safety, moderation, or guardrails.",
    regex:
      /\b(bypass|circumvent|disable|turn off|ignore|remove)\b[\s\S]{0,24}\b(filter|guardrail|safety|moderation|security|content policy|restriction)s?\b/i,
  },
  {
    id: "refusal-suppression",
    category: "jailbreak",
    severity: "medium",
    title: "Refusal suppression",
    detail:
      "Instructs the agent never to refuse, warn, or mention policy — a coercion pattern.",
    regex:
      /\b(do not|don't|never|no)\b[\s\S]{0,20}\b(refuse|decline|warn|apologi[sz]e|mention (the )?(policy|rules?|guidelines?)|say you can'?t)\b/i,
  },

  // ── Data exfiltration (instructional, indirect-injection style) ─────────────
  {
    id: "exfil-instruction",
    category: "data-exfiltration",
    severity: "critical",
    title: "Exfiltration directive",
    detail:
      "Instructs the agent to send/forward sensitive data to an external destination.",
    regex:
      /\b(send|email|e-?mail|post|upload|forward|exfiltrate|leak|transmit|copy)\b[\s\S]{0,48}\b(database|db|records?|customer (data|list|record)|secret|api[ _-]?key|password|credential|ssn|token|the data|all (the )?(data|records))\b/i,
  },
  {
    id: "egress-url",
    category: "data-exfiltration",
    severity: "high",
    title: "Suspicious egress target",
    detail:
      "References an external URL combined with data — a common exfiltration channel.",
    regex:
      /\b(fetch|curl|wget|http|https|visit|open|request)\b[\s\S]{0,30}(https?:\/\/|\b[\w-]+\.(com|net|io|ru|xyz|info|top|cn)\b)[\s\S]{0,30}(\?|=|data|key|token|secret)/i,
  },

  // ── Obfuscation lures ──────────────────────────────────────────────────────
  {
    id: "encode-lure",
    category: "obfuscation",
    severity: "medium",
    title: "Encoded-instruction lure",
    detail:
      "Asks the agent to decode/execute encoded content — used to smuggle hidden instructions.",
    regex:
      /\b(decode|base64|rot13|reverse|unscramble|execute the following|run this)\b/i,
  },
];
