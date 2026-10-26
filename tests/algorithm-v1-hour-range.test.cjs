const test = require('node:test');
const assert = require('node:assert/strict');
const { hourRange } = require('../.algorithm-test-build/algorithm-v1.js');

test('hourRange is an exported function', () => {
  assert.equal(typeof hourRange, 'function');
});
test('hourRange formats the first hourly tariff slot', () => {
  assert.equal(hourRange(0), '00:00–01:00');
});
test('hourRange formats the last hourly tariff slot across midnight', () => {
  assert.equal(hourRange(23), '23:00–00:00');
});
test('hourRange rejects an out-of-range hour', () => {
  assert.throws(() => hourRange(24), RangeError);
  assert.throws(() => hourRange(-1), RangeError);
});
test('hourRange rejects non-integer indices', () => {
  assert.throws(() => hourRange(1.5), RangeError);
  assert.throws(() => hourRange(Number.NaN), RangeError);
});
