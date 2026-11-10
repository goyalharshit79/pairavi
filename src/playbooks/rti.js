// Right to Information: application → first appeal → Information Commission.
// Periods are from the RTI Act, 2005; fees from the Central RTI Rules, 2012.

import { addDays, formatDate, formatDateLong, compare } from "../core/dates.js";
import { KIND, deadline, latest, first, isResolved, aimBy } from "../core/engine.js";
import { paras, senderBlock, signature, dated, or, numbered } from "../core/letter.js";

const REPLY_DAYS = 30; // s.7(1)
const THIRD_PARTY_DAYS = 40; // s.11(3)
const APIO_EXTRA = 5; // s.5(2)
const FIRST_APPEAL_DAYS = 30; // s.19(1)
const FAA_DAYS = 30; // s.19(6)
const FAA_MAX_DAYS = 45; // s.19(6)
const SECOND_APPEAL_DAYS = 90; // s.19(3)

export function replyDueDate(c, filed, transfer) {
  const base = transfer ? transfer.date : filed.date;
  let days = c.thirdParty ? THIRD_PARTY_DAYS : REPLY_DAYS;
  if (c.lifeLiberty) days = 2; // 48 hours
  if (c.viaApio && !transfer) days += APIO_EXTRA;
  return addDays(base, days);
}

function questions(c) {
  return String(c.questions || "")
    .split(/\n+/)
    .map((q) => q.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
}

export default {
  id: "rti",
  name: "Information from a government office",
  blurb: "Use the Right to Information Act to get records: the status of your file, why it's stuck, who decided, copies of notings.",
  party: "Public authority",
  forum: "Information Commission",

  intake: [
    { key: "party", label: "Which government office or public authority?", placeholder: "e.g. Regional Passport Office, Delhi" },
    { key: "central", label: "It's a central government office (ministry, PSU, central department)", type: "checkbox", optional: true },
    { key: "incidentDate", label: "When did you send the application? (leave empty if not yet)", type: "date", optional: true },
    { key: "summary", label: "Why you need the information (for your own notes; not sent)", type: "textarea", optional: true, placeholder: "My passport application has been pending since …" },
    { key: "questions", label: "What records do you want? One per line", type: "textarea", placeholder: "Copy of the file notings on my application no. …\nNames and designations of officers who handled it\nDaily progress report since …" },
    { key: "lifeLiberty", label: "It concerns someone's life or liberty (48-hour reply)", type: "checkbox", optional: true },
  ],

  updates: {
    filed: {
      label: "I filed the RTI application",
      dateLabel: "Date the office received it",
      fields: [
        { key: "ref", label: "Registration number", optional: true },
        { key: "viaApio", label: "Given to an Assistant PIO (adds 5 days)", type: "checkbox", optional: true },
      ],
      help: "For RTI Online, use the submission date. By post, the delivery date on the tracking.",
    },
    transferred: {
      label: "It was transferred to another office",
      dateLabel: "Date the new office received it",
      help: "The office that received it must transfer within 5 days. The 30 days restart from when the new office gets it.",
    },
    thirdparty: { label: "PIO says a third party is being consulted", dateLabel: "Date I was told" },
    reply: {
      label: "The PIO replied",
      dateLabel: "Date I received the reply",
      outcomes: [
        ["full", "Gave everything I asked for"],
        ["partial", "Gave some, refused or skipped the rest"],
        ["refused", "Refused"],
        ["fee", "Asked for more fees"],
      ],
    },
    firstappeal: {
      label: "I filed the first appeal",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "Appeal number", optional: true }],
    },
    faadecision: {
      label: "The First Appellate Authority decided",
      dateLabel: "Date I received the decision",
      outcomes: [
        ["full", "Ordered everything"],
        ["partial", "Ordered some of it"],
        ["refused", "Dismissed my appeal"],
      ],
    },
    secondappeal: {
      label: "I filed a second appeal",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "Diary number", optional: true }],
    },
    resolved: { label: "I got what I needed", dateLabel: "Date" },
  },

  ladder: [
    {
      title: "File the RTI application",
      detail: "₹10 fee for central offices (state fees vary). No reasons needed. Ask for specific records, not explanations.",
      source: "rti-rules-2012",
      channels: [{ label: "Central offices", value: "rtionline.gov.in", url: "https://rtionline.gov.in" }],
    },
    {
      title: "Reply within 30 days",
      detail: "48 hours if life or liberty is involved; 40 days with a third party; +5 days via an Assistant PIO. No reply means refusal, and if they miss the deadline the information must be free.",
      source: "rti-7-1",
    },
    {
      title: "First appeal within 30 days",
      detail: "To the officer senior to the PIO in the same office. Decided within 30 days (at most 45).",
      source: "rti-19-1",
    },
    {
      title: "Second appeal within 90 days",
      detail: "To the Central or State Information Commission. Free. It can order disclosure, compensation and a penalty on the PIO.",
      source: "rti-19-3",
      channels: [{ label: "Central Information Commission", value: "dsscic.nic.in", url: "https://dsscic.nic.in" }],
    },
  ],

  evaluate(c, today) {
    const d = [];
    const warnings = [];
    const filed = first(c, "filed") || (c.incidentDate ? { type: "filed", date: c.incidentDate } : null);
    const transfer = latest(c, "transferred");
    const reply = latest(c, "reply");
    const fa = latest(c, "firstappeal");
    const faa = latest(c, "faadecision");
    const sa = latest(c, "secondappeal");
    const cc = { ...c, viaApio: c.viaApio || filed?.viaApio, thirdParty: c.thirdParty || Boolean(latest(c, "thirdparty")) };

    if (isResolved(c) || (reply && reply.outcome === "full" && !fa)) {
      return { done: true, rung: 4, headline: "Information received", explain: "Check it against each question. If anything is missing or wrong, you can still appeal within 30 days of the reply." };
    }

    if (sa) {
      return {
        rung: 4,
        headline: "With the Information Commission",
        explain: "There's no fixed time limit for the Commission. Hearings are often by video; attend and bring copies of your application, the reply, and your first appeal.",
        action: { label: "Track it on the Commission's website" },
        deadlines: d,
        warnings,
      };
    }

    if (fa) {
      const faaDue = addDays(fa.date, FAA_DAYS);
      const faaMax = addDays(fa.date, FAA_MAX_DAYS);
      d.push(deadline({ id: "faa", label: "First Appellate Authority must decide", date: faaDue, kind: KIND.THEIRS, source: "rti-19-6", detail: "Can extend to 45 days with written reasons." }, today));
      if (faa && faa.outcome === "full") {
        return { done: true, rung: 4, headline: "Appeal allowed", explain: "Follow up if the information doesn't arrive within the time the order sets. If it doesn't, you can still go to the Commission." };
      }
      const saFrom = faa ? faa.date : faaDue;
      const saBy = addDays(saFrom, SECOND_APPEAL_DAYS);
      if (!faa) d.push(deadline({ id: "faamax", label: "Outer limit for the first-appeal decision", date: faaMax, kind: KIND.THEIRS, source: "rti-19-6" }, today));
      d.push(deadline({ id: "sa", label: "Last day for second appeal", date: saBy, kind: KIND.YOURS, source: "rti-19-3", detail: faa ? "90 days from receiving the decision." : "90 days from when the decision should have been made." }, today));
      if (!faa && compare(today, faaDue) <= 0) {
        return {
          rung: 3,
          headline: `Appeal decision due by ${formatDate(faaDue)}`,
          explain: "If no decision comes, or you're unhappy with it, file a second appeal with the Information Commission.",
          action: { label: "Wait for the appellate decision", by: faaDue, letter: "second", prepare: true },
          deadlines: d,
          warnings,
        };
      }
      return {
        rung: 4,
        headline: "File a second appeal",
        explain: faa ? "The first appeal didn't get you everything. Take it to the Information Commission." : "The first appeal wasn't decided in time. Take it to the Information Commission.",
        action: { label: c.central ? "File at dsscic.nic.in" : "File with your State Information Commission", by: aimBy(saBy, today, 10), hard: saBy, letter: "second" },
        deadlines: d,
        warnings: warnings.concat(c.central ? [] : ["State Information Commissions have their own portals and forms. Search for your state's commission website."]),
      };
    }

    if (!filed) {
      return {
        rung: 1,
        headline: "File your RTI application",
        explain: c.central
          ? "File on rtionline.gov.in and pay ₹10 online. Ask for specific documents (copies, notings, dates, names) rather than asking why."
          : "Send it to the office's Public Information Officer with the fee your state prescribes (often ₹10). Many states have their own RTI portal. Ask for specific documents rather than asking why.",
        action: { label: "File the application", by: today, letter: "application" },
        deadlines: d,
        warnings: questions(c).some((q) => /^why\b/i.test(q)) ? ["Questions starting with 'why' are often refused as not 'information'. Ask for the file notings or the document that records the reason instead."] : [],
      };
    }

    const due = replyDueDate(cc, filed, transfer);
    d.push(deadline({ id: "reply", label: cc.lifeLiberty ? "PIO must reply (48 hours)" : "PIO must reply", date: due, kind: KIND.THEIRS, source: cc.thirdParty ? "rti-11" : cc.viaApio ? "rti-5-2" : "rti-7-1" }, today));

    const faFrom = reply ? reply.date : due;
    const faBy = addDays(faFrom, FIRST_APPEAL_DAYS);
    d.push(deadline({ id: "fa", label: "Last day for first appeal", date: faBy, kind: KIND.YOURS, source: "rti-19-1", detail: reply ? "30 days from receiving the reply." : "30 days from when the reply was due." }, today));

    if (!reply && compare(today, due) <= 0) {
      return {
        rung: 2,
        headline: `Reply due by ${formatDate(due)}`,
        explain: "If nothing arrives by then, it counts as a refusal and you can file a first appeal. Information supplied late must be given free.",
        action: { label: "Wait for the reply", by: due, letter: "first", prepare: true },
        deadlines: d,
        warnings,
      };
    }

    if (compare(today, faBy) > 0) {
      warnings.push(`The 30-day period ended on ${formatDate(faBy)}. The appellate authority may still admit a late appeal if you explain the delay.`);
    }
    const why = reply
      ? { partial: "The reply left things out.", refused: "Your request was refused.", fee: "They asked for more fees." }[reply.outcome] || "The reply wasn't enough."
      : "No reply came in time, which counts as a refusal.";
    return {
      rung: 3,
      headline: "File a first appeal",
      explain: `${why} Appeal to the First Appellate Authority in the same office, the officer senior to the PIO. ${c.central ? "No fee for central offices." : "Some states charge a small fee."}${!reply ? " When the information comes, it must be free of charge because the deadline was missed." : ""}`,
      action: { label: c.central ? "File the first appeal on rtionline.gov.in" : "Send the first appeal", by: aimBy(faBy, today, 5), hard: faBy, letter: "first" },
      deadlines: d,
      warnings,
    };
  },

  letters: {
    application: {
      title: "RTI application",
      to: "Public Information Officer",
      build(c, me, today) {
        const qs = questions(c);
        return {
          subject: `Application under Section 6(1) of the RTI Act, 2005`,
          body: paras(
            `To\nThe Public Information Officer\n${or(c.party, "Office name and address")}`,
            "Subject: Request for information under Section 6(1) of the Right to Information Act, 2005",
            "Sir/Madam,",
            "Please provide the following information:",
            qs.length ? numbered(qs) : "1. [Copy of … ]\n2. [Names and designations of …]\n3. [Dates on which …]",
            c.central ? "I have paid the application fee of ₹10." : "I enclose the application fee as prescribed: [₹10 by IPO / DD / court-fee stamp].",
            "If any of this information is held by another public authority, please transfer that part under Section 6(3) and inform me.",
            c.lifeLiberty ? "This information concerns the life or liberty of a person. Please provide it within 48 hours under the proviso to Section 7(1)." : "",
            "I am a citizen of India.",
            senderBlock(me),
            dated(today),
            me.name || "[Your name and signature]",
          ),
        };
      },
    },
    first: {
      title: "First appeal",
      to: "First Appellate Authority (same office)",
      build(c, me, today) {
        const filed = first(c, "filed") || (c.incidentDate ? { date: c.incidentDate } : null);
        const reply = latest(c, "reply");
        return {
          subject: "First appeal under Section 19(1) of the RTI Act, 2005",
          body: paras(
            `To\nThe First Appellate Authority\n${or(c.party, "Office name and address")}`,
            "Subject: First appeal under Section 19(1) of the Right to Information Act, 2005",
            numbered([
              `Appellant: ${or(me.name, "your name")}, ${or(me.address, "address")}`,
              `RTI application dated ${filed ? formatDateLong(filed.date) : "[date]"}${filed?.ref ? `, registration no. ${filed.ref}` : ""}, to the PIO, ${or(c.party, "office")}.`,
              reply
                ? `The PIO replied on ${formatDateLong(reply.date)}. ${{ partial: "The reply did not give all the information requested.", refused: "The PIO refused the information.", fee: "The PIO demanded additional fees." }[reply.outcome] || "The reply was unsatisfactory."}`
                : "The PIO did not reply within the time allowed, which is a deemed refusal under Section 7(2).",
            ]),
            "Grounds of appeal:",
            "[For each question the reply didn't answer properly: the question, what was given, and why it's wrong. If an exemption under Section 8 was cited, say why it doesn't apply or why the rest can be given after removing exempt parts (Section 10).]",
            !reply ? "As the time limit was missed, the information must be supplied free of charge under Section 7(6)." : "",
            "Relief sought: Direct the PIO to provide the complete information requested, free of charge where the time limit was not met.",
            "Enclosures: copy of the RTI application, fee proof, and the PIO's reply (if any).",
            dated(today),
            me.name || "[Your name and signature]",
          ),
        };
      },
    },
    second: {
      title: "Second appeal",
      to: "Information Commission",
      build(c, me, today) {
        const filed = first(c, "filed") || (c.incidentDate ? { date: c.incidentDate } : null);
        const reply = latest(c, "reply");
        const fa = latest(c, "firstappeal");
        const faa = latest(c, "faadecision");
        return {
          subject: "Second appeal under Section 19(3) of the RTI Act, 2005",
          body: paras(
            `To\nThe Registrar\n${c.central ? "Central Information Commission, Baba Gangnath Marg, Munirka, New Delhi 110067" : "[State] Information Commission"}`,
            "Subject: Second appeal under Section 19(3) of the Right to Information Act, 2005",
            numbered([
              `Appellant: ${or(me.name, "name")}, ${or(me.address, "address")}${me.phone ? `, ${me.phone}` : ""}${me.email ? `, ${me.email}` : ""}`,
              `Respondent: Public Information Officer and First Appellate Authority, ${or(c.party, "office")}`,
              `RTI application dated ${filed ? formatDateLong(filed.date) : "[date]"}.`,
              reply ? `PIO's reply dated ${formatDateLong(reply.date)}.` : "No reply from the PIO.",
              `First appeal dated ${fa ? formatDateLong(fa.date) : "[date]"}.`,
              faa ? `First Appellate Authority's order received ${formatDateLong(faa.date)}.` : "No order from the First Appellate Authority within the time allowed.",
            ]),
            "Grounds: [why the information should be given; which parts were refused and why the refusal is wrong].",
            "Prayer: (a) direct the PIO to provide the complete information free of charge; (b) impose penalty under Section 20 for delay/denial; (c) award compensation under Section 19(8)(b).",
            "Enclosures: RTI application, PIO reply, first appeal, FAA order (if any), and proof of these.",
            "I declare that this matter is not pending before any court or other Information Commission.",
            dated(today),
            me.name || "[Your name and signature]",
          ),
        };
      },
    },
  },
};
