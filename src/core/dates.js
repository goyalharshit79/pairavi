// Calendar-date arithmetic on plain "YYYY-MM-DD" strings.
//
// Every legal period in this app is counted the way Indian statutes count
// them (General Clauses Act, 1897, s.9): the day of the triggering event is
// excluded, so "within 30 days from 1 March" ends on 31 March. That makes the
// last permitted day simply `addDays(trigger, n)`.
//
// All maths runs in UTC on date-only values so a phone's timezone can never
// shift a deadline by a day.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(s) {
  if (typeof s !== "string") return false;
  const m = ISO.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function toUTC(s) {
  if (!isISODate(s)) throw new TypeError(`Not a YYYY-MM-DD date: ${s}`);
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY = 86400000;

export function addDays(s, n) {
  return fromUTC(toUTC(s) + n * DAY);
}

// Calendar months, clamped to the last day of the target month
// (31 Jan + 1 month = 28/29 Feb), which is how "one month" is read in law.
export function addMonths(s, n) {
  const [y, m, d] = s.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUTC(target.getTime());
}

export function addYears(s, n) {
  return addMonths(s, 12 * n);
}

// Whole days from a to b (b - a). Positive when b is later.
export function daysBetween(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

export function maxDate(...dates) {
  const real = dates.filter(Boolean);
  if (!real.length) return null;
  return real.reduce((a, b) => (toUTC(a) >= toUTC(b) ? a : b));
}

export function minDate(...dates) {
  const real = dates.filter(Boolean);
  if (!real.length) return null;
  return real.reduce((a, b) => (toUTC(a) <= toUTC(b) ? a : b));
}

export function compare(a, b) {
  return toUTC(a) - toUTC(b);
}

// Today as the person's own calendar sees it (their phone's local date).
export function todayLocal(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "10 Nov 2026" — the day-month-year order Indian readers expect.
export function formatDate(s) {
  if (!isISODate(s)) return "";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "10 November 2026" for letters.
export function formatDateLong(s) {
  if (!isISODate(s)) return "";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${LONG_MONTHS[m - 1]} ${y}`;
}

export function weekday(s) {
  return WEEKDAYS[new Date(toUTC(s)).getUTCDay()];
}

// Human countdown: "today", "tomorrow", "in 12 days", "3 days ago".
export function relative(date, today) {
  const n = daysBetween(today, date);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 0) return `in ${n} days`;
  return `${-n} days ago`;
}
