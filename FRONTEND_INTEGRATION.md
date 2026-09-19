# Frontend ↔ Backend Integration — v1.5.7

## Direct API contract

The frontend uses `NEXT_PUBLIC_API_BASE_URL` as the canonical Django API prefix. Example:

```text
https://smart-battery-calculator-backend-2.onrender.com/api/v1
```

All browser requests are created by `lib/backend-client.ts`.

### Public API

- `GET /health/`
- `GET /ready/`
- `GET /tariffs/`
- `POST /profiles/client-workbook/validate/`
- `POST /calculations/client-workbook/` (guest or optional authenticated owner)

### User account API

- `POST /accounts/register/`
- `POST /accounts/auth/token/`
- `POST /accounts/auth/token/refresh/`
- `POST /accounts/auth/logout/`
- `GET/PATCH /accounts/me/`
- `GET /accounts/me/avatar/`
- `POST /accounts/me/password/`
- `GET /accounts/me/calculations/`

### Calculation ownership/access

- Account owner: Bearer JWT
- Guest retained record: `X-Calculation-Token`
- Claim guest record: Bearer JWT + `X-Calculation-Token`

### Admin API

Admin authentication uses `/admin/auth/token/` and `/admin/auth/token/refresh/`. Staff profile operations reuse `/accounts/me/*` with the admin JWT. Dashboard operations use `/admin/*`.

## CORS requirement

Direct browser calls require Django to allow the deployed frontend origin. `Authorization` is part of django-cors-headers' default headers, and the backend already adds `x-calculation-token`.

No cross-site cookies are used by the application API, so `CORS_ALLOW_CREDENTIALS=False` remains appropriate.
