# N01 frontend–backend architecture audit — 26 October 2026

## Verified from frontend source

- `lib/api.ts` sends generated annual calculations to `POST /calculations/generated-annual-v1/`.
- Workbook calculations are submitted to `POST /calculations/client-workbook-v1/`.
- `lib/algorithm-v1.ts` defines editable UI inputs, defaults and validation only; it does not solve the client MATLAB dispatch model.
- `components/Charts.tsx` formats and plots results returned from the backend. It does not compute battery sizing or annual costs.
- `src/lib/energy-flow.ts` now includes *presentation-only* direction definitions and checks; it no longer contains client Version 2 battery dispatch equations.
- `lib/energy-flow-scenarios.ts` provides hand-authored on/off fixtures to demonstrate arrow direction, with no battery calculation. The homepage clearly labels these examples as non-live.
- Workbook calculation no longer silently falls back to an older legacy endpoint when an old draft lacks the updated algorithm settings.

## Intended architecture

Browser (Next.js): data collection, validation, HTTP calls, display/animation.
Django REST API: authoritative annual PV/load preparation, model input mapping, invoking GNU Octave to run client-supplied MATLAB script, annual and hourly results.
PostgreSQL / object storage: backend persistence only, according to retention settings.

## Not proven by the frontend-only audit

- Whether the deployed Django endpoint really invokes the specific final `batt_cal_v1.m` release and does not use a reimplementation/fallback.
- Whether both backend v1 endpoints accept every property sent by the frontend.
- MATLAB–Octave numerical parity, UTC/local alignment and live deployed behavior.
- Whether the browser is running this new package rather than an older Vercel deployment.

## UI contract for future live hourly energy animation

Expose directional hourly dispatch fields from Django/Octave (solarToHome, solarToBattery, batteryToHome, gridToHome, solarToGrid). Render the returned route values; do not re-simulate them in JavaScript. The current homepage uses clearly-marked static examples only.

## Commands

```bash
npm ci --include=dev
npm run test:energy-flow
npm run test:algorithm-v1
npm run typecheck
npm run build
```

`typecheck` and `build` require installed React/Next.js packages. They were not independently completed in this review environment because dependencies were unavailable.
