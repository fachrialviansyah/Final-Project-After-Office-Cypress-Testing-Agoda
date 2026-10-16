// Run: node cypress/support/utils/helpers.check.js
const assert = require('node:assert');
const { getTomorrow, toMinutes, normalizeTime, parseMoney, durationMinutes, pickEarliestFlight } = require('./helpers');

assert.deepEqual(getTomorrow(new Date(2026, 4, 25)), { iso: '2026-05-26', shortLabel: '26 May', longLabel: 'Tue, May 26, 2026' });
assert.equal(getTomorrow(new Date(2026, 0, 31)).iso, '2026-02-01');
assert.equal(getTomorrow(new Date(2028, 1, 28)).iso, '2028-02-29');
assert.equal(getTomorrow(new Date(2026, 11, 31)).iso, '2027-01-01');

assert.equal(toMinutes('09:10'), 550);
assert.equal(normalizeTime('9:05'), '09:05');
assert.throws(() => toMinutes('9.05'));

assert.deepEqual(parseMoney('Rp 2,657,937'), { currency: 'Rp', amount: 2657937 });
assert.deepEqual(parseMoney('Rp4,803,408'), { currency: 'Rp', amount: 4803408 });
assert.deepEqual(parseMoney('$1,234.56'), { currency: '$', amount: 1234.56 });
assert.throws(() => parseMoney(''));

assert.equal(durationMinutes('10h 15m'), 615);
assert.equal(durationMinutes('45m'), 45);
assert.equal(durationMinutes('2h'), 120);
assert.equal(durationMinutes(''), Infinity);

const f = (index, departureTime, amount, duration = '1h') => ({ index, departureTime, price: { amount }, duration });
assert.equal(pickEarliestFlight([f(0, '12:15', 1), f(1, '09:10', 900), f(2, '09:10', 500), f(3, '11:10', 1)]).index, 2);
assert.equal(pickEarliestFlight([f(0, '09:10', 500), f(1, '09:10', 500)]).index, 0);
assert.equal(pickEarliestFlight([f(0, '09:10', 500, '10h 15m'), f(1, '09:10', 500, '4h 30m')]).index, 1);
assert.throws(() => pickEarliestFlight([]));

console.log('helpers ok');
