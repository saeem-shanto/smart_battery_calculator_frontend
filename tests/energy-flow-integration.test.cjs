const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getScenario, HERO_ROUTE_PATHS, ENERGY_FLOW_SCENARIOS } = require('../.flow-test-build/lib/energy-flow-scenarios.js');
const { activeFlowRoutes } = require('../.flow-test-build/src/lib/energy-flow.js');
const root = path.resolve(__dirname, '..');
const keys = f => activeFlowRoutes(f).map(r => r.key);

const expectations = {
 'solar-surplus': ['solarToHome','solarToBattery','solarToGrid'],
 'solar-only': ['solarToHome'],
 'battery-discharge': ['batteryToHome','gridToHome'],
 'grid-import': ['gridToHome'],
 'grid-export': ['solarToHome','solarToGrid'],
};

test('all five homepage scenarios use client V2-derived one-hour dispatch, not annual totals', () => {
 assert.equal(ENERGY_FLOW_SCENARIOS.length, 5);
 for (const scenario of ENERGY_FLOW_SCENARIOS) {
  const {flow} = getScenario(scenario.key);
  assert.deepEqual(keys(flow), expectations[scenario.key], scenario.key);
  assert.ok(flow.gridToHome === 0 || flow.solarToGrid === 0, 'cannot import and export simultaneously');
 }
});

test('solar surplus includes proper positive solar -> grid export and never grid import', () => {
 const {flow} = getScenario('solar-surplus');
 assert.ok(flow.solarToHome > 0 && flow.solarToBattery > 0 && flow.solarToGrid > 0);
 assert.equal(flow.gridToHome, 0);
});

test('grid import starts at the grid and moves toward the home', () => {
 const {flow} = getScenario('grid-import');
 assert.equal(flow.gridToHome, 3);
 const p = HERO_ROUTE_PATHS.gridToHome;
 assert.match(p, /^M 684 145 /);
 assert.match(p, /646 247$/);
});

test('grid export starts at solar and moves toward the grid (opposite route to import)', () => {
 const {flow} = getScenario('grid-export');
 assert.equal(flow.solarToGrid, 5);
 assert.equal(flow.gridToHome, 0);
 assert.match(HERO_ROUTE_PATHS.solarToGrid, /^M 330 190 /);
 assert.match(HERO_ROUTE_PATHS.solarToGrid, /679 139$/);
});

test('battery discharge delivers power to the home before residual grid import', () => {
 const {flow} = getScenario('battery-discharge');
 assert.ok(flow.batteryToHome > 0 && flow.gridToHome > 0);
 assert.equal(flow.solarToBattery, 0);
 assert.match(HERO_ROUTE_PATHS.batteryToHome, /^M 477 287 /);
 assert.match(HERO_ROUTE_PATHS.batteryToHome, /538 271$/);
});

test('all active arrows use unique direction-specific physical paths', () => {
 const paths = Object.values(HERO_ROUTE_PATHS);
 assert.equal(paths.length, 5);
 assert.equal(new Set(paths).size, 5);
 assert.notEqual(HERO_ROUTE_PATHS.gridToHome, HERO_ROUTE_PATHS.solarToGrid);
});

test('real dashboard integrates the verified animation with accessible scenario buttons', () => {
 const component = fs.readFileSync(path.join(root,'components/EnergyEcosystem.tsx'),'utf8');
 const dashboard = fs.readFileSync(path.join(root,'components/DashboardClient.tsx'),'utf8');
 assert.match(component, /activeFlowRoutes\(flow\)/);
 assert.match(component, /routes\.map\(route\s*=>/);
 assert.match(component, /HERO_ROUTE_PATHS\[route\.key\]/);
 assert.match(component, /setScenarioKey\(item\.key\)/);
 assert.match(component, /aria-pressed=\{scenarioKey === item\.key\}/);
 assert.match(component, /markerEnd=/);
 assert.match(component, /animateMotion/);
 assert.match(component, /not a live calculation/);
 assert.match(dashboard, /<EnergyEcosystem\s*\/>/);
});
