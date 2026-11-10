import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonths, addYears, daysBetween, isISODate, formatDate, relative, maxDate } from "../src/core/dates.js";

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-03-01", 30), "2026-03-31");
  assert.equal(addDays("2026-12-20", 15), "2027-01-04");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // leap year
});

test("addMonths clamps to the end of shorter months", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-10-15", 1), "2026-11-15");
  assert.equal(addYears("2028-02-29", 1), "2029-02-28");
});

test("daysBetween and relative wording", () => {
  assert.equal(daysBetween("2026-11-10", "2026-12-10"), 30);
  assert.equal(daysBetween("2026-11-10", "2026-11-01"), -9);
  assert.equal(relative("2026-11-11", "2026-11-10"), "tomorrow");
  assert.equal(relative("2026-11-07", "2026-11-10"), "3 days ago");
});

test("validation and formatting", () => {
  assert.ok(isISODate("2026-02-28"));
  assert.ok(!isISODate("2026-02-30"));
  assert.ok(!isISODate("10/11/2026"));
  assert.equal(formatDate("2026-11-10"), "10 Nov 2026");
  assert.equal(maxDate("2026-01-05", null, "2026-03-01"), "2026-03-01");
});
