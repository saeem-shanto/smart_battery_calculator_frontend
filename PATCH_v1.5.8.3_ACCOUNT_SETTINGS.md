# Frontend v1.5.8.3 — Account Settings Discoverability

This patch keeps the existing theme, sidebar layout and Lucide icon language while making account/security settings explicit for signed-in users.

## Changes

- Signed-in sidebar account card now includes a visible **Account Settings** link with the existing Lucide icon style.
- The profile screen is renamed **Account Settings** and explicitly states that it manages profile, email security, password and two-factor authentication.
- Added in-page quick links for **Profile Details**, **Two-Factor Authentication**, and **Password**.
- Dashboard signed-in greeting includes **Manage account & security**.
- Existing route remains `/account/profile`; no backend/API changes are required.
- Existing 2FA enable/disable, avatar, personal details and password-change components are unchanged.
