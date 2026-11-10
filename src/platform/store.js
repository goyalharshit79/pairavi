// Cases live only on this device, in the browser's storage.
// Every read and write is guarded: private windows and blocked storage
// must still give a working (if forgetful) app.

const KEY = "pairavi.v1";

const empty = () => ({ me: {}, cases: [], seeded: false });

let memory = empty();
let persistent = true;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      memory = { ...empty(), ...data, cases: Array.isArray(data.cases) ? data.cases : [] };
    }
  } catch {
    persistent = false;
  }
  return memory;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
    persistent = true;
  } catch {
    persistent = false;
  }
}

export const state = () => memory;
export const isPersistent = () => persistent;

export function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function getCase(id) {
  return memory.cases.find((c) => c.id === id) || null;
}

export function upsertCase(c) {
  const i = memory.cases.findIndex((x) => x.id === c.id);
  if (i >= 0) memory.cases[i] = c;
  else memory.cases.unshift(c);
  save();
}

export function deleteCase(id) {
  memory.cases = memory.cases.filter((c) => c.id !== id);
  save();
}

export function setMe(me) {
  memory.me = { ...me };
  save();
}

export function markSeeded() {
  memory.seeded = true;
  save();
}

// Backup: a plain JSON file the person keeps.
export function exportJSON() {
  return JSON.stringify({ app: "pairavi", version: 1, exported: new Date().toISOString(), me: memory.me, cases: memory.cases }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== "pairavi" || !Array.isArray(data.cases)) throw new Error("This file isn't a Pairavi backup.");
  const known = new Set(memory.cases.map((c) => c.id));
  let added = 0;
  for (const c of data.cases) {
    if (c && c.id && c.playbook && !known.has(c.id)) {
      memory.cases.push(c);
      added++;
    }
  }
  if (data.me && !memory.me?.name) memory.me = data.me;
  save();
  return added;
}
