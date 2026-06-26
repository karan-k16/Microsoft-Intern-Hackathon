// Generate per-scene narration MP3s with Edge TTS (no key) and measure durations.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { parseFile } from "music-metadata";
import { writeFileSync, mkdirSync, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { SCENES, VOICE, RATE } from "./scenes.mjs";

const GAP = 0.55; // seconds of breathing room between scenes
mkdirSync("docs/video/seg", { recursive: true });

const scenes = [];
let start = 0;

for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const file = `docs/video/seg/${String(i).padStart(2, "0")}_${s.id}.mp3`;
  const { audioStream } = tts.toStream(s.text, { rate: RATE });
  await pipeline(audioStream, createWriteStream(file));

  const dur = (await parseFile(file)).format.duration ?? 0;

  scenes.push({ id: s.id, action: s.action, file, start: +start.toFixed(2), dur: +dur.toFixed(2) });
  start += dur + GAP;
}

writeFileSync("docs/video/timings.json", JSON.stringify({ total: +start.toFixed(2), scenes }, null, 2));
console.log(`\nnarration total ≈ ${start.toFixed(1)}s`);
for (const t of scenes) console.log(t.id.padEnd(12), `${t.dur.toFixed(2)}s`, `@${t.start.toFixed(2)}`);
