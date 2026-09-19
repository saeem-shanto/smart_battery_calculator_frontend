# Smart Battery Calculator Frontend — v1.5.6 Production

Production Next.js frontend for Project N01. The visual theme, layout and existing icon language are preserved from the approved prototype.

## Architecture

Next.js is the frontend only. Browser requests go directly to the public Django REST API:

```text
Browser / Next.js UI
        ↓ HTTPS REST
Django backend /api/v1
        ↓
PostgreSQL + Supabase Storage + GNU Octave
```

There is no `app/api/*` application proxy layer in this build.

## Production features

- Guest workbook validation and calculation
- Optional backend retention (`retain_data=true/false`)
- Optional user registration/login/profile/avatar
- Account-owned retained calculations
- Guest-token retained calculations and account claiming
- User/admin JWT refresh and logout
- Admin calculation/file management
- Protected avatar/file downloads through authenticated browser `fetch`
- Transient-result browser-session cache to prevent accidental Octave reruns on refresh
- Debug overlay for development only
- Smart Battery Calculator browser title icon

## Authentication

Django issues SimpleJWT access/refresh tokens. Because this frontend calls Django directly, the tokens are stored in **`sessionStorage` for the current browser tab** and sent only in `Authorization: Bearer ...` headers. They are not placed in URLs or long-lived `localStorage`.

Guest calculation capability tokens remain browser-local and are sent through `X-Calculation-Token` only for ownerless retained guest calculations.

## Local development

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_MAX_UPLOAD_MB=15
NEXT_PUBLIC_APP_DEBUG=true
APP_DEBUG_BUILD=true
NEXT_PUBLIC_APP_VERSION=1.5.6
```

Then:

```bash
npm install
npm run typecheck
npm run dev:local
```

Django must allow the frontend origin, normally:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

## Production deployment

Set these variables in Vercel (or the chosen frontend host) **before the build**:

```env
NEXT_PUBLIC_API_BASE_URL=https://smart-battery-calculator-backend-2.onrender.com/api/v1
NEXT_PUBLIC_MAX_UPLOAD_MB=15
NEXT_PUBLIC_APP_DEBUG=false
APP_DEBUG_BUILD=false
NEXT_PUBLIC_APP_VERSION=1.5.6
```

On the Django/Render service, allow the exact deployed frontend origin:

```env
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND-DOMAIN
CSRF_TRUSTED_ORIGINS=https://YOUR-FRONTEND-DOMAIN
```

If you use both a Vercel domain and a custom domain, include both as comma-separated origins.

Because uploads now go directly from the browser to Django, they do not pass through a Vercel Function payload limit.

## Release verification

Before deployment:

```bash
rm -rf node_modules .next
npm install
npm run typecheck
npm run build
```

The package intentionally does not include a stale `package-lock.json`; run `npm install` once in your normal internet-connected development environment and commit the newly generated lockfile before your final repository release.
