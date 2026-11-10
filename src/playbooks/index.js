import bank from "./bank.js";
import insurance from "./insurance.js";
import consumer from "./consumer.js";
import rti from "./rti.js";

export const PLAYBOOKS = [bank, insurance, consumer, rti];
export const BY_ID = Object.fromEntries(PLAYBOOKS.map((p) => [p.id, p]));
export { SOURCES, VERIFIED_ON, source } from "./sources.js";
