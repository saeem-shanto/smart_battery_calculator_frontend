# Complete v4 Functional Test

Run:

```bash
npm install
npm run dev:local
```

Open `http://localhost:3000`.

## 1. Dashboard

- Dashboard should render immediately.
- Recent calculations should be visible.
- All sidebar routes should open.
- Admin Portal should open `/admin/login`.

## 2A. Step 1 — simple household data

- Open New Calculation.
- Choose **Enter simple household data**.
- Clear the daily usage field and click Next: an error must appear and navigation must be blocked.
- Enter `0`: range error must appear.
- Enter `3`: warning should appear but navigation is allowed.
- Enter `18` and keep Balanced.
- Clear PV size and click Next: required error must appear.
- Enter `31`: range error must appear.
- Enter `6.6`: no blocking error.
- Click **Next: Tariff** and confirm Step 2 opens.

## 2B. Step 1 — CSV

- Return to New Calculation.
- Choose CSV mode.
- Try a non-CSV file: an error must appear.
- Upload `public/sample-electricity-usage.csv`.
- Expected: about 48 rows, 18 kWh total and 18 kWh/day.
- Keep PV at 6.6 kW and click Next.
- Step 2 must open.

## 2C. Step 1 — sample profile

- Choose sample profile.
- Pick any demo profile.
- Enter valid PV size.
- Next must work without a CSV.

## 3. Step 2 — tariff

- Tariff cards should render immediately.
- Empty feed-in should block Next.
- Negative feed-in should block Next.
- A very high but allowed value such as `0.60` should show a warning.
- Empty demand charge should block Next; `0` is valid.
- Continue using normal values.

## 4. Step 3 — battery and costs

Test each invalid value and verify Next is blocked:

- battery cost `0`
- replacement cost negative
- efficiency `49`
- DoD `49`
- project lifetime `0`
- discount rate `31`

Also verify warnings appear for unusual but allowed values such as efficiency `70`, DoD `99`, lifetime `25`, or discount rate `20`.

Return to normal values and click Next.

## 5. Results

- Result cards and charts should appear immediately.
- Full draft validation runs before calculation.
- Save Scenario opens a modal.
- Blank scenario name cannot be saved.
- Save a valid scenario.

## 6. Saved Scenarios

- Saved scenario should be visible.
- Search, View, Edit and Delete should work.
- Edit validation should reject blank names, battery size <= 0 or > 100 kWh, and negative/huge annual savings.
- Refresh the browser and verify browser-saved data remains.

## 7. Results History

- It should render immediately and never remain at `Loading result history...`.
- Eye action should open the selected saved scenario.

## 8. Admin login

Open `/admin/login`.

Credentials:

```text
admin
123
```

Tests:

- blank username -> validation error
- blank password -> validation error
- wrong credentials -> invalid login error
- `admin` / `123` -> redirect to `/admin`
- navigating directly to `/admin` without the admin cookie -> redirect to `/admin/login`

## 9. Admin dashboard

- stats should load
- system status should show Online for the demo components
- Refresh should work
- deleting a scenario should update the table
- Reset demo scenarios should restore the seed records
- Open User Website should return to `/dashboard`
- Log Out should clear the admin cookie and return to login

## 10. Build checks

Run:

```bash
npm run typecheck
npm run build
```

Both should finish without errors before using this as the presentation/demo build.
