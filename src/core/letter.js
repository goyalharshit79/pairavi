// Small helpers for building plain-text letters people can paste into an
// email, a portal form, or print and sign.

import { formatDateLong } from "./dates.js";

export function rupees(n) {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return "";
  // Indian digit grouping: 12,34,567
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function senderBlock(me = {}) {
  return [me.name, me.address, me.phone && `Phone: ${me.phone}`, me.email && `Email: ${me.email}`]
    .filter(Boolean)
    .join("\n");
}

export function signature(me = {}) {
  return ["Yours faithfully,", "", "", me.name || "[Your name]"].join("\n");
}

// Join paragraphs, dropping empty ones, with blank lines between.
export function paras(...parts) {
  return parts
    .flat()
    .filter((p) => p !== null && p !== undefined && String(p).trim() !== "")
    .join("\n\n");
}

export function numbered(items) {
  return items.filter(Boolean).map((t, i) => `${i + 1}. ${t}`).join("\n");
}

export function dated(today) {
  return `Date: ${formatDateLong(today)}`;
}

// Placeholder for a fact the person has not filled in yet.
export function or(value, placeholder) {
  return value && String(value).trim() ? String(value).trim() : `[${placeholder}]`;
}
