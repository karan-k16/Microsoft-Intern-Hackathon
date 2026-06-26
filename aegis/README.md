# AEGIS — app

The AEGIS web app (the firewall for AI agents). See the [root README](../README.md) for the full project write-up.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run selftest` | Run all 7 attack scenarios through the real engine (expects 7/7) |
| `npm run shots` | Capture UI screenshots (requires the dev server running) |

## Structure

```
src/
  engine/     detection engine (normalize · heuristics · semantic · output guard · policy)
  agent/      simulated enterprise agent, tools, and the 7 attack scenarios
  store/      zustand store wiring the agent event-stream to the UI
  ui/         React command-deck UI (interceptor, verdicts, threat feed)
scripts/      selftest + screenshot tooling
```

Everything runs locally — no API keys, no backend. The semantic layer loads a small
sentence-embedding model (`all-MiniLM-L6-v2`) in-browser via WebAssembly, with a
deterministic lexical fallback when offline.
