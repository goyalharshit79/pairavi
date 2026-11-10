// Each test pins one rule to the clause that sets it. If a test here fails
// after editing a playbook, check the clause in src/playbooks/sources.js.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BY_ID, PLAYBOOKS, SOURCES } from "../src/playbooks/index.js";
import { evaluateCase, KIND } from "../src/core/engine.js";

const run = (id, c, today) => evaluateCase(BY_ID[id], { events: [], ...c }, today);
const find = (r, id) => r.deadlines.find((d) => d.id === id);

// ------------------------------------------------------------ RBI
test("RBI: must complain to the bank first (clause 10(1)(e))", () => {
  const r = run("bank", { party: "X Bank", incidentDate: "2026-10-01" }, "2026-10-05");
  assert.equal(r.action.letter, "complaint");
  assert.equal(r.rung, 1);
});

test("RBI: no reply → opens on day 31, closes 90 days after day 30 (clause 10(1)(f),(g))", () => {
  const c = { events: [{ type: "complained", date: "2026-08-01" }] };
  const r = run("bank", c, "2026-08-15");
  assert.equal(find(r, "reply").date, "2026-08-31");
  assert.equal(find(r, "opens").date, "2026-09-01");
  assert.equal(find(r, "file").date, "2026-11-29");
  assert.match(r.headline, /reply by/);
  const later = run("bank", c, "2026-09-10");
  assert.equal(later.action.letter, "ombudsman");
});

test("RBI: a later reply restarts the 90 days from the bank's last communication", () => {
  const c = { events: [
    { type: "complained", date: "2026-08-01" },
    { type: "reply", date: "2026-09-20", outcome: "rejected" },
  ] };
  const r = run("bank", c, "2026-09-21");
  assert.equal(find(r, "file").date, "2026-12-19");
  assert.ok(r.warnings.some((w) => /Internal Ombudsman/.test(w)));
});

test("RBI: an early reply does not shorten the window below day 30 + 90", () => {
  const c = { events: [
    { type: "complained", date: "2026-08-01" },
    { type: "reply", date: "2026-08-05", outcome: "unsatisfied" },
  ] };
  assert.equal(find(run("bank", c, "2026-08-06"), "file").date, "2026-11-29");
});

test("RBI: window closed is reported, not hidden", () => {
  const c = { events: [{ type: "complained", date: "2026-01-01" }] };
  const r = run("bank", c, "2026-11-10");
  assert.match(r.headline, /closed/);
});

test("RBI: favourable award must be accepted within 30 days (clause 15(4))", () => {
  const c = { events: [
    { type: "complained", date: "2026-08-01" },
    { type: "ombudsman", date: "2026-09-05" },
    { type: "award", date: "2026-11-01", outcome: "favourable" },
  ] };
  const r = run("bank", c, "2026-11-10");
  assert.equal(find(r, "accept").date, "2026-12-01");
  assert.equal(r.action.letter, "accept");
});

// ------------------------------------------------------ Insurance
test("Insurance: insurer has 14 days; Ombudsman opens a month after receipt (Rule 14(3)(a))", () => {
  const c = { events: [{ type: "complained", date: "2026-10-01" }] };
  const r = run("insurance", c, "2026-10-05");
  assert.equal(find(r, "insurer").date, "2026-10-15");
  assert.equal(find(r, "opens").date, "2026-11-02");
  assert.equal(find(r, "file").date, "2027-11-01");
});

test("Insurance: one year from the rejection (Rule 14(3)(b)(i))", () => {
  const c = { events: [
    { type: "complained", date: "2026-10-01" },
    { type: "reply", date: "2026-10-10", outcome: "rejected" },
  ] };
  const r = run("insurance", c, "2026-10-11");
  assert.equal(find(r, "file").date, "2027-10-10");
  assert.equal(r.action.letter, "ombudsman");
});

test("Insurance: late filing points to condonation, not a dead end (Rule 14(4))", () => {
  const c = { events: [
    { type: "complained", date: "2025-01-01" },
    { type: "reply", date: "2025-01-10", outcome: "rejected" },
  ] };
  const r = run("insurance", c, "2026-11-10");
  assert.match(r.explain, /condone/);
});

test("Insurance: grievance letter cites the moratorium only after 5 years of cover", () => {
  const letter = BY_ID.insurance.letters.grievance;
  const five = letter.build({ kind: "health", coverYears: 6, events: [] }, {}, "2026-11-10").body;
  const two = letter.build({ kind: "health", coverYears: 2, events: [] }, {}, "2026-11-10").body;
  assert.match(five, /60-month moratorium/);
  assert.doesNotMatch(two, /moratorium/);
});

// ------------------------------------------------------- Consumer
test("Consumer: two years from the cause of action (s.69) and forum by amount", () => {
  const r = run("consumer", { incidentDate: "2026-03-15", amount: 7500000 }, "2026-11-10");
  assert.equal(find(r, "limit").date, "2028-03-15");
  assert.match(find(r, "limit").label, /State Commission/);
});

test("Consumer: e-commerce must acknowledge in 48h and resolve in a month (Rule 4(5))", () => {
  const c = { online: true, incidentDate: "2026-10-01", amount: 5000, events: [{ type: "complained", date: "2026-10-03" }] };
  const r = run("consumer", c, "2026-10-04");
  assert.equal(find(r, "ack").date, "2026-10-05");
  assert.equal(find(r, "redress").date, "2026-11-03");
});

// ------------------------------------------------------------ RTI
test("RTI: 30 days, then 30 days for first appeal (s.7(1), s.19(1))", () => {
  const c = { central: true, events: [{ type: "filed", date: "2026-09-01" }] };
  const r = run("rti", c, "2026-09-10");
  assert.equal(find(r, "reply").date, "2026-10-01");
  assert.equal(find(r, "fa").date, "2026-10-31");
});

test("RTI: APIO adds 5 days, third party makes it 40, life or liberty 48 hours", () => {
  const apio = run("rti", { events: [{ type: "filed", date: "2026-09-01", viaApio: true }] }, "2026-09-02");
  assert.equal(find(apio, "reply").date, "2026-10-06");
  const tp = run("rti", { events: [{ type: "filed", date: "2026-09-01" }, { type: "thirdparty", date: "2026-09-05" }] }, "2026-09-06");
  assert.equal(find(tp, "reply").date, "2026-10-11");
  const life = run("rti", { lifeLiberty: true, events: [{ type: "filed", date: "2026-09-01" }] }, "2026-09-01");
  assert.equal(find(life, "reply").date, "2026-09-03");
});

test("RTI: transfer restarts the clock from the new office's receipt", () => {
  const c = { events: [{ type: "filed", date: "2026-09-01" }, { type: "transferred", date: "2026-09-06" }] };
  assert.equal(find(run("rti", c, "2026-09-07"), "reply").date, "2026-10-06");
});

test("RTI: second appeal 90 days from when the FAA should have decided (s.19(3))", () => {
  const c = { events: [
    { type: "filed", date: "2026-06-01" },
    { type: "reply", date: "2026-06-20", outcome: "partial" },
    { type: "firstappeal", date: "2026-07-01" },
  ] };
  const r = run("rti", c, "2026-08-15");
  assert.equal(find(r, "sa").date, "2026-10-29");
  assert.equal(r.action.letter, "second");
});

// ---------------------------------------------------- Integrity
test("every deadline and ladder rung cites a source that exists", () => {
  const todays = ["2026-01-01", "2026-11-10", "2028-01-01"];
  for (const p of PLAYBOOKS) {
    for (const rung of p.ladder) if (rung.source) assert.ok(SOURCES[rung.source], `${p.id} ladder: ${rung.source}`);
    for (const t of todays) {
      for (const evs of [[], [{ type: "complained", date: "2026-01-01" }, { type: "filed", date: "2026-01-01" }]]) {
        const r = evaluateCase(p, { incidentDate: "2025-12-01", amount: 1000, events: evs }, t);
        for (const d of r.deadlines) if (d.source) assert.ok(SOURCES[d.source], `${p.id}: ${d.source}`);
      }
    }
  }
});

test("every letter builds without throwing on an empty case", () => {
  for (const p of PLAYBOOKS) {
    for (const [id, l] of Object.entries(p.letters)) {
      const out = l.build({ events: [] }, {}, "2026-11-10");
      assert.ok(out.body.length > 60, `${p.id}.${id}`);
      assert.doesNotMatch(out.body, /undefined|NaN|\[object/, `${p.id}.${id}`);
    }
  }
});

test("action letters exist in their playbook", () => {
  for (const p of PLAYBOOKS) {
    const r = evaluateCase(p, { events: [] }, "2026-11-10");
    if (r.action?.letter) assert.ok(p.letters[r.action.letter], `${p.id}: ${r.action.letter}`);
  }
  assert.equal(KIND.YOURS, "yours");
});
