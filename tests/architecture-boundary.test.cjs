const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');

test('generated input calculation submits to Django v1 endpoint', () => {
 const api=read('lib/api.ts');
 assert.match(api, /optionalUserFetch\("\/calculations\/generated-annual-v1\/"/);
 assert.match(api, /method: "POST"/);
 assert.match(api, /JSON\.stringify\(payload\)/);
});
test('workbook calculation submits to updated Django v1 endpoint only', () => {
 const api=read('lib/api.ts');
 assert.match(api, /optionalUserFetch\("\/calculations\/client-workbook-v1\/"/);
 assert.doesNotMatch(api, /"\/calculations\/client-workbook\/"/);
});
test('frontend has no local client model simulator', () => {
 const flow=read('src/lib/energy-flow.ts');
 const fixture=read('lib/energy-flow-scenarios.ts');
 assert.doesNotMatch(flow, /illustrativeClientV2Hour|SOC_MIN|CHARGE_EFF|DISCHARGE_EFF|BATTERY_EFF|POWER_RATIO|EXPORT_LIMIT_KWH|inverterLimit/);
 assert.doesNotMatch(fixture, /illustrativeClientV2Hour|batteryCapacityKwh|startingSocFraction|Math\.min|Math\.max/);
 assert.match(fixture, /STATIC, hand-authored arrow-direction/);
});
test('no frontend MATLAB or Octave execution mechanism', () => {
 const api=read('lib/api.ts'), ui=read('lib/algorithm-v1.ts');
 assert.doesNotMatch(api, /child_process|oct2py|octave-cli|\.m\b.*spawn/i);
 assert.doesNotMatch(ui, /fminbnd|fminsearch|SOC_MIN|CHARGE_EFF|DISCHARGE_EFF|EXPORT_LIMIT_KWH/);
 assert.match(ui, /UI schema/);
});
