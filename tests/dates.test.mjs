import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDate,nightsBetween,totalPrice,overlaps,isRangeAvailable,addDays,buildMonth} from '../src/lib/dates.ts';
test('24–31 Oct is 7 nights, 315000 KZT',()=>{assert.equal(nightsBetween('2026-10-24','2026-10-31'),7);assert.equal(totalPrice('2026-10-24','2026-10-31',45000),315000)});
test('reverse dates cannot be booked',()=>{assert.equal(nightsBetween('2026-10-24','2026-10-15'),0);assert.equal(totalPrice('2026-10-24','2026-10-15',45000),0)});
test('checkout exclusive: adjacent bookings allowed',()=>{assert.equal(overlaps('2026-10-24','2026-10-31','2026-10-31','2026-11-02'),false);assert.equal(overlaps('2026-10-24','2026-10-31','2026-10-30','2026-11-02'),true)});
test('invalid dates rejected',()=>{assert.equal(parseDate('2026-02-30'),null);assert.equal(parseDate('2026-1-3'),null)});
test('conflicts prevent booking',()=>{const b=[{start:'2026-10-25',end:'2026-10-27'}];assert.equal(isRangeAvailable('2026-10-24','2026-10-28',b),false);assert.equal(isRangeAvailable('2026-10-27','2026-10-29',b),true)});
test('date math survives month and DST',()=>{assert.equal(addDays('2026-10-31',1),'2026-11-01');assert.equal(nightsBetween('2026-03-28','2026-03-30'),2);assert.equal(buildMonth(2026,9).filter(Boolean).length,31)});
