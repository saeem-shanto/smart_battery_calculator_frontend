# Authentication UI — v1.5.8

The existing visual theme/layout/icons are preserved.

New UI behavior:

- User login shows the normal username/password form unless the backend returns `two_factor_required=true`.
- When 2FA is required, the same card switches to a six-digit OTP screen with masked email, expiry guidance, resend cooldown and Back action.
- Admin login uses the same OTP flow for staff accounts that enabled 2FA.
- User and admin profile pages include a Two-Factor Authentication card.
- Enabling 2FA requires current password and then an emailed code.
- Disabling 2FA requires current password.
- `/account/forgot-password` requests a reset email.
- `/account/reset-password` consumes the signed reset link and validates the new password.
- Reset success clears any stale user/admin session tokens from the current browser tab.
