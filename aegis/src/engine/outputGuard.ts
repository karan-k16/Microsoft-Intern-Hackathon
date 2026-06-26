// Output / action guard — inspects the agent's proposed outputs and tool calls
// BEFORE they execute. Catches secret + PII leakage, egress to untrusted
// destinations, bulk data exfiltration, and unauthorized tool use.

import { SEVERITY_WEIGHT } from "./types";
import type { Direction, Severity, Signal } from "./types";

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface AgentPolicy {
  allowedTools: string[];
  /** Domains the agent is permitted to send data to. */
  allowedEgressDomains: string[];
  /** Tools that move data outward (subject to egress checks). */
  sensitiveTools: string[];
}

export const DEFAULT_POLICY: AgentPolicy = {
  allowedTools: [
    "read_kb",
    "read_db",
    "lookup_order",
    "send_email",
    "fetch_url",
    "summarize",
  ],
  allowedEgressDomains: ["contoso.com"],
  sensitiveTools: ["send_email", "fetch_url", "http_post", "upload"],
};

interface SecretRule {
  id: string;
  label: string;
  severity: Severity;
  category: "secret-leak" | "pii-leak";
  regex: RegExp;
}

const SECRET_RULES: SecretRule[] = [
  { id: "openai", label: "OpenAI-style API key", severity: "critical", category: "secret-leak", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { id: "aws", label: "AWS access key id", severity: "critical", category: "secret-leak", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: "ghp", label: "GitHub token", severity: "critical", category: "secret-leak", regex: /\bghp_[A-Za-z0-9]{30,}\b/g },
  { id: "slack", label: "Slack token", severity: "high", category: "secret-leak", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: "jwt", label: "JWT / bearer token", severity: "high", category: "secret-leak", regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g },
  { id: "pem", label: "Private key block", severity: "critical", category: "secret-leak", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { id: "kv", label: "Inlined credential", severity: "high", category: "secret-leak", regex: /\b(api[_-]?key|apikey|secret|token|password|passwd|pwd)\b\s*[:=]\s*["']?[A-Za-z0-9_\-]{12,}/gi },
  { id: "ssn", label: "US Social Security Number", severity: "high", category: "pii-leak", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { id: "cc", label: "Credit-card number", severity: "high", category: "pii-leak", regex: /\b(?:\d[ -]?){15,16}\b/g },
];

const BULK_DATA = /\b(all|entire|every|whole|full|\*)\b[\s\S]{0,20}\b(customer|user|record|row|database|table|account|client)s?\b|\b(database|db dump|export|customer list|all records|all customers)\b/i;

/** Scan free text (or stringified args) for secrets + PII. */
export function scanTextForLeaks(text: string, direction: Direction): Signal[] {
  const signals: Signal[] = [];
  for (const rule of SECRET_RULES) {
    const m = text.match(rule.regex);
    if (m && m.length) {
      signals.push({
        id: `leak:${rule.id}`,
        layer: "pii",
        category: rule.category,
        severity: rule.severity,
        title: rule.label,
        detail: `Detected ${m.length} ${rule.label.toLowerCase()} value(s) in the ${direction}. Blocking prevents leakage to the requester.`,
        match: mask(m[0]),
        score: SEVERITY_WEIGHT[rule.severity],
      });
    }
  }
  return signals;
}

function domainOf(value: string): string | null {
  const email = value.match(/[\w.+-]+@([\w.-]+\.[a-z]{2,})/i);
  if (email) return email[1].toLowerCase();
  const url = value.match(/https?:\/\/([\w.-]+)/i);
  if (url) return url[1].toLowerCase();
  return null;
}

function allowed(domain: string, policy: AgentPolicy): boolean {
  return policy.allowedEgressDomains.some(
    (d) => domain === d || domain.endsWith("." + d),
  );
}

/** Inspect a proposed tool call for unauthorized use + exfiltration. */
export function scanToolCall(
  call: ToolCall,
  policy: AgentPolicy = DEFAULT_POLICY,
): Signal[] {
  const signals: Signal[] = [];
  const argStr = JSON.stringify(call.args ?? {});

  if (!policy.allowedTools.includes(call.tool)) {
    signals.push({
      id: "tool:unauthorized",
      layer: "output-guard",
      category: "unauthorized-tool",
      severity: "high",
      title: "Unauthorized tool",
      detail: `The agent attempted to invoke "${call.tool}", which is outside its allow-list.`,
      match: call.tool,
      score: SEVERITY_WEIGHT.high,
    });
  }

  if (policy.sensitiveTools.includes(call.tool)) {
    const domains = new Set<string>();
    for (const v of Object.values(call.args ?? {})) {
      const d = domainOf(String(v));
      if (d) domains.add(d);
    }
    const bulk = BULK_DATA.test(argStr);
    for (const d of domains) {
      if (!allowed(d, policy)) {
        const sev: Severity = bulk ? "critical" : "high";
        signals.push({
          id: "egress:untrusted",
          layer: "output-guard",
          category: "data-exfiltration",
          severity: sev,
          title: bulk ? "Bulk data exfiltration" : "Untrusted egress",
          detail: `"${call.tool}" targets external domain ${d}, which is not on the egress allow-list${
            bulk ? ", and the payload references bulk customer/database records" : ""
          }.`,
          match: d,
          score: SEVERITY_WEIGHT[sev],
        });
      }
    }
    if (!domains.size && bulk) {
      signals.push({
        id: "egress:bulk",
        layer: "output-guard",
        category: "data-exfiltration",
        severity: "high",
        title: "Bulk data movement",
        detail: `"${call.tool}" is moving bulk customer/database records — review required.`,
        score: SEVERITY_WEIGHT.high,
      });
    }
  }

  signals.push(...scanTextForLeaks(argStr, "output"));
  return dedupe(signals);
}

function dedupe(signals: Signal[]): Signal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function mask(s: string): string {
  if (s.length <= 8) return "•".repeat(s.length);
  return s.slice(0, 4) + "•".repeat(Math.min(12, s.length - 8)) + s.slice(-4);
}

/** Replace detected secrets/PII in text with masked placeholders. */
export function redact(text: string): string {
  let out = text;
  for (const rule of SECRET_RULES) {
    out = out.replace(rule.regex, (m) => mask(m));
  }
  return out;
}
