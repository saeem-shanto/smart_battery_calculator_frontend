import test from 'node:test';
import assert from 'node:assert/strict';
import { activeFlowRoutes, ENERGY_ROUTES, flowFromHourlyDispatch, illustrativeClientV2Hour } from '../dist/energy-flow.js';

const approx = (got, expected, eps = 1e-8) =>
  assert.ok(Math.abs(got - expected) <= eps, `expected ${expected}, got ${got}`);

const hour = (overrides = {}) => ({
  pvKwh: 0, loadKwh: 0, batteryChargeKwh: 0, batteryDischargeKwh: 0,
  gridImportKwh: 0, gridExportKwh: 0, ...overrides,
});

test('solar serves home before other pathways', () => {
  const f = flowFromHourlyDispatch(hour({ pvKwh: 2, loadKwh: 2 }));
  approx(f.solarToHome, 2);
  assert.deepEqual(activeFlowRoutes(f).map(v => v.key), ['solarToHome']);
});

test('surplus PV charges battery, then exports the remainder', () => {
  const f = flowFromHourlyDispatch(hour({ pvKwh: 5, loadKwh: 2, batteryChargeKwh: 2, gridExportKwh: 1 }));
  approx(f.solarToHome, 2); approx(f.solarToBattery, 2); approx(f.solarToGrid, 1);
  approx(f.gridToHome, 0); approx(f.batteryToHome, 0);
});

test('full battery sends export to grid (not grid to home)', () => {
  const f = flowFromHourlyDispatch(hour({ pvKwh: 4, loadKwh: 1, gridExportKwh: 3 }));
  assert.deepEqual(activeFlowRoutes(f).map(v => v.key), ['solarToHome', 'solarToGrid']);
});

test('night-time import flows GRID -> HOME', () => {
  const f = flowFromHourlyDispatch(hour({ loadKwh: 3, gridImportKwh: 3 }));
  assert.deepEqual(activeFlowRoutes(f).map(v => [v.from, v.to]), [['Grid', 'Home']]);
});

test('battery discharges to home before residual grid import', () => {
  const f = flowFromHourlyDispatch(hour({ loadKwh: 6, batteryDischargeKwh: 3, gridImportKwh: 3 }));
  assert.deepEqual(activeFlowRoutes(f).map(v => v.key), ['batteryToHome', 'gridToHome']);
});

test('zero-energy interval animates nothing', () => {
  assert.equal(activeFlowRoutes(flowFromHourlyDispatch(hour())).length, 0);
});

test('curtailment is not misrepresented as export', () => {
  const f = flowFromHourlyDispatch(hour({ pvKwh: 10, loadKwh: 2, gridExportKwh: 5 }));
  approx(f.curtailedSolar, 3); approx(f.solarToGrid, 5);
});

test('rejects simultaneous import and export', () => {
  assert.throws(() => flowFromHourlyDispatch(hour({ pvKwh: 5, loadKwh: 2, gridImportKwh: 1, gridExportKwh: 1 })), /import and export simultaneously/);
});

test('rejects physically impossible energy balances and negative flows', () => {
  assert.throws(() => flowFromHourlyDispatch(hour({ loadKwh: 3, gridImportKwh: 2 })), /energy balance/);
  assert.throws(() => flowFromHourlyDispatch(hour({ gridImportKwh: -1 })), /non-negative/);
  assert.throws(() => flowFromHourlyDispatch(hour({ pvKwh: 1, batteryChargeKwh: 2 })), /PV allocation exceeds/);
});

test('rejects simultaneous battery charge and discharge', () => {
  assert.throws(() => flowFromHourlyDispatch(hour({ pvKwh: 1, loadKwh: 1, batteryChargeKwh: 1, batteryDischargeKwh: 1 })), /charges and discharges/);
});

test('every arrow endpoint has correct direction, especially grid import and export', () => {
  const lookup = Object.fromEntries(ENERGY_ROUTES.map(x => [x.key, `${x.from}->${x.to}`]));
  assert.deepEqual(lookup, {
    solarToHome: 'Solar->Home', solarToBattery: 'Solar->Battery',
    batteryToHome: 'Battery->Home', gridToHome: 'Grid->Home',
    solarToGrid: 'Solar->Grid',
  });
  const importPath = ENERGY_ROUTES.find(x=>x.key==='gridToHome').path;
  assert.match(importPath, /^M 682 232 L 521 232$/); // right -> left
});

test('client V2 t>=2: charge limited by beta*x and export leftover', () => {
  const result = illustrativeClientV2Hour({ pvKwh: 6, loadKwh: 2, batteryCapacityKwh: 10, startingSocFraction: .5 });
  approx(result.dispatch.batteryChargeKwh, 3.7);
  approx(result.dispatch.gridExportKwh, .3);
  approx(result.endingSocFraction, .5 + 3.7*.96/10);
});

test('client V2 t>=2: max SoC and 5 kWh/hour export cap', () => {
  const result = illustrativeClientV2Hour({ pvKwh: 10, loadKwh: 2, batteryCapacityKwh: 10, startingSocFraction: .95 });
  approx(result.dispatch.batteryChargeKwh, 0);
  approx(result.dispatch.gridExportKwh, 5);
  approx(result.flow.curtailedSolar, 3);
});

test('client V2 t>=2: discharge limited by SoC and efficiency', () => {
  const result = illustrativeClientV2Hour({ pvKwh: 0, loadKwh: 6, batteryCapacityKwh: 10, startingSocFraction: .5 });
  const discharge = .4*10*.96*.95;
  approx(result.dispatch.batteryDischargeKwh, discharge);
  approx(result.dispatch.gridImportKwh, 6-discharge);
  approx(result.endingSocFraction, .1);
});

test('client V2 t>=2: depleted battery cannot discharge, imports grid supply', () => {
  const result = illustrativeClientV2Hour({ pvKwh: 0, loadKwh: 4, batteryCapacityKwh: 10, startingSocFraction: .1 });
  approx(result.dispatch.batteryDischargeKwh, 0);
  approx(result.dispatch.gridImportKwh, 4);
});

test('rejects invalid battery SoC and capacity for illustrative step', () => {
  assert.throws(() => illustrativeClientV2Hour({ pvKwh: 0, loadKwh: 1, batteryCapacityKwh: 0, startingSocFraction:.1 }), /positive/);
  assert.throws(() => illustrativeClientV2Hour({ pvKwh: 0, loadKwh: 1, batteryCapacityKwh: 10, startingSocFraction:.99 }), /10%–95%/);
});
