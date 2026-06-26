import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "docs/screens";
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-overview", click: null, wait: 1200 },
  { name: "02-injection", click: /Direct Prompt Injection/, wait: 2600 },
  { name: "03-obfuscated", click: /Obfuscated Injection/, wait: 2600 },
  { name: "04-rag-exfil", click: /Indirect Injection/, wait: 6200 },
  { name: "05-leak-redacted", click: /Sensitive Data Leak/, wait: 6200 },
  { name: "06-benign", click: /Legitimate Request/, wait: 6200 },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1500, height: 940 },
  deviceScaleFactor: 1.5,
});

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=AEGIS", { timeout: 15000 });
await page.waitForTimeout(800);

for (const s of shots) {
  if (s.click) {
    try {
      await page.getByRole("button", { name: s.click }).click({ timeout: 5000 });
    } catch (e) {
      console.log(`click failed for ${s.name}: ${e.message}`);
    }
  }
  await page.waitForTimeout(s.wait);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log(`captured ${s.name}`);
}

await browser.close();
console.log("done");
