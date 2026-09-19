# Smart Battery Calculator Frontend — v1.5.3 Final

Professional Next.js frontend for Project N01, integrated with the refined Django + GNU Octave backend v1.5.2.

## Current capabilities

- Four-step annual workbook calculation workflow with the existing project theme/layout
- XLS/XLSX/CSV/TXT pre-validation before calculation
- Field-level validation, red error states, focus and scroll-to-error behaviour
- Explicit privacy choice: transient processing or retained calculation
- Transient canonical CSV download without backend retention
- Retained calculation input/result downloads
- Optional user registration, sign-in, sign-out and automatic JWT refresh
- User JWTs stored only in secure HttpOnly Next.js cookies
- Profile name/email/username and private JPEG/PNG/WebP avatar management
- Account-owned retained calculations available across browser sessions
- Browser-local guest calculation history using the backend private guest token
- One-click claim of an eligible guest calculation into the signed-in account
- Secure owner-vs-guest calculation retrieval/download/delete routing
- Existing Django staff/admin portal remains separate
- Backend health/readiness indicator
- Development-only debug overlay controlled by environment variable
- Browser title/favicon using the Smart Battery Calculator battery/energy mark

There is no dummy calculation fallback.

## Local development

1. Start Django at `http://127.0.0.1:8000`.
2. Copy `.env.local.example` to `.env.local`.
3. Install/run:

```bash
npm ci
npm run typecheck
npm run dev:local
```

Open `http://localhost:3000`.

Recommended local environment:

```env
BACKEND_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_DEBUG=true
NEXT_PUBLIC_APP_VERSION=1.5.3
```

Keep `NEXT_PUBLIC_BACKEND_API_URL` unset unless you deliberately want public browser-to-Django calls. Account and protected calculation requests always use same-origin Next.js BFF routes so JWTs remain HttpOnly.

## Production

Set the server-side `BACKEND_API_URL` to the deployed Django URL and disable the debug overlay:

```env
BACKEND_API_URL=https://your-django-backend.example
NEXT_PUBLIC_APP_DEBUG=false
NEXT_PUBLIC_APP_VERSION=1.5.3
```

Then run:

```bash
npm ci
npm run typecheck
npm run build
npm start
```

## Retention/account behaviour

- `retain_data=false`: the backend processes transiently, creates no retained calculation/file rows, and returns the canonical CSV inline.
- `retain_data=true` + guest: the backend returns a private calculation token. The browser stores that token locally for later guest access.
- `retain_data=true` + signed-in user: the calculation is owned by the account. The frontend does not need or store a guest calculation token.
- A signed-in user can claim an eligible retained guest calculation using its existing guest token. After claim, account JWT access supersedes the guest token.

## Debug mode

`NEXT_PUBLIC_APP_DEBUG=true` enables a compact bottom-right diagnostics panel showing only non-secret frontend/runtime information: route, app version, backend health/readiness, account state and engine readiness. Never place secrets in `NEXT_PUBLIC_*` variables.
