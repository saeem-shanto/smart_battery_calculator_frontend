# Energy-flow visual correction — 26 October 2026

**Scope item:** C4: Correct animation direction, including grid import and export.

## Changes actually integrated into the existing application

| Path | Action |
|---|---|
| `components/EnergyEcosystem.tsx` | Replaced perpetual fixed three-line animation with five flow-aware source→destination paths; added grid node and scenario-selection buttons |
| `lib/energy-flow-scenarios.ts` | Added synthetic scenario fixtures derived from the client V2 hourly branch logic (t>=2) and direction-specific paths |
| `src/lib/energy-flow.ts` | Retained the original validated energy-balance logic already in the uploaded archive; now actually imported by the application |
| `app/globals.css` | Added flow controls, arrow-display layout, responsive and accessible styles, and moved service status badge out of the controls |
| `tests/energy-flow-integration.test.cjs` | Seven new checks for homepage integration and direction correctness |
| `package.json` | Added `npm run test:energy-flow` |

## Evidence

- 23/23 focused automated tests pass (existing 16 + seven homepage-integration checks).
- The core model and scenario definitions compile with TypeScript `--strict`.
- TSX parsing for the updated page component succeeds.
- A complete Next.js production build and deployed-browser comparison are not yet verified because the local npm dependency install failed; run `npm ci && npm run typecheck && npm run build` in CI/on your machine.
- No MATLAB source file was changed; a genuine client-signed reference / live V2 Octave numerical parity test remains open.

## Acceptance cases

| Scenario | Expected active animation |
|---|---|
| Solar surplus | Solar→Home; Solar→Battery; Solar→Grid |
| Solar to home | Solar→Home only |
| Battery + grid | Battery→Home; Grid→Home |
| Grid import | Grid→Home only |
| Grid export | Solar→Home; Solar→Grid (limit 5 kWh for the hour) |

These are representative known dispatch cases for visual regression, **not** recordings of the deployed Octave service. Do not describe the user's actual hourly energy usage on the basis of annual summaries.
