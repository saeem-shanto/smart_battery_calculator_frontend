# Frontend UI/UX Review — v1.5.7

This release preserves the approved Smart Battery Calculator theme, page layout, sidebar structure, colour system and Lucide icon language. The changes refine interaction quality rather than redesigning the product.

## Core calculator

- Step indicators expose the active step to assistive technology.
- Step 1 supports click, keyboard and drag/drop upload while retaining the same upload card.
- File validation, row-count state, removal and retry feedback are shown in context.
- Invalid inputs receive the existing red border/shadow treatment, an inline message, and focus/scroll to the first issue.
- Location fields are clearly distinguished from optimisation inputs.
- Retention ON/OFF state is explicit and the server/browser retention distinction is explained.
- Steps 2 and 3 carry forward compact workflow context so users know what has already been validated and selected.
- Step 4 distinguishes calculation progress, engine failure, download failure, saved results and transient results.
- Long calculations show elapsed progress messaging without implying the page has frozen.
- Transient successful results are cached for the browser session so refresh does not silently rerun Octave.

## Accounts and profile

- Registration, sign-in and password changes use field-level validation.
- Django password-quality messages attach to the Password field instead of exposing `non_field_errors`.
- Password requirements and confirmation state are visible before submission.
- Profile forms show whether changes are saved or still pending.
- Avatar file requirements and destructive removal confirmation are explicit.
- Account-backend outages are distinguished from true guest mode.

## Calculation history

- Search, clear and result counts are explicit.
- Account-owned and browser guest records remain understandable.
- Status is visually differentiated without changing the existing theme.
- Delete uses a deliberate confirmation dialog rather than an accidental one-click action.
- Empty states distinguish no calculations from no search matches.

## Tariff library

- Adds loading, refresh, search, tariff-kind filter, clear filter and result-count states.
- Missing tariff values display as unavailable rather than as misleading zero values.
- The existing reference-only scope warning remains prominent.

## Admin

- Calculation filters have submit/clear states and record counts.
- Record status, backend error details and warnings are easier to scan.
- Metadata JSON and postcode edits validate before save.
- File actions show working state.
- Admin profile receives the same validation/password/avatar UX as user profiles.

## Accessibility and responsiveness

- Skip-to-content links are available in user and admin shells.
- Active navigation links use `aria-current`.
- Debug disclosure uses `aria-expanded`/`aria-controls`.
- Focus-visible treatment is consistent with the existing theme.
- Motion respects `prefers-reduced-motion`.
- Existing responsive layout is preserved and the new toolbars/context strips adapt on smaller screens.
