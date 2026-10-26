# Energy Flow Architecture Cleanup — 26 October 2026

The homepage shows **static directional examples**, not a replicated MATLAB model or real household hourly calculations.

Correctly oriented routes: Solar → Home, Solar → Battery, Battery → Home, Grid → Home (import), Solar → Grid (export).

Removed the former JavaScript implementation of Version 2 dispatch equations (`illustrativeClientV2Hour`). No SOC, conversion efficiency, battery/inverter limit, export cap, financing or annual cost is computed by the frontend animation.

The scientific simulation is expected to run only on the Django server using GNU Octave and client-provided MATLAB source. Future real-time energy animation requires hourly dispatch returned from the backend; annual result summaries cannot justify hourly animations.

Read `ARCHITECTURE_AUDIT_26OCT2026.md` for the remaining verification boundaries.
