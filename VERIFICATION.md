# Frontend v1.5.3 Verification

- Backend contract reviewed against Django backend v1.5.2: PASS
- Guest retained calculation access-token flow preserved: PASS
- Account-owned calculation JWT flow added: PASS
- Transient `retain_data=false` flow preserved: PASS
- Workbook pre-validation flow preserved: PASS
- User register/login/profile/avatar/password API routes added: PASS
- Guest-to-account calculation claim flow added: PASS
- Admin profile/avatar/password flow added: PASS
- Debug overlay gated by `NEXT_PUBLIC_APP_DEBUG=true`: PASS
- App favicon SVG parses correctly: PASS
- `package.json` / `package-lock.json` parse correctly: PASS
- TypeScript/TSX syntax transpilation across all source files: PASS
- Full `npm run typecheck` / `npm run build`: must be run after a complete `npm ci` on the target machine; this isolated environment could not complete dependency installation.

Recommended final local commands:

```bash
npm ci
npm run typecheck
npm run build
npm run dev:local
```
