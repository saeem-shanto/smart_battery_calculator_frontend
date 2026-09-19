# Frontend v1.5.6 Production Summary

- Removed the Next.js API proxy layer (`app/api/*`) and server token helpers.
- Browser now calls Django `/api/v1` directly for every application API.
- Added shared direct API/JWT client with automatic access-token refresh.
- User and admin sessions use per-tab `sessionStorage`, not long-lived local storage.
- Protected avatars and files are downloaded through authenticated fetch requests.
- Guest calculation tokens remain supported through `X-Calculation-Token`.
- Signed-in retained calculations are owned by the Django user and do not require a guest token.
- Direct uploads remove the Vercel Function body-size bottleneck.
- Added transient-result session caching/attempt protection so refreshing Step 4 does not silently rerun an expensive private calculation.
- Separated calculation errors from download errors.
- Invalid replacement uploads clear stale IndexedDB workbook data.
- Existing theme, layout, sidebar, charts and icon system remain unchanged.
- App browser icon/title branding retained.
- Development debug overlay retained and production-disabled by environment setting.
- Next.js updated to the current 15.5 maintenance patch target (`15.5.25`).

## v1.5.6 validation UX refinement

- Registration API validation is mapped to the exact form field instead of exposing raw Django keys.
- `non_field_errors` containing password-quality failures are attached to the Password field.
- Invalid account/admin/profile/password inputs receive the existing red border/focus ring.
- The first invalid field is focused and smoothly scrolled into view.
- Field messages render directly below the corresponding input and are linked with `aria-invalid` / `aria-describedby` where applicable.
- Field errors clear as the user edits the affected value.
- Login credential failures use a concise user-facing message rather than raw backend validation structures.
