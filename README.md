# N01 Smart Battery Calculator — Integrated frontend

This archive contains the full Next.js frontend from the provided **Archive 2.zip**, with the existing homepage energy-flow illustration corrected in place. All existing calculator, accounts, admin, results, and help routes are preserved.

## What changed in this delivery

- `components/EnergyEcosystem.tsx`: removed unconditional fixed electricity movement. Connected active arrows to client V2-derived hourly dispatch examples. Added a visible grid node, separate Solar -> Grid (export) and Grid -> Home (import) routes, and five interactive scenario selectors. Only active directions animate.
- `lib/energy-flow-scenarios.ts` (new): five defined hourly dispatch fixtures and route geometry matching the existing homepage SVG. Every path starts at its source and ends at its destination.
- `src/lib/energy-flow.ts` (retained from the supplied ZIP): validates energy conservation, nonnegative flows, and import/export exclusivity; implements the client Version 2 *t >= 2* flow equations as **illustrative deterministic checks**, not a replacement for GNU Octave.
- `app/globals.css`: adds responsive styles, keyboard focus indicators and accessible directional controls.
- `tests/energy-flow-integration.test.cjs`: adds seven homepage-specific tests to the existing 16 tests.
- `package.json`: adds `npm run test:energy-flow`.

The original ZIP also contained unused standalone `demo/`, generated `dist/`, duplicate `Archive.zip`, and old unintegrated patch components. These have been omitted from the clean delivery. The homepage visualization is now part of the real Next.js application instead of a separate demo folder.

## Run locally

Install dependencies with a normal connection to npm:

```bash
npm ci
npm run dev:local
```

Open **http://localhost:3000/** (homepage/dashboard) and select **Solar surplus**, **Solar to home**, **Battery + grid**, **Grid import**, and **Grid export** beneath the image. Observe the arrowheads and particles: import enters the home from the grid; export travels from solar PV to the grid.

## Run automated tests

```bash
npm run test:energy-flow
```

The test command compiles the pure TypeScript model into transient test outputs and runs 23 Node tests. A successful run exits with code 0. Generated `dist/` and `.flow-test-build/` output need not be committed.

For a full app build, after installing npm dependencies:

```bash
npm run typecheck
npm run build
```

## Energy model and acceptance boundary

The homepage is explicitly labelled **illustrative client V2 hourly flow (t >= 2), not a live calculation**. The five test cases use solar PV, household load, a starting battery SoC, and a selected capacity to calculate visual flow. They are not from an authenticated user's saved calculation. The client Version 2 provides annual summary values in the current Django response; its six hourly arrays (`pv`, `ld`, `Pbin`, `Pbout`, `imp`, `exp`) are **not** returned by the current results API. Therefore the homepage may illustrate physically correct directions, but real-hour animation for a particular user calculation would require a backend extension to return validated hourly flows.

The client MATLAB script initialises **hour 1** differently and may report negative grid import if early-hour solar exceeds load. The illustrative validation intentionally covers t >= 2. The animation code **does not alter MATLAB or Octave**, and no live backend numerical parity or client-approved acceptance fixtures are claimed.

## Actual validation performed during this delivery

- 23/23 focused tests passed (16 original model tests + 7 integrated-homepage tests).
- The four changed TypeScript/TSX files were successfully parsed/transpiled with the installed TypeScript compiler.
- Pure TypeScript logic compiled with `tsc --strict`.
- A complete Next.js build was **not** verified in this environment because npm dependency installation did not complete. Run the full build on a workstation or CI before deployment.
- Live browser/deployed version verification and client acceptance remain to be completed after deployment.

## Deployment

Do not overwrite existing secrets. Update only the frontend code, run tests and build, commit the changed files, and deploy to Vercel using your normal release process. Capture visual verification screenshots for the five scenarios. For formal change request C4 closure, compare hourly results against client-approved fixtures and record the tested release and acceptance decision.
