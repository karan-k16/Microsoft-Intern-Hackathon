// Normalizer — unwraps common evasion/obfuscation techniques BEFORE detection.
// Attackers hide injections behind base64, leetspeak, homoglyphs, zero-width
// characters, and URL-encoding. We produce several "surfaces" of the same input
// so the heuristic + semantic layers can match the underlying intent.

export interface Surface {
  /** raw | canonical | deleet | decoded:b64 | decoded:url | decoded:hex */
  name: string;
  text: string;
}

export interface NormalizeResult {
  raw: string;
  /** Lowercased, zero-width stripped, homoglyph-folded, whitespace-collapsed. */
  canonical: string;
  /** Surfaces to run detectors against. */
  surfaces: Surface[];
  /** Techniques that were detected/unwrapped. */
  techniques: string[];
  changed: boolean;
}

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

// Common Cyrillic / Greek look-alikes → Latin.
const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y",
  "і": "i", "ј": "j", "ѕ": "s", "к": "k", "м": "m", "н": "h", "т": "t",
  "ɡ": "g", "α": "a", "ο": "o", "ε": "e", "ρ": "p", "ν": "v", "τ": "t",
  "Ι": "i", "Ο": "o", "Α": "a",
};

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", "$": "s", "!": "i", "|": "l", "(": "c",
};

function foldHomoglyphs(s: string): { text: string; hit: boolean } {
  let hit = false;
  const out = s.replace(/[^\x00-\x7F]/g, (ch) => {
    const r = HOMOGLYPHS[ch];
    if (r) {
      hit = true;
      return r;
    }
    return ch;
  });
  return { text: out, hit };
}

function deLeet(s: string): string {
  return s.replace(/[01345789@$!|(]/g, (ch) => LEET[ch] ?? ch);
}

function isPrintablePayload(s: string): boolean {
  if (s.length < 6) return false;
  const printable = s.replace(/[^\x20-\x7E]/g, "");
  // Mostly printable and contains letters → looks like a real payload.
  return printable.length / s.length > 0.85 && /[a-z]{3,}/i.test(s);
}

/** Find base64-looking tokens and decode any that yield printable text. */
function decodeBase64(s: string): string[] {
  const out: string[] = [];
  const tokens = s.match(/[A-Za-z0-9+/]{16,}={0,2}/g) ?? [];
  for (const tok of tokens) {
    if (tok.length % 4 !== 0) continue;
    try {
      const decoded = atob(tok);
      if (isPrintablePayload(decoded)) out.push(decoded);
    } catch {
      /* not valid base64 */
    }
  }
  return out;
}

function decodeUrl(s: string): string | null {
  if (!/%[0-9a-fA-F]{2}/.test(s)) return null;
  try {
    const d = decodeURIComponent(s);
    return d !== s ? d : null;
  } catch {
    return null;
  }
}

function decodeHex(s: string): string | null {
  const m = s.match(/(?:\\x[0-9a-fA-F]{2}|[0-9a-fA-F]{2}\s?){8,}/g);
  if (!m) return null;
  let out = "";
  for (const block of m) {
    const bytes = block.match(/[0-9a-fA-F]{2}/g) ?? [];
    for (const b of bytes) out += String.fromCharCode(parseInt(b, 16));
  }
  return isPrintablePayload(out) ? out : null;
}

export function normalize(input: string): NormalizeResult {
  const raw = input;
  const techniques = new Set<string>();

  let work = input;
  if (ZERO_WIDTH.test(work)) {
    techniques.add("zero-width");
    work = work.replace(ZERO_WIDTH, "");
  }

  const folded = foldHomoglyphs(work);
  if (folded.hit) techniques.add("homoglyph");

  const canonical = folded.text.toLowerCase().replace(/\s+/g, " ").trim();

  const surfaces: Surface[] = [
    { name: "raw", text: raw },
    { name: "canonical", text: canonical },
  ];

  const deleet = deLeet(canonical);
  if (deleet !== canonical && /[01345789@$!|(]/.test(canonical)) {
    techniques.add("leetspeak");
    surfaces.push({ name: "deleet", text: deleet });
  }

  for (const dec of decodeBase64(raw)) {
    techniques.add("base64");
    surfaces.push({ name: "decoded:b64", text: dec.toLowerCase() });
  }

  const url = decodeUrl(raw);
  if (url) {
    techniques.add("url-encoding");
    surfaces.push({ name: "decoded:url", text: url.toLowerCase() });
  }

  const hex = decodeHex(raw);
  if (hex) {
    techniques.add("hex");
    surfaces.push({ name: "decoded:hex", text: hex.toLowerCase() });
  }

  return {
    raw,
    canonical,
    surfaces,
    techniques: [...techniques],
    changed: techniques.size > 0,
  };
}
