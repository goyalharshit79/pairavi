// The engine turns a case (what happened, with dates) into:
//   - where the case stands on its ladder,
//   - the one next move and the date it must happen by,
//   - every deadline that applies, each tied to the clause that sets it.
//
// Each playbook supplies `evaluate(caseData, today, helpers)`; this module
// supplies the shared vocabulary so all four ladders answer the same way.

import { addDays, compare, daysBetween, isISODate } from "./dates.js";

// Deadline kinds, from the person's point of view.
export const KIND = {
  THEIRS: "theirs", // the other side must act by this date
  OPENS: "opens", // you may take the next step from this date
  YOURS: "yours", // you must act by this date or lose the step
};

// How urgent a date is relative to today.
export function urgency(date, today, kind) {
  const n = daysBetween(today, date);
  if (kind === KIND.OPENS) return n <= 0 ? "open" : "later";
  if (n < 0) return kind === KIND.YOURS ? "missed" : "overdue";
  if (n === 0) return "today";
  if (kind === KIND.YOURS && n <= 14) return "soon";
  return "later";
}

export function deadline({ id, label, date, kind, source, detail = "", met = false }, today) {
  const status = met ? "met" : urgency(date, today, kind);
  return { id, label, date, kind, source, detail, status, days: daysBetween(today, date) };
}

// Events sorted oldest first; ties keep entry order.
export function sortedEvents(c) {
  return (c.events || [])
    .filter((e) => e && isISODate(e.date))
    .map((e, i) => ({ e, i }))
    .sort((a, b) => compare(a.e.date, b.e.date) || a.i - b.i)
    .map((x) => x.e);
}

export function latest(c, type) {
  const list = sortedEvents(c).filter((e) => e.type === type);
  return list.length ? list[list.length - 1] : null;
}

export function first(c, type) {
  return sortedEvents(c).find((e) => e.type === type) || null;
}

// Events of a type after a given date (inclusive).
export function since(c, type, date) {
  return sortedEvents(c).filter((e) => e.type === type && (!date || compare(e.date, date) >= 0));
}

// A reply that ends the dispute in the person's favour.
export function isResolved(c) {
  return sortedEvents(c).some((e) => e.type === "resolved" || (e.type === "reply" && e.outcome === "resolved"));
}

// Suggested day to act by: a week before a hard deadline, never before today.
export function aimBy(hardDate, today, buffer = 7) {
  const aim = addDays(hardDate, -buffer);
  return compare(aim, today) < 0 ? today : aim;
}

// Run a playbook and normalise its answer.
export function evaluateCase(playbook, c, today) {
  const r = playbook.evaluate(c, today);
  const deadlines = (r.deadlines || []).sort((a, b) => compare(a.date, b.date));
  const nextHard = deadlines.find((d) => d.kind === KIND.YOURS && d.status !== "missed") || null;
  return {
    rung: r.rung ?? 0,
    done: Boolean(r.done),
    headline: r.headline,
    explain: r.explain || "",
    action: r.action || null, // { label, by, letter, how }
    deadlines,
    nextHard,
    warnings: r.warnings || [],
  };
}

// The most pressing date on a case, for sorting the case list.
export function pressure(result) {
  if (result.done) return Infinity;
  const ds = result.deadlines.filter((d) => d.kind === KIND.YOURS && d.status !== "missed");
  if (ds.length) return ds[0].days;
  const opens = result.deadlines.filter((d) => d.status === "open");
  if (opens.length) return 0;
  return 9999;
}
