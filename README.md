# Smart Battery Calculator — Functional Dummy Frontend v4

A self-contained Next.js App Router prototype for the Smart Battery Calculator. It uses bundled JSON, local Next.js dummy APIs, browser fallbacks, client-side validation, and a separate demo admin dashboard.

No Django, MATLAB, database, or external API is required yet.

## Run locally

```bash
npm install
npm run dev:local
```

Open:

```text
http://localhost:3000
```

For production-style testing without the Next.js development HMR WebSocket:

```bash
npm run build
npm start
```

## User pages

```text
/dashboard
/calculator/load-solar
/calculator/tariff
/calculator/battery-costs
/calculator/results
/saved-scenarios
/results-history
/tariff-library
/help
/about
```

## Admin area

Login page:

```text
/admin/login
```

Demo credentials:

```text
Username: admin
Password: 123
```

After login:

```text
/admin
```

The admin dashboard is separate from the normal user dashboard. It includes:

- saved scenario count
- average annual savings
- average recommended battery size
- number of available tariffs
- prototype system status
- recent saved scenarios
- admin delete action
- reset demo scenarios
- refresh dashboard
- logout

The login endpoint sets an HttpOnly demo session cookie. **This is not production authentication.** The username/password are deliberately hard-coded for the prototype and must be replaced before real deployment.

## Validation and warnings

The current frontend validates every editable field in the implemented workflow.

### Step 1 — Load & Solar

CSV validation includes:

- `.csv` extension
- accepted CSV/text MIME types
- non-empty file
- maximum 5 MB size
- header row required
- at least one data row
- duplicate column names rejected
- excessive malformed row lengths rejected
- numeric usage column detection
- excessive missing/non-numeric usage values rejected
- negative usage rejected
- zero-total usage rejected
- warnings for very low/high derived daily usage
- warning for limited data

Simple household data validation includes:

- daily usage required
- numeric value required
- allowed range 1–100 kWh/day
- warning below 5 kWh/day
- warning above 50 kWh/day
- usage pattern required

PV validation includes:

- value required
- numeric value required
- allowed range 1–30 kW
- warning below 2 kW
- warning above 15 kW

### Step 2 — Tariff

- tariff required
- tariff import rates checked
- feed-in tariff required; 0 is accepted
- feed-in tariff range $0–$2/kWh
- warning for unusually high feed-in values
- warning when feed-in exceeds the peak import rate
- demand charge required; 0 is accepted
- demand charge range $0–$100/kW/day
- warning for unusually high demand charges

### Step 3 — Battery & Costs

- all fields required
- battery cost: $1–$100,000
- replacement cost: $0–$100,000
- efficiency: 50–100%
- depth of discharge: 50–100%
- project lifetime: 1–30 years
- discount rate: 0–30%
- warnings for unusually low/high cost assumptions
- warning for efficiency below 80%
- warning for DoD above 95%
- warning for lifetime above 20 years
- warning for discount rate above 15%

**Errors block the Next button. Warnings are shown but do not block the user.**

### Results and saved scenarios

Before calculating, the full draft is validated again. Saved scenario names and editable scenario values are also validated on both the client and dummy API routes.

## Dummy API routes

```text
GET    /api/load-profiles
POST   /api/csv/analyze
GET    /api/tariffs
POST   /api/calculate
GET    /api/scenarios
POST   /api/scenarios
PUT    /api/scenarios?id=<id>
DELETE /api/scenarios?id=<id>
GET    /api/dashboard/recent
POST   /api/admin/login
POST   /api/admin/logout
```

## Dummy data

```text
data/mock/load-profiles.json
data/mock/tariffs.json
data/mock/scenarios.json
data/mock/calculate-request.example.json
data/mock/calculation-result.json
data/mock/save-scenario-request.example.json
```

## Browser state

In-progress calculation:

```text
localStorage: smart-battery-calculator-draft-v4
```

Saved demo scenarios:

```text
localStorage: smart-battery-scenarios-v4
```

The versioned keys prevent stale data from older prototype builds from breaking the current workflow.

## Baseline demo flow

Use:

```text
Average daily usage: 18 kWh/day
Usage pattern: Balanced
PV size: 6.6 kW
Tariff: Time of Use (3 Periods)
Battery cost: $8,000
Replacement cost: $8,000
Efficiency: 90%
Depth of discharge: 90%
Lifetime: 15 years
Discount rate: 6%
```

Expected dummy result is approximately:

```json
{
  "recommendedBatterySize": 10,
  "annualBillReduction": 1050,
  "annualReductionPercent": 43.8,
  "paybackPeriod": 7.6,
  "netPresentValue": 6780,
  "withoutBatteryBill": 2400,
  "withBatteryBill": 1350
}
```

These values are demonstrations only.

## About `_next/hmr` WebSocket errors

A console message such as:

```text
WebSocket connection to ws://192.168.x.x:3000/_next/hmr failed
```

is the Next.js development hot-module-reload WebSocket. It is not the Smart Battery Calculator API. On the same Mac, use:

```bash
npm run clean
npm run dev:local
```

and browse to `http://localhost:3000`.

The app also has local data/calculation fallbacks so temporary development WebSocket/API reconnects do not leave the main pages permanently loading.
