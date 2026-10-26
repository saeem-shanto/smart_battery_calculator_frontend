# Smart Battery Calculator — Build fix (26 October 2026)

## Errors addressed
1. `hourRange is not exported from @/lib/algorithm-v1` — the original Archive 2.zip omitted the helper. `lib/algorithm-v1.ts` now exports a validated `hourRange(hour: number)` function, returning `00:00–01:00` through `23:00–00:00`.
2. `Module 'react' has no exported member 'ReactNode'` — `ReactNode` *is* supported by `@types/react`. This error indicates a missing, corrupted or otherwise incorrectly resolved React declaration installation. The project has a `.npmrc` enforcing installation of dev-dependency type packages, and a `prebuild` check that verifies their presence. We deliberately **did not** replace correctly typed layout props with `any`.

## Install and verify (Mac / Linux)
```
rm -rf node_modules .next tsconfig.tsbuildinfo
npm ci --include=dev
npm run verify:dependencies
npm run test:algorithm-v1
npm run test:energy-flow
npm run typecheck
npm run build
```

## Vercel
Deploy this extracted project at its root, set the **Install Command** to `npm ci --include=dev` and the **Build Command** to `npm run build`. **Redeploy without using the previous build cache.** Don't upload or deploy an older Archive.zip nested in this folder.

## Evidence and limitations
The updated source exports `hourRange` and the isolated algorithm helper tests pass in the working environment. The energy-flow test suite also passes (23 tests). **A complete Next.js production build was not possible in this offline execution environment:** the local `node_modules` tree is incomplete and fetching packages from npm timed out. A successful Vercel build is not claimed; confirm it with the commands above.

The latest client MATLAB `batt_cal_v1` integration still requires the deployed Django backend to expose matching inputs and calculation outputs. These build fixes do not modify the MATLAB engine or guarantee backend parity.
