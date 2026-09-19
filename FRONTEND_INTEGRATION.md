# Frontend ↔ Backend v1.5.2 mapping

| UI action | Django API |
|---|---|
| Backend status | `GET /api/v1/health/` |
| Backend readiness | `GET /api/v1/ready/` |
| Tariff reference list | `GET /api/v1/tariffs/` |
| Validate workbook without retention | `POST /api/v1/profiles/client-workbook/validate/` |
| Run workbook calculation | `POST /api/v1/calculations/client-workbook/` with explicit `retain_data` and optional account Bearer JWT |
| Register account | `POST /api/v1/accounts/register/` |
| User login | `POST /api/v1/accounts/auth/token/` |
| Refresh user session | `POST /api/v1/accounts/auth/token/refresh/` |
| Logout | `POST /api/v1/accounts/auth/logout/` |
| Get/update profile | `GET/PATCH /api/v1/accounts/me/` |
| Private avatar | `GET /api/v1/accounts/me/avatar/` |
| Change password | `POST /api/v1/accounts/me/password/` |
| Account calculations | `GET /api/v1/accounts/me/calculations/` |
| Claim guest calculation | `POST /api/v1/calculations/{public_id}/claim/` + account JWT + guest token |
| Reopen account-owned result | `GET /api/v1/calculations/{public_id}/` + account JWT |
| Reopen guest retained result | Same endpoint + `X-Calculation-Token` |
| Delete retained record | Same access model using `DELETE` |
| Download retained input/CSV | `/api/v1/calculations/{public_id}/files/{file_id}/download/` using owner JWT or guest token |
| Download transient CSV | Inline `transient_csv.base64_data` |
| Admin login | `POST /api/v1/admin/auth/token/` |
| Admin summary/table/detail | `/api/v1/admin/...` |

## Security model

User/admin JWTs are never exposed to browser JavaScript. The Next.js API layer stores access/refresh tokens in HttpOnly, SameSite=Lax cookies and performs refresh/retry server-side. Guest calculation tokens remain browser-local because they are the backend capability credential for ownerless retained guest records.

## Immutable algorithm values shown in Step 2

- PV size: 5.0 kW
- Retail price: AUD 0.3773/kWh
- Feed-in tariff: AUD 0.124/kWh
- Battery annual payment rate: AUD 50/kWh/year
- Search range: 0–50 kWh
- SOC range: 10%–95%

The frontend does not send fake overrides for these constants.
