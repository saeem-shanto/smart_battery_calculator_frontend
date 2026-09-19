# Frontend v1.5.3 Final Refinement

This frontend is aligned with backend v1.5.2 and preserves the existing visual theme, core layout and existing navigation icons.

## Added/refined

- Optional user registration/login/logout with server-side HttpOnly JWT cookies.
- Automatic user access-token refresh through Next.js BFF routes.
- User profile edit: unique username, name, email and private avatar upload/download/removal.
- Password change with session revocation and forced re-login.
- Account-owned retained calculations across sessions.
- Existing guest-token retained calculation flow preserved.
- Claim guest calculation into signed-in account.
- My Calculations merges account-owned records with this-browser guest records without duplicates.
- Dashboard recent calculations merges account + guest history.
- Account-aware calculation submission, retrieval, delete and file download.
- Admin profile page using the same Django identity/profile model, including avatar and password management.
- Development-only debug overlay controlled by `NEXT_PUBLIC_APP_DEBUG`.
- Browser title/favicon application mark in `app/icon.svg`.
- Production/local environment examples and updated integration documentation.

## Privacy/security

- User/admin JWTs are kept in HttpOnly, SameSite=Lax cookies and are not readable by browser JavaScript.
- Guest calculation tokens remain local to the browser because they are the backend capability credential for ownerless retained records.
- Transient calculations remain non-retained.
- No secret is expected in a `NEXT_PUBLIC_*` variable.

## Visual constraint

The existing color palette, main app frame, sidebar structure, calculator step layout, chart styling and existing sidebar icons were preserved. New account/profile controls reuse the same components, spacing, borders and typography.
