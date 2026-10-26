# N01 Smart Battery Calculator — Next.js frontend

The **frontend does not run or reproduce the client's MATLAB model**. All household PV, battery dispatch and financial results must originate from the Django/DRF backend running the client-supplied `batt_cal_v1.m` with GNU Octave.

## Architecture

1. Users enter 24 hourly load values (or an annual workbook), postcode, solar capacity, battery capacity, tariffs and installation finance assumptions.
2. `lib/algorithm-v1.ts` defines **input defaults, field validation and display formatting only**. It does not compute battery dispatch, SoC, grid-import/export, costs, payback or an optimal battery size.
3. `lib/api.ts` sends a generated scenario to `POST /api/v1/calculations/generated-annual-v1/` and a workbook to `POST /api/v1/calculations/client-workbook-v1/`. `lib/backend-client.ts` resolves the public API base URL and handles session/authentication.
4. Django is expected to handle annual PV/load preparation, parameter mapping, executing MATLAB with GNU Octave, and returning the authoritative results. This backend behavior must be verified against the deployed backend source.
5. The frontend `app/calculator/results/page.tsx` renders the values returned by Django. It does not calculate the financial results.
6. The homepage energy animation (`components/EnergyEcosystem.tsx`) displays **static arrow direction examples**. It is expressly *not* derived from any live or historical calculation. No client MATLAB battery-dispatch equations remain in the frontend animation.

## Run locally

```sh
npm ci --include=dev
npm run verify:dependencies
npm run dev:local
```

Open http://localhost:3000/ and use the calculation wizard. Set `NEXT_PUBLIC_API_BASE_URL` to the Django API base URL for integration with your backend (local development defaults to `http://127.0.0.1:8000/api/v1`).

## Tests and build

```sh
npm run test:energy-flow
npm run test:algorithm-v1
npm run typecheck
npm run build
```

Focused tests check the animation paths and the separation between UI and backend API. They **do not** prove MATLAB/Octave parity or successful execution of the deployed backend. `typecheck` and `build` require complete npm dependencies; they have not been confirmed in this assessment environment.

## Further reading

- `ARCHITECTURE_AUDIT_26OCT2026.md`: reviewed endpoints and remaining backend validation gaps.
- `BUILD_FIX_README.md`: clean install and React type checking guidance.
- `ENERGY_FLOW_CHANGELOG.md`: animation direction and model-simulation removal.
