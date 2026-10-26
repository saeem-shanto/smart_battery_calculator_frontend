# Frontend fix — 26 October 2026

## Build error corrected

The homepage's illustrative `lib/energy-flow-scenarios.ts` used the complete `EnergyFlow` result type, which required `curtailedSolar`, `pvKwh` and `loadKwh`. These were not appropriate for five route-activation examples. A new `EnergyRouteFlags` type containing only the five directional route values is used for the static homepage. The full `EnergyFlow` type remains available for display of genuine hourly backend dispatch. `activeFlowRoutes` supports either representation.

## Calculation architecture preserved

Removed the duplicate JavaScript battery-dispatch simulator (`illustrativeClientV2Hour`) found in the uploaded `src/lib/energy-flow.ts`. The frontend uses the backend API to submit calculation inputs. It does NOT run the client MATLAB algorithm or its battery dispatch calculations. The homepage remains a clearly marked static direction example, not an actual calculation. The user-facing backend's actual Octave invocation must be verified separately.

Removed outdated local-simulation tests. No custom `tests/react-types-check.d.ts` module overrides are included in this package.

## Verification

- `npm run test:algorithm-v1`: **5 passed**
- `npm run test:energy-flow`: **22 passed**
- TypeScript compilation of standalone energy-flow/scene modules: **passed**
- Complete `npm run build`: **not verified here** (npm package installation unavailable in this environment).

## To verify on your Mac

In the frontend project directory, keep your existing `.env.local` outside version control and run:

```bash
npm ci --include=dev
rm -rf .next
rm -f tsconfig.tsbuildinfo
npm run test:algorithm-v1
npm run test:energy-flow
npm run typecheck
npm run build
```

If a new TypeScript error is reported, use the new file and line shown in that output. Do not disable TypeScript validation or bypass production checks.
