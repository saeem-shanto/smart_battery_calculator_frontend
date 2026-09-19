# Production Deployment — Frontend v1.5.5

## Vercel frontend environment

```env
NEXT_PUBLIC_API_BASE_URL=https://smart-battery-calculator-backend-2.onrender.com/api/v1
NEXT_PUBLIC_MAX_UPLOAD_MB=15
NEXT_PUBLIC_APP_DEBUG=false
APP_DEBUG_BUILD=false
NEXT_PUBLIC_APP_VERSION=1.5.5
```

`NEXT_PUBLIC_API_BASE_URL` is a browser-visible configuration value, not a secret.

## Render/Django CORS

Django must allow the exact frontend origin (origin only, no path):

```env
CORS_ALLOWED_ORIGINS=https://YOUR-VERCEL-OR-CUSTOM-DOMAIN
CSRF_TRUSTED_ORIGINS=https://YOUR-VERCEL-OR-CUSTOM-DOMAIN
```

For both production and local frontend testing, use comma-separated origins:

```env
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND-DOMAIN,http://localhost:3000
CSRF_TRUSTED_ORIGINS=https://YOUR-FRONTEND-DOMAIN,http://localhost:3000
```

The backend can keep `CORS_ALLOW_CREDENTIALS=False` because this frontend uses Bearer JWT headers, not cross-site authentication cookies.

## Build

```bash
npm install
npm run typecheck
npm run build
```

After the first successful `npm install`, commit the generated `package-lock.json` for reproducible deployments.
