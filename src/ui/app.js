import * as store from "../platform/store.js";
import { PLAYBOOKS, BY_ID, SOURCES, VERIFIED_ON, source } from "../playbooks/index.js";
import { evaluateCase, pressure, KIND } from "../core/engine.js";
import { todayLocal, formatDate, formatDateLong, relative, addDays, isISODate, weekday } from "../core/dates.js";
import { rupees } from "../core/letter.js";
import { getSample, tightenPrompt, sampleErrorText, saveFile, copyText } from "../platform/claude.js";

const root = document.getElementById("app");
const toastEl = document.getElementById("toast");
const today = () => todayLocal();

// Transient UI state (never stored).
const ui = { letter: null, adding: false, editing: false, confirm: null, tighten: null, sampleReady: false };

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 3200);
}

// ------------------------------------------------------------ routing
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith("case-")) return { view: "case", id: h.slice(5) };
  if (h.startsWith("new-")) return { view: "new", pb: h.slice(4) };
  if (h === "new") return { view: "new" };
  if (h === "me") return { view: "me" };
  if (h === "sources") return { view: "sources" };
  return { view: "home" };
}

function go(hash) {
  if (location.hash.slice(1) === hash) render();
  else location.hash = hash;
}

// ------------------------------------------------------------ seed
function seedExample() {
  const st = store.state();
  if (st.seeded || st.cases.length) return;
  const t = today();
  store.upsertCase({
    id: "example",
    example: true,
    playbook: "bank",
    created: t,
    title: "UPI payment failed, money not returned",
    party: "Example Bank",
    account: "XXXX 4821",
    incidentDate: addDays(t, -48),
    amount: 4500,
    summary: `On ${formatDateLong(addDays(t, -48))} I paid ₹4,500 by UPI to a shop (UTR 4123 5567 8890). The amount was debited from my account, but the shop never received it. The bank has not reversed the debit.`,
    relief: "Reverse the debit of ₹4,500 and pay any compensation due for the delay under RBI's rules on failed transactions.",
    events: [{ id: "e1", type: "complained", date: addDays(t, -45), ref: "CMP-2291" }],
  });
  store.markSeeded();
}

// ------------------------------------------------------------ helpers
const STATUS_TEXT = { met: "Done", missed: "Missed", overdue: "They're late", today: "Today", soon: "Soon", later: "", open: "Open now" };
const KIND_TEXT = { [KIND.THEIRS]: "Their deadline", [KIND.OPENS]: "You can act from", [KIND.YOURS]: "Your deadline" };

function evalCase(c) {
  const pb = BY_ID[c.playbook];
  return pb ? evaluateCase(pb, c, today()) : null;
}

function stamp(date, label) {
  if (!isISODate(date)) return "";
  const [y, m] = formatDate(date).split(" ").slice(1).reverse();
  const d = Number(date.slice(8));
  return `<div class="stamp" aria-label="${esc(label)} ${esc(formatDateLong(date))}">
    <span class="stamp-label">${esc(label)}</span>
    <span class="stamp-day">${d}</span>
    <span class="stamp-month">${esc(m)} ${esc(y)}</span>
    <span class="stamp-rel">${esc(weekday(date))} · ${esc(relative(date, today()))}</span>
  </div>`;
}

function sourceDetails(id, summary = "Why this date") {
  if (!id || !SOURCES[id]) return "";
  const s = source(id);
  return `<details class="why"><summary>${esc(summary)}</summary>
    <p class="why-clause">${esc(s.clause)} · ${esc(s.title)}</p>
    <blockquote>${esc(s.quote)}</blockquote>
    ${s.note ? `<p class="why-note">${esc(s.note)}</p>` : ""}
    <p class="why-link"><a href="${esc(s.doc || s.url)}" target="_blank" rel="noopener">Read the source</a>${s.confidence !== "high" ? ' · <span class="chip chip-warn">Confirm before relying on it</span>' : ""}</p>
  </details>`;
}

function fieldHTML(f, value, prefix = "f") {
  const id = `${prefix}-${f.key}`;
  const req = f.optional ? "" : " required";
  const opt = f.optional ? ' <span class="opt">optional</span>' : "";
  if (f.type === "checkbox") {
    return `<label class="check" for="${id}"><input type="checkbox" id="${id}" name="${f.key}"${value ? " checked" : ""}> <span>${esc(f.label)}</span></label>`;
  }
  let input;
  if (f.type === "textarea") input = `<textarea id="${id}" name="${f.key}" rows="4" placeholder="${esc(f.placeholder || "")}"${req}>${esc(value)}</textarea>`;
  else if (f.type === "select") input = `<select id="${id}" name="${f.key}"${req}>${f.options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  else if (f.type === "date") input = `<input type="date" id="${id}" name="${f.key}" value="${esc(value)}" max="${today()}"${req}>`;
  else if (f.type === "number") input = `<input type="number" inputmode="decimal" min="0" step="any" id="${id}" name="${f.key}" value="${esc(value)}" placeholder="${esc(f.placeholder || "")}"${req}>`;
  else input = `<input type="text" id="${id}" name="${f.key}" value="${esc(value)}" placeholder="${esc(f.placeholder || "")}"${req}>`;
  return `<div class="field"><label for="${id}">${esc(f.label)}${opt}</label>${input}</div>`;
}

function readForm(form, fields) {
  const fd = new FormData(form);
  const out = {};
  for (const f of fields) {
    if (f.type === "checkbox") out[f.key] = fd.get(f.key) === "on";
    else if (f.type === "number") out[f.key] = fd.get(f.key) === "" ? "" : Number(fd.get(f.key));
    else out[f.key] = String(fd.get(f.key) ?? "").trim();
  }
  return out;
}

const TITLE_FIELD = { key: "title", label: "Give it a short name", placeholder: "e.g. Health claim for knee surgery" };

// ------------------------------------------------------------ views
function viewHome() {
  const cases = store.state().cases.map((c) => ({ c, r: evalCase(c) })).filter((x) => x.r);
  cases.sort((a, b) => pressure(a.r) - pressure(b.r));
  const list = cases.length
    ? `<ul class="cases">${cases.map(({ c, r }) => caseCard(c, r)).join("")}</ul>`
    : `<div class="empty"><p>No cases yet. Start one, and Pairavi will tell you the next move and every date that matters.</p></div>`;
  return `
    <section class="hero">
      <h1>Your next move, the letter to send, and every deadline.</h1>
      <p>For a dispute with a bank, an insurer, a seller, or a government office in India. Pairavi follows the official complaint ladder and counts the days for you. Everything stays on this device.</p>
    </section>
    <div class="row-head"><h2>Your cases</h2><a class="btn btn-primary" href="#new">Start a case</a></div>
    ${list}`;
}

function caseCard(c, r) {
  const pb = BY_ID[c.playbook];
  const hard = r.action?.hard || r.nextHard?.date;
  const status = r.done ? "done" : r.nextHard?.status || (r.deadlines.some((d) => d.status === "open") ? "open" : "later");
  return `<li><a class="case-card" href="#case-${esc(c.id)}">
    <div class="case-meta"><span>${esc(pb.name)}</span>${c.example ? '<span class="chip">Example</span>' : ""}</div>
    <h3>${esc(c.title || "Untitled case")}</h3>
    <p class="case-party">${esc(c.party || pb.party)}${c.amount ? ` · ${esc(rupees(c.amount))}` : ""}</p>
    <div class="case-next">
      <span class="pill pill-${esc(status)}">${esc(r.headline)}</span>
      ${hard && !r.done ? `<span class="case-when">Last day ${esc(formatDate(hard))} · ${esc(relative(hard, today()))}</span>` : ""}
    </div>
  </a></li>`;
}

function viewNew(pbId) {
  const pb = pbId && BY_ID[pbId];
  if (!pb) {
    return `<a class="back" href="#">← All cases</a>
      <h1 class="page-title">What is the dispute about?</h1>
      <ul class="pick">${PLAYBOOKS.map((p) => `<li><a class="pick-card" href="#new-${p.id}">
        <span class="pick-name">${esc(p.name)}</span>
        <span class="pick-blurb">${esc(p.blurb)}</span>
        <span class="pick-forum">Goes to: ${esc(p.forum)}</span>
      </a></li>`).join("")}</ul>
      <p class="fine">Something else? Pairavi covers these four ladders today. Disputes with a builder, school, airline or any paid service fit under “Seller or service”.</p>`;
  }
  return `<a class="back" href="#new">← Choose another</a>
    <p class="eyebrow">${esc(pb.name)} → ${esc(pb.forum)}</p>
    <h1 class="page-title">Tell Pairavi what happened</h1>
    <form class="form" data-form="new" data-pb="${pb.id}">
      ${fieldHTML(TITLE_FIELD, "")}
      ${pb.intake.map((f) => fieldHTML(f, f.type === "select" ? f.options[0][0] : "")).join("")}
      <p class="fine">Stays on this device. Nothing is sent anywhere.</p>
      <div class="actions"><button class="btn btn-primary" type="submit">See my next move</button></div>
    </form>`;
}

function viewCase(c) {
  const pb = BY_ID[c.playbook];
  const r = evalCase(c);
  const t = today();
  const events = [...(c.events || [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const action = r.action
    ? `<div class="action">
        <div class="action-text">
          <p class="action-label">${esc(r.action.label)}</p>
          ${r.action.hard && r.action.by && r.action.by !== r.action.hard ? `<p class="action-aim">Aim for ${esc(formatDate(r.action.by))}, a few days before the last day.</p>` : ""}
          ${r.action.letter ? `<button class="btn btn-primary" data-act="letter" data-letter="${esc(r.action.letter)}">${r.action.prepare ? "Prepare the next letter" : "Open the letter"}</button>` : ""}
        </div>
        ${r.action.hard ? stamp(r.action.hard, "Last day") : r.action.by && r.action.by !== t ? stamp(r.action.by, "By") : ""}
      </div>`
    : "";

  const deadlines = r.deadlines.length
    ? `<ul class="dates">${r.deadlines.map((d) => `<li class="date date-${esc(d.status)} date-${esc(d.kind)}">
        <div class="date-when"><span class="date-day">${esc(formatDate(d.date))}</span><span class="date-rel">${esc(relative(d.date, t))}</span></div>
        <div class="date-body">
          <p class="date-label">${esc(d.label)}</p>
          <p class="date-meta"><span class="chip chip-${esc(d.kind)}">${esc(KIND_TEXT[d.kind])}</span>${STATUS_TEXT[d.status] ? `<span class="chip chip-s-${esc(d.status)}">${esc(STATUS_TEXT[d.status])}</span>` : ""}</p>
          ${d.detail ? `<p class="date-detail">${esc(d.detail)}</p>` : ""}
          ${sourceDetails(d.source)}
        </div></li>`).join("")}</ul>`
    : `<p class="muted">Dates appear here once you record what you've done.</p>`;

  const timeline = `<ol class="timeline">
      ${c.incidentDate ? `<li><span class="tl-date">${esc(formatDate(c.incidentDate))}</span><span class="tl-text">The problem started</span></li>` : ""}
      ${events.map((e) => {
        const u = pb.updates[e.type] || { label: e.type };
        const outcome = u.outcomes?.find(([v]) => v === e.outcome)?.[1];
        const confirming = ui.confirm === `ev-${e.id}`;
        return `<li><span class="tl-date">${esc(formatDate(e.date))}</span><span class="tl-text">${esc(u.label)}${outcome ? ` — ${esc(outcome)}` : ""}${e.ref ? ` <span class="ref">${esc(e.ref)}</span>` : ""}</span>
          <button class="link-btn${confirming ? " danger" : ""}" data-act="del-event" data-id="${esc(e.id)}">${confirming ? "Tap again to remove" : "Remove"}</button></li>`;
      }).join("")}
    </ol>
    ${ui.adding ? updateForm(pb) : `<button class="btn" data-act="add-update">Add an update</button>`}`;

  const ladder = `<ol class="ladder">${pb.ladder.map((s, i) => {
    let state = r.done || i + 1 < r.rung ? "past" : i + 1 === r.rung ? "now" : "next";
    if (state === "past" && s.optional && !(c.events || []).some((e) => e.type === s.optional)) state = "skip";
    return `<li class="rung rung-${state}">
      <p class="rung-title">${esc(s.title)}${state === "now" ? ' <span class="chip chip-now">You are here</span>' : ""}</p>
      <p class="rung-detail">${esc(s.detail)}</p>
      ${s.channels ? `<p class="rung-channels">${s.channels.map((ch) => ch.url ? `<a href="${esc(ch.url)}" target="_blank" rel="noopener">${esc(ch.label)}: ${esc(ch.value)}</a>` : `<span>${esc(ch.label)}: <span class="sel">${esc(ch.value)}</span></span>`).join("")}</p>` : ""}
      ${sourceDetails(s.source, "Where this comes from")}
    </li>`;
  }).join("")}</ol>`;

  const letters = `<ul class="letters">${Object.entries(pb.letters).map(([id, l]) => `<li><button class="letter-btn" data-act="letter" data-letter="${esc(id)}"><span>${esc(l.title)}</span><span class="letter-to">${esc(l.to)}</span>${c.drafts?.[id] ? '<span class="chip">Edited</span>' : ""}</button></li>`).join("")}</ul>`;

  const details = ui.editing
    ? `<form class="form" data-form="edit">
        ${fieldHTML(TITLE_FIELD, c.title, "e")}
        ${pb.intake.map((f) => fieldHTML(f, c[f.key], "e")).join("")}
        <div class="actions"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn" type="button" data-act="cancel-edit">Cancel</button></div>
      </form>`
    : `<dl class="facts">
        ${c.party ? `<dt>Against</dt><dd>${esc(c.party)}</dd>` : ""}
        ${c.amount ? `<dt>Amount</dt><dd>${esc(rupees(c.amount))}</dd>` : ""}
        ${c.summary ? `<dt>What happened</dt><dd class="pre">${esc(c.summary)}</dd>` : ""}
        ${c.relief ? `<dt>What you want</dt><dd class="pre">${esc(c.relief)}</dd>` : ""}
      </dl>
      <div class="actions"><button class="btn" data-act="edit">Edit details</button>
      <button class="btn ${ui.confirm === "case" ? "btn-danger" : ""}" data-act="del-case">${ui.confirm === "case" ? "Tap again to delete this case" : "Delete case"}</button></div>`;

  return `<a class="back" href="#">← All cases</a>
    <header class="case-head">
      <p class="eyebrow">${esc(pb.name)} → ${esc(pb.forum)}${c.example ? ' <span class="chip">Example</span>' : ""}</p>
      <h1 class="page-title">${esc(c.title || "Untitled case")}</h1>
      ${c.example ? `<p class="fine">This is a made-up example so you can see how Pairavi works. Delete it whenever you like.</p>` : ""}
    </header>
    <section class="next ${r.done ? "next-done" : ""}" aria-labelledby="next-h">
      <p class="eyebrow">Your next move</p>
      <h2 id="next-h">${esc(r.headline)}</h2>
      <p class="next-explain">${esc(r.explain)}</p>
      ${action}
    </section>
    ${r.warnings.map((w) => `<p class="warn" role="note">${esc(w)}</p>`).join("")}
    <section class="block"><h2 class="block-h">Dates</h2>${deadlines}</section>
    <section class="block"><h2 class="block-h">What's happened</h2>${timeline}</section>
    <section class="block"><h2 class="block-h">The ladder</h2>${ladder}</section>
    <section class="block"><h2 class="block-h">Letters</h2><p class="muted">Drafted from your details. Edit anything before you send.</p>${letters}</section>
    <section class="block"><h2 class="block-h">Case details</h2>${details}</section>`;
}

function updateForm(pb) {
  const types = Object.entries(pb.updates);
  const sel = ui.adding === true ? types[0][0] : ui.adding;
  const u = pb.updates[sel];
  return `<form class="form update" data-form="update">
    <div class="field"><label for="u-type">What happened?</label>
      <select id="u-type" name="type" data-act="update-type">${types.map(([k, v]) => `<option value="${esc(k)}"${k === sel ? " selected" : ""}>${esc(v.label)}</option>`).join("")}</select></div>
    ${u.help ? `<p class="fine">${esc(u.help)}</p>` : ""}
    <div class="field"><label for="u-date">${esc(u.dateLabel || "Date")}</label><input type="date" id="u-date" name="date" value="${today()}" max="${today()}" required></div>
    ${u.outcomes ? `<fieldset class="field"><legend>Outcome</legend>${u.outcomes.map(([v, l], i) => `<label class="radio" for="u-o-${esc(v)}"><input type="radio" id="u-o-${esc(v)}" name="outcome" value="${esc(v)}"${i === 0 ? " checked" : ""}> <span>${esc(l)}</span></label>`).join("")}</fieldset>` : ""}
    ${(u.fields || []).map((f) => fieldHTML(f, "", "u")).join("")}
    <div class="actions"><button class="btn btn-primary" type="submit">Add update</button><button class="btn" type="button" data-act="cancel-update">Cancel</button></div>
  </form>`;
}

function viewMe() {
  const me = store.state().me || {};
  const fields = [
    { key: "name", label: "Your full name" },
    { key: "address", label: "Postal address", type: "textarea", optional: true },
    { key: "phone", label: "Phone", optional: true },
    { key: "email", label: "Email", optional: true },
  ];
  return `<a class="back" href="#">← All cases</a>
    <h1 class="page-title">Your details</h1>
    <p class="muted">Used to fill in your letters. Kept on this device only.</p>
    <form class="form" data-form="me">${fields.map((f) => fieldHTML({ ...f, optional: true }, me[f.key], "m")).join("")}
      <div class="actions"><button class="btn btn-primary" type="submit">Save</button></div></form>
    <section class="block"><h2 class="block-h">Backup</h2>
      <p class="muted">Your cases live in this browser. ${store.isPersistent() ? "Save a backup file now and then, in case browser data is cleared." : "This browser isn't keeping data between visits (private mode or blocked storage). Save a backup before you close it."}</p>
      <div class="actions"><button class="btn" data-act="export">Save a backup file</button>
      <label class="btn" for="import-file">Restore from a backup</label><input type="file" id="import-file" accept="application/json,.json" class="visually-hidden"></div>
    </section>`;
}

function viewSources() {
  const groups = {};
  for (const [id, s] of Object.entries(SOURCES)) {
    const top = s.parent || id;
    (groups[top] ||= []).push(id);
  }
  return `<a class="back" href="#">← All cases</a>
    <h1 class="page-title">Where the rules come from</h1>
    <p class="muted">Every date Pairavi gives you comes from one of these documents. Each was read in the official text on ${esc(formatDateLong(VERIFIED_ON))}. Rules change: if a regulator issues something newer, the newer rule wins.</p>
    ${Object.entries(groups).map(([top, ids]) => {
      const t = source(top);
      return `<section class="block src"><h2 class="block-h">${esc(t.title)}</h2>
        <p><a href="${esc(t.doc || t.url)}" target="_blank" rel="noopener">${esc((t.doc || t.url).replace(/^https?:\/\//, ""))}</a>${t.confidence !== "high" ? ' <span class="chip chip-warn">Confirm before relying on it</span>' : ""}</p>
        ${t.note ? `<p class="fine">${esc(t.note)}</p>` : ""}
        ${ids.filter((i) => SOURCES[i].quote).map((i) => { const s = source(i); return `<div class="src-item"><p class="why-clause">${esc(s.clause)}</p><blockquote>${esc(s.quote)}</blockquote></div>`; }).join("")}
      </section>`;
    }).join("")}`;
}

// ------------------------------------------------------------ letter sheet
function letterFor(c, letterId) {
  const pb = BY_ID[c.playbook];
  const l = pb.letters[letterId];
  const fresh = l.build(c, store.state().me || {}, today());
  const draft = c.drafts?.[letterId];
  return { ...l, subject: fresh.subject, body: draft?.text ?? fresh.body, edited: Boolean(draft), fresh: fresh.body };
}

function viewLetter(c) {
  const L = letterFor(c, ui.letter);
  const me = store.state().me || {};
  const t = ui.tighten;
  return `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">
    <div class="sheet-inner">
      <div class="sheet-head"><div><p class="eyebrow">To: ${esc(L.to)}</p><h2 id="sheet-h">${esc(L.title)}</h2></div>
        <button class="btn" data-act="close-letter">Close</button></div>
      ${!me.name ? `<p class="warn">Add <a href="#me">your name and address</a> once and every letter fills them in.</p>` : ""}
      <div class="field"><label for="l-subject">Subject (for email)</label><input id="l-subject" type="text" readonly value="${esc(L.subject)}"></div>
      <div class="field"><label for="l-body">Letter. Fill in anything in [square brackets].</label>
        <textarea id="l-body" class="letter-body" rows="18" spellcheck="true">${esc(L.body)}</textarea></div>
      <div class="actions">
        <button class="btn btn-primary" data-act="copy-letter">Copy letter</button>
        <button class="btn" data-act="copy-subject">Copy subject</button>
        <button class="btn" data-act="save-letter">Save as text file</button>
        ${ui.sampleReady ? (t?.busy ? `<button class="btn" data-act="stop-tighten">Stop</button><span class="muted" role="status">Thinking…</span>` : `<button class="btn" data-act="tighten">Tighten wording with Claude</button>`) : ""}
        ${t?.undo ? `<button class="btn" data-act="undo-tighten">Undo</button>` : ""}
        ${L.edited ? `<button class="btn" data-act="reset-letter">Start from a fresh draft</button>` : ""}
      </div>
      ${t?.error ? `<p class="warn" role="status">${esc(t.error)}</p>` : ""}
      <p class="fine">Pairavi is a guide, not a lawyer. Check the facts in your letter before you send it. Once it's sent, add it under “What's happened” so the dates update.</p>
    </div></div>`;
}

// ------------------------------------------------------------ render
function render() {
  const r = route();
  let html;
  let title = "Pairavi";
  if (r.view === "case") {
    const c = store.getCase(r.id);
    if (!c || !BY_ID[c.playbook]) html = `<a class="back" href="#">← All cases</a><p class="muted">That case isn't on this device.</p>`;
    else {
      html = viewCase(c);
      title = `${c.title || "Case"} · Pairavi`;
      if (ui.letter && BY_ID[c.playbook].letters[ui.letter]) html += viewLetter(c);
    }
  } else if (r.view === "new") html = viewNew(r.pb);
  else if (r.view === "me") html = viewMe();
  else if (r.view === "sources") html = viewSources();
  else html = viewHome();
  root.innerHTML = html;
  document.title = title;
  document.body.classList.toggle("sheet-open", Boolean(ui.letter && r.view === "case"));
}

function currentCase() {
  const r = route();
  return r.view === "case" ? store.getCase(r.id) : null;
}

function resetTransient() {
  ui.letter = null;
  ui.adding = false;
  ui.editing = false;
  ui.confirm = null;
  ui.tighten = null;
}

// ------------------------------------------------------------ events
root.addEventListener("submit", (ev) => {
  const form = ev.target.closest("form[data-form]");
  if (!form) return;
  ev.preventDefault();
  const kind = form.dataset.form;

  if (kind === "new") {
    const pb = BY_ID[form.dataset.pb];
    const data = readForm(form, [TITLE_FIELD, ...pb.intake]);
    const c = { id: store.uid(), playbook: pb.id, created: today(), events: [], ...data };
    if (!c.title) c.title = `${pb.name}: ${c.party || "dispute"}`;
    store.upsertCase(c);
    resetTransient();
    go(`case-${c.id}`);
    return;
  }

  const c = currentCase();
  if (kind === "edit" && c) {
    const pb = BY_ID[c.playbook];
    Object.assign(c, readForm(form, [TITLE_FIELD, ...pb.intake]));
    store.upsertCase(c);
    ui.editing = false;
    toast("Saved");
    render();
  } else if (kind === "update" && c) {
    const pb = BY_ID[c.playbook];
    const fd = new FormData(form);
    const type = String(fd.get("type"));
    const u = pb.updates[type];
    const date = String(fd.get("date"));
    if (!isISODate(date)) return toast("Pick a date.");
    const e = { id: store.uid(), type, date, ...(u.outcomes ? { outcome: String(fd.get("outcome")) } : {}), ...readForm(form, u.fields || []) };
    c.events = [...(c.events || []), e];
    store.upsertCase(c);
    ui.adding = false;
    toast("Update added. Dates recalculated.");
    render();
    document.getElementById("next-h")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (kind === "me") {
    store.setMe(readForm(form, [{ key: "name" }, { key: "address" }, { key: "phone" }, { key: "email" }]));
    toast("Saved. Your letters will use these details.");
  }
});

root.addEventListener("change", async (ev) => {
  if (ev.target.matches("[data-act=update-type]")) {
    ui.adding = ev.target.value;
    render();
    document.getElementById("u-type")?.focus();
  } else if (ev.target.id === "import-file") {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const n = store.importJSON(await file.text());
      toast(n ? `Restored ${n} case${n === 1 ? "" : "s"}.` : "No new cases in that file.");
    } catch (e) {
      toast(e.message || "Couldn't read that file.");
    }
    ev.target.value = "";
  }
});

let saveDraftTimer;
root.addEventListener("input", (ev) => {
  if (ev.target.id !== "l-body") return;
  clearTimeout(saveDraftTimer);
  const text = ev.target.value;
  saveDraftTimer = setTimeout(() => {
    const c = currentCase();
    if (!c || !ui.letter) return;
    c.drafts = { ...(c.drafts || {}), [ui.letter]: { text, at: today() } };
    store.upsertCase(c);
  }, 600);
});

root.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el || el.tagName === "SELECT") return;
  const act = el.dataset.act;
  const c = currentCase();

  switch (act) {
    case "add-update":
      ui.adding = true;
      render();
      document.getElementById("u-type")?.focus();
      break;
    case "cancel-update":
      ui.adding = false;
      render();
      break;
    case "edit":
      ui.editing = true;
      render();
      break;
    case "cancel-edit":
      ui.editing = false;
      render();
      break;
    case "del-event": {
      const key = `ev-${el.dataset.id}`;
      if (ui.confirm !== key) {
        ui.confirm = key;
        render();
        break;
      }
      c.events = c.events.filter((e) => e.id !== el.dataset.id);
      store.upsertCase(c);
      ui.confirm = null;
      toast("Removed. Dates recalculated.");
      render();
      break;
    }
    case "del-case":
      if (ui.confirm !== "case") {
        ui.confirm = "case";
        render();
        break;
      }
      store.deleteCase(c.id);
      resetTransient();
      toast("Case deleted.");
      go("");
      break;
    case "letter":
      ui.letter = el.dataset.letter;
      ui.tighten = null;
      render();
      document.getElementById("l-body")?.focus({ preventScroll: true });
      break;
    case "close-letter":
      ui.tighten?.ctl?.abort();
      ui.letter = null;
      ui.tighten = null;
      render();
      break;
    case "copy-letter":
    case "copy-subject": {
      const target = document.getElementById(act === "copy-letter" ? "l-body" : "l-subject");
      if (await copyText(target.value)) toast(act === "copy-letter" ? "Letter copied. Paste it into your email or the portal." : "Subject copied.");
      else {
        target.focus();
        target.select();
        toast("Selected. Use your phone's Copy.");
      }
      break;
    }
    case "save-letter": {
      const L = letterFor(c, ui.letter);
      const body = document.getElementById("l-body").value;
      const name = `${(c.title || "letter").replace(/[^\w\- ]+/g, "").trim().slice(0, 40) || "letter"} - ${L.title.replace(/[^\w\- ]+/g, "").trim()}.txt`;
      const res = await saveFile(name, `Subject: ${L.subject}\n\n${body}\n`);
      toast(res === "saved" ? "Saved." : res === "declined" ? "Not saved." : "Couldn't save here. Use Copy letter instead.");
      break;
    }
    case "reset-letter":
      if (c.drafts) delete c.drafts[ui.letter];
      store.upsertCase(c);
      ui.tighten = null;
      render();
      toast("Fresh draft from your current details.");
      break;
    case "tighten":
      tighten(c);
      break;
    case "stop-tighten":
      ui.tighten?.ctl?.abort();
      break;
    case "undo-tighten": {
      const prev = ui.tighten?.undo;
      if (prev == null) break;
      c.drafts = { ...(c.drafts || {}), [ui.letter]: { text: prev, at: today() } };
      store.upsertCase(c);
      ui.tighten = null;
      render();
      break;
    }
    case "export": {
      const res = await saveFile(`pairavi-backup-${today()}.json`, store.exportJSON());
      toast(res === "saved" ? "Backup saved." : res === "declined" ? "Not saved." : "Couldn't save a file here.");
      break;
    }
  }
});

async function tighten(c) {
  const sample = await getSample();
  if (!sample) return;
  const body = document.getElementById("l-body").value;
  const pb = BY_ID[c.playbook];
  const L = pb.letters[ui.letter];
  const ctl = new AbortController();
  ui.tighten = { busy: true, ctl, undo: null, error: "" };
  render();
  try {
    const { text } = await sample(tightenPrompt(body, `${L.title}, ${pb.name} dispute, to ${L.to}.`), { signal: ctl.signal, cache: false });
    const cleaned = text.trim().replace(/^```[a-z]*\n?|```$/g, "").trim();
    c.drafts = { ...(c.drafts || {}), [ui.letter]: { text: cleaned, at: today() } };
    store.upsertCase(c);
    ui.tighten = { busy: false, undo: body };
    toast("Wording tightened. Check it, then copy.");
  } catch (e) {
    ui.tighten = { busy: false, error: e?.code === "cancelled" ? "" : sampleErrorText(e) };
    if (e?.code === "not_granted" || e?.code === "sampling_disabled") ui.sampleReady = false;
  }
  if (ui.letter) render();
}

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && ui.letter) {
    ui.tighten?.ctl?.abort();
    ui.letter = null;
    ui.tighten = null;
    render();
  }
});

window.addEventListener("hashchange", () => {
  resetTransient();
  render();
  window.scrollTo(0, 0);
});

// ------------------------------------------------------------ boot
store.load();
seedExample();
render();
getSample().then((s) => {
  ui.sampleReady = Boolean(s);
  if (s && ui.letter) render();
});
