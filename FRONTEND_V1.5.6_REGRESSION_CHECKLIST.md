# Frontend v1.5.6 Regression Checklist

1. Health: dashboard reports backend online.
2. Workbook validation: valid annual file returns validation success; invalid file highlights Step 1.
3. Guest transient calculation: retain OFF → result, no backend record, refresh does not automatically rerun Octave.
4. Guest retained calculation: retain ON → guest token stored locally, record can be reopened/downloaded/deleted.
5. User registration/login: JWT session survives reload in the same tab and refreshes automatically.
6. Signed-in retained calculation: no guest token is required; record appears under account calculations.
7. Claim guest calculation: signed-in user can claim a browser guest record; old guest token stops working afterward.
8. Profile/avatar: upload, authenticated display, remove, profile edit, password change.
9. Admin: staff login, list/detail/update/delete records, authenticated file download/delete, admin profile/avatar/password.
10. Error handling: backend 502/503/504 shows calculation error without crashing; file-download errors do not display as calculation failures.
11. New Calculation: clears old draft file and transient cached result.
12. Production: `NEXT_PUBLIC_APP_DEBUG=false`; no DEBUG panel displayed.

## Field-level validation UX

- [ ] Register with an empty/short username: Username is bordered red, focused, and shows its message below the field.
- [ ] Register with mismatched passwords: Confirm password is bordered red and receives focus.
- [ ] Register with a common or entirely numeric password: backend password-quality message appears under Password; no `non_field_errors` text is shown.
- [ ] Register with an existing username/email: the corresponding backend field is highlighted.
- [ ] User login with missing values: the missing field is highlighted and focused.
- [ ] Admin login with missing values: the missing field is highlighted and focused.
- [ ] Profile update with duplicate/invalid username or email: the exact field is highlighted.
- [ ] Password change with bad current/new password: the exact password field is highlighted.
