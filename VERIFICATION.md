# Frontend v1.5.8 Verification

## Architecture
- Next.js remains frontend-only.
- `app/api/*` application proxy routes: **0**.
- Browser API traffic is centralized in `lib/backend-client.ts`.
- Direct `fetch()` calls outside the shared backend client: **0**.
- Production requires an HTTPS `NEXT_PUBLIC_API_BASE_URL`.

## Static release checks completed in the artifact environment
- TS/TSX files parsed/transpiled: **39**.
- TypeScript/TSX syntax diagnostics: **0 errors**.
- Missing local imports: **0**.
- `package.json`: valid JSON.
- `tsconfig.json`: valid JSON.
- `app/globals.css`: balanced braces.
- `app/icon.svg`: valid XML.
- Embedded secret-like credential scan: no matches.
- Native `window.confirm()` calls: **0**.

## UI/UX regression focus
- Calculator: drag/drop, validation, workflow context, long-running progress, engine errors, retained/transient results, download feedback.
- Accounts: field-level validation, password guidance, profile save state, avatar actions, session/outage state.
- History: search, count, empty states, ownership claim, consistent delete confirmation.
- Tariffs: load/refresh/search/filter/empty states and honest unavailable-value display.
- Admin: filtering, record state, validation, warnings, file working states, consistent destructive confirmations.
- Accessibility: skip links, focus-visible, `aria-current`, field error associations, disclosure state, reduced-motion support.

## Environment limitation
A real dependency-backed `npm run typecheck` / `npm run build` could not be completed in this artifact environment because the npm registry was not reachable long enough to install dependencies. The source-level TypeScript transpilation and import checks above passed. Run the following release gate on a normal internet-connected machine:

```bash
rm -rf node_modules .next
npm install
npm run typecheck
npm run build
```

Commit the generated `package-lock.json` after a successful install/build.
