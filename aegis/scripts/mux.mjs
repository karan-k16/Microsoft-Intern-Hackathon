// Mux the per-scene narration onto the silent recording → final MP4.
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const LEAD = 2.0;
const VIDEO = "docs/video/demo-silent.webm";
const OUT = "docs/video/AEGIS-demo.mp4";

function findFfmpeg() {
  const all = readdirSync("tools/ffmpeg", { recursive: true });
  const hit = all.find((p) => String(p).toLowerCase().endsWith("ffmpeg.exe"));
  if (!hit) throw new Error("ffmpeg.exe not found under tools/ffmpeg — run the download step");
  return "tools/ffmpeg/" + String(hit).replace(/\\/g, "/");
}

const ff = findFfmpeg();
const t = JSON.parse(readFileSync("docs/video/timings.json", "utf8"));

const inputs = ["-i", VIDEO];
const filters = [];
const labels = [];
t.scenes.forEach((sc, k) => {
  inputs.push("-i", sc.file);
  const d = Math.round((LEAD + sc.start) * 1000);
  filters.push(`[${k + 1}]adelay=${d}:all=1[a${k}]`);
  labels.push(`[a${k}]`);
});
const fc =
  filters.join(";") +
  ";" +
  labels.join("") +
  `amix=inputs=${t.scenes.length}:normalize=0,volume=1.9[narr]`;

const args = [
  "-y",
  ...inputs,
  "-filter_complex", fc,
  "-map", "0:v",
  "-map", "[narr]",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-crf", "20",
  "-preset", "veryfast",
  "-c:a", "aac",
  "-b:a", "192k",
  OUT,
];

console.log("ffmpeg:", ff);
execFileSync(ff, args, { stdio: "inherit" });
console.log("\n✅ final video:", OUT);
