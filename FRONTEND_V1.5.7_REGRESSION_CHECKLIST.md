# Frontend v1.5.7 Regression Checklist

## Build
- `npm install`
- `npm run typecheck`
- `npm run build`

## Guest calculator
- Upload by Select File and drag/drop.
- Invalid extension/oversize file highlights upload control.
- Valid 8760/8784-row workbook validates successfully.
- Invalid postcode highlights/focuses Postcode.
- Retention OFF produces a transient result and no saved history record.
- Refreshing a successful transient result does not automatically rerun Octave.
- Retention ON produces a guest-token retained calculation and history entry.
- 502/503/504 engine errors preserve inputs and show Retry/Back actions.

## Account
- Register with a common/numeric password: Password field is highlighted and Django password messages appear below it.
- Login failure highlights the relevant credential state without raw API keys.
- Retained calculation while signed in is account-owned and does not require a guest token.
- Profile edit shows Unsaved changes and disables Save when unchanged.
- Avatar upload/remove works.
- Password mismatch is shown below Confirm password.
- Backend outage shows account unavailable rather than falsely changing to Guest mode.

## History
- Search and Clear work.
- Status labels render correctly for completed/processing/failed records.
- Delete requires confirmation.
- Claiming a guest retained record moves it to account ownership.
- Failed/incomplete records never crash numeric formatting.

## Tariffs
- Loading/refresh/search/type filter work.
- Missing rate fields show an em dash rather than 0.000.

## Admin
- Login and profile validation work.
- Calculation filtering and clear filters work.
- Detail modal closes by close action and Escape.
- Invalid metadata JSON cannot be saved.
- File download/delete actions show progress and errors.

## Accessibility/mobile
- Keyboard focus is visible.
- Skip-to-content works in user and admin shells.
- Active sidebar items expose `aria-current`.
- Upload area is keyboard operable.
- Main calculator/history/admin flows remain usable at mobile widths.
