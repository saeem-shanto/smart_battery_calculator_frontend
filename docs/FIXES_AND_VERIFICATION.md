# v4 Fixes and Verification

This version consolidates the previous frontend fixes and adds validation plus a separate admin area.

## Functional fixes retained

1. Step 1 Next navigation works for CSV, simple data, and sample profile modes.
2. Tariff and result pages use bundled/browser fallbacks so they are not stuck waiting for dummy API calls.
3. Results History renders seed/browser data immediately.
4. Saved scenarios use browser localStorage and support view/edit/delete.
5. Dummy API routes are still present for realistic frontend integration.
6. Native navigation is used between calculation steps to reduce dependence on the development HMR connection.
7. Versioned v4 browser keys avoid stale state from older builds.

## New validation

- central validation helpers in `lib/validation.ts`
- blocking errors and non-blocking warnings
- inline field messages and page-level summaries
- stronger CSV data-quality checks
- client and API scenario validation
- full-draft validation before calculation

## New admin area

- `/admin/login`
- development credentials `admin` / `123`
- HttpOnly demo cookie
- server-side protection of `/admin`
- separate admin dashboard
- scenario delete/reset controls
- logout

## Verification completed in the generation environment

- all TypeScript/TSX files passed TypeScript syntax transpilation
- non-React library and API code passed strict TypeScript checking with external framework stubs
- CSV parser smoke test passed with the supplied sample CSV: 48 rows, 18 kWh total, 18 kWh/day
- baseline dummy calculation returned 10 kWh recommended battery, $1,050 annual savings, 7.6-year payback, and $6,780 NPV
- validation smoke tests confirmed required/range errors and warning paths

A real `npm install` / `next build` could not be completed in the generation environment because external npm package download timed out. Run `npm run typecheck` and `npm run build` locally after installation.
