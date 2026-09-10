# Validation and Admin Notes

This frontend now uses a two-level validation model:

- **Error**: invalid/missing data; blocks navigation or save action.
- **Warning**: allowed but unusual data; user can continue after reviewing it.

Validation exists in the page UI and key dummy API/storage functions so direct API calls cannot silently accept obviously invalid scenario/calculation data.

## Admin credentials

Development only:

```text
Username: admin
Password: 123
```

Admin login is handled by `POST /api/admin/login`, which sets an HttpOnly cookie for eight hours. The protected `/admin` page checks the cookie server-side.

This is intentionally a prototype. For real deployment, replace the hard-coded credential check with a proper user database, hashed passwords, CSRF-aware authentication/session handling, authorization roles, audit logging, rate limiting, and HTTPS deployment.
