// Products and services: sellers, e-commerce platforms, service providers
// → written complaint → National Consumer Helpline → Consumer Commission.

import { addDays, addMonths, addYears, formatDate, formatDateLong, compare } from "../core/dates.js";
import { KIND, deadline, latest, first, isResolved, aimBy } from "../core/engine.js";
import { paras, senderBlock, signature, dated, or, rupees, numbered } from "../core/letter.js";

const NOTICE_DAYS = 15; // customary, not statutory
const OTHER_WAIT_DAYS = 15; // practical wait for non e-commerce sellers
const APPEAL_DAYS = 45; // s.41

export function forumFor(amount) {
  const v = Number(amount) || 0;
  if (v > 2_00_00_000) return { name: "National Commission", short: "NCDRC" };
  if (v > 50_00_000) return { name: "State Commission", short: "State" };
  return { name: "District Commission", short: "District" };
}

export default {
  id: "consumer",
  name: "Seller or service",
  blurb: "A defective product, a refund not paid, a cancelled order, a builder, airline, telecom, courier, school or any service that let you down.",
  party: "Seller or company",
  forum: "Consumer Commission",

  intake: [
    { key: "party", label: "Which company or seller?", placeholder: "e.g. an online store, a builder, an airline" },
    { key: "online", label: "Did you buy it online (website or app)?", type: "checkbox", optional: true },
    { key: "order", label: "Order, booking or invoice number", optional: true },
    { key: "incidentDate", label: "When did the problem start? (delivery, refusal, breakdown)", type: "date" },
    { key: "amount", label: "Amount you paid (₹)", type: "number" },
    { key: "summary", label: "What happened, in a few lines", type: "textarea", placeholder: "I ordered … on … It arrived damaged. I asked for a refund on … They have not refunded." },
    { key: "relief", label: "What do you want them to do?", type: "textarea", placeholder: "Refund ₹12,999 to my original payment method." },
  ],

  updates: {
    complained: {
      label: "I complained to the company in writing",
      dateLabel: "Date they received it",
      fields: [{ key: "ref", label: "Ticket number", optional: true }],
      help: "Email, the app's help section, or a letter. Keep screenshots.",
    },
    reply: {
      label: "The company replied",
      dateLabel: "Date of their reply",
      outcomes: [
        ["rejected", "They refused"],
        ["partial", "Partly fixed"],
        ["unsatisfied", "Replied, but didn't fix it"],
        ["resolved", "Fully fixed"],
      ],
    },
    nch: {
      label: "I filed on the National Consumer Helpline",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "NCH docket number", optional: true }],
    },
    notice: { label: "I sent a legal notice", dateLabel: "Date sent" },
    commission: {
      label: "I filed in the Consumer Commission",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "Case number", optional: true }],
    },
    order: {
      label: "The Commission passed its order",
      dateLabel: "Date of the order",
      outcomes: [
        ["favourable", "In my favour"],
        ["unfavourable", "Against me or too little"],
      ],
    },
    resolved: { label: "It's settled", dateLabel: "Date settled" },
  },

  ladder: [
    {
      title: "Complain to the company in writing",
      detail: "Online sellers must acknowledge within 48 hours and resolve within one month.",
      source: "ecom-4-5",
    },
    {
      title: "National Consumer Helpline",
      detail: "Free. NCH passes your grievance to the company, and many companies settle at this stage. It cannot order a refund. Call 1915 or WhatsApp 8800001915.",
      source: "nch",
      channels: [
        { label: "Portal", value: "consumerhelpline.gov.in", url: "https://consumerhelpline.gov.in" },
        { label: "Call", value: "1915" },
        { label: "WhatsApp", value: "8800001915" },
      ],
    },
    {
      title: "Optional: legal notice",
      detail: "Not required by law, but a firm written demand with a deadline often settles it, and shows the Commission you gave them a chance.",
      source: null,
    },
    {
      title: "Consumer Commission",
      detail: "File within two years, online on e-Jagriti, where you live or work. No lawyer needed. No fee up to ₹5 lakh.",
      source: "cpa-69",
      channels: [{ label: "File online", value: "e-jagriti.gov.in", url: "https://e-jagriti.gov.in" }],
    },
  ],

  evaluate(c, today) {
    const d = [];
    const warnings = [];
    const complained = first(c, "complained");
    const reply = latest(c, "reply");
    const nch = latest(c, "nch");
    const notice = latest(c, "notice");
    const filed = latest(c, "commission");
    const order = latest(c, "order");
    const forum = forumFor(c.amount);

    if (isResolved(c)) {
      return { done: true, rung: 4, headline: "Settled", explain: "Keep the refund confirmation or repair record with your invoice." };
    }

    const limitBy = c.incidentDate ? addYears(c.incidentDate, 2) : null;
    if (limitBy && !filed) {
      d.push(deadline({ id: "limit", label: `Last day to file in the ${forum.name}`, date: limitBy, kind: KIND.YOURS, source: "cpa-69", detail: "Two years from when the problem arose. Late complaints need a good reason for the delay." }, today));
    }

    if (order) {
      if (order.outcome === "favourable") {
        return {
          rung: 4,
          headline: "Get the order carried out",
          explain: "Send the company a copy of the order and ask for compliance within the time it sets. If they don't comply, apply to the same Commission to enforce it; not complying is a punishable offence.",
          action: { label: "Send the order to the company" },
          deadlines: d,
          warnings,
        };
      }
      const appealBy = addDays(order.date, APPEAL_DAYS);
      d.push(deadline({ id: "appeal", label: "Appeal from a District Commission to the State Commission", date: appealBy, kind: KIND.YOURS, source: "cpa-41", detail: "45 days from the order. Appeals from a State Commission go to the National Commission within 30 days." }, today));
      return {
        rung: 4,
        headline: "Decide whether to appeal",
        explain: "Appeals from a District Commission go to the State Commission within 45 days of the order.",
        action: { label: "File an appeal", by: aimBy(appealBy, today, 7), hard: appealBy },
        deadlines: d,
        warnings,
      };
    }

    if (filed) {
      d.push(deadline({ id: "decide", label: "Commission aims to decide (3 months; 5 if testing is needed)", date: addMonths(filed.date, 3), kind: KIND.THEIRS, source: "cpa-38", detail: "A target in the Act, often missed in practice." }, today));
      return {
        rung: 4,
        headline: `In the ${forum.name}`,
        explain: "Attend every hearing (many allow video). If the company makes an offer, get it in writing before you withdraw.",
        action: { label: "Keep track of hearing dates on e-Jagriti" },
        deadlines: d,
        warnings,
      };
    }

    if (!complained) {
      return {
        rung: 1,
        headline: "Write to the company first",
        explain: "Put your complaint in writing so there's a dated record. Online sellers must acknowledge within 48 hours and resolve within one month.",
        action: { label: "Send your complaint", by: today, letter: "complaint" },
        deadlines: d,
        warnings,
      };
    }

    const waitUntil = c.online ? addMonths(complained.date, 1) : addDays(complained.date, OTHER_WAIT_DAYS);
    if (c.online) {
      d.push(deadline({ id: "ack", label: "Platform must acknowledge your complaint", date: addDays(complained.date, 2), kind: KIND.THEIRS, source: "ecom-4-5" }, today));
      d.push(deadline({ id: "redress", label: "Platform must resolve your complaint", date: waitUntil, kind: KIND.THEIRS, source: "ecom-4-5" }, today));
    }

    if (!reply && compare(today, waitUntil) <= 0 && !nch && !notice) {
      return {
        rung: 1,
        headline: `Give them until ${formatDate(waitUntil)}`,
        explain: c.online
          ? "E-commerce platforms must resolve complaints within one month. You can file on the National Consumer Helpline at any time, which often gets a faster response."
          : "There's no fixed reply period for ordinary sellers. Two weeks is a fair wait before escalating. You can file on the National Consumer Helpline at any time.",
        action: { label: "Wait, or file on the National Consumer Helpline now", by: waitUntil, letter: "nch", prepare: true },
        deadlines: d,
        warnings,
      };
    }

    if (!nch && !notice) {
      return {
        rung: 2,
        headline: "Escalate to the National Consumer Helpline",
        explain: "It's free and many companies respond to NCH quickly. At the same time, keep the two-year Consumer Commission limit in mind.",
        action: { label: "File on consumerhelpline.gov.in or call 1915", by: today, letter: "nch" },
        deadlines: d,
        warnings,
      };
    }

    if (notice) {
      const noticeEnds = addDays(notice.date, NOTICE_DAYS);
      d.push(deadline({ id: "notice", label: "Your notice period ends", date: noticeEnds, kind: KIND.THEIRS, source: null }, today));
      if (compare(today, noticeEnds) <= 0) {
        return {
          rung: 3,
          headline: `Notice runs until ${formatDate(noticeEnds)}`,
          explain: `If they don't comply, file in the ${forum.name}. Start gathering documents now.`,
          action: { label: "Prepare your Consumer Commission complaint", by: noticeEnds, letter: "commission", prepare: true },
          deadlines: d,
          warnings,
        };
      }
    }

    if (!notice) {
      return {
        rung: 3,
        headline: "Send a legal notice, or file directly",
        explain: `If NCH didn't settle it, send a notice giving them 15 days, then file in the ${forum.name}. The notice isn't required; you can file directly.`,
        action: { label: "Send a 15-day notice", by: today, letter: "notice" },
        deadlines: d,
        warnings,
      };
    }

    return {
      rung: 4,
      headline: `File in the ${forum.name}`,
      explain: `File on e-Jagriti in the ${forum.name} where you live or work. ${Number(c.amount) <= 500000 ? "No fee for amounts up to ₹5 lakh." : "Check the fee shown on e-Jagriti."} You can argue it yourself.`,
      action: { label: "File on e-Jagriti", by: limitBy ? aimBy(limitBy, today, 30) : today, hard: limitBy, letter: "commission" },
      deadlines: d,
      warnings,
    };
  },

  letters: {
    complaint: {
      title: "Complaint to the company",
      to: "Customer care / grievance officer",
      build(c, me, today) {
        return {
          subject: `Complaint${c.order ? ` — Order/Invoice ${c.order}` : ""}: ${or(c.title, "problem")}`,
          body: paras(
            senderBlock(me),
            dated(today),
            `To\nThe Grievance Officer\n${or(c.party, "Company name")}`,
            `Subject: Complaint regarding ${c.order ? `order/invoice no. ${c.order}` : or(c.title, "my purchase")}`,
            "Dear Sir/Madam,",
            or(c.summary, "What you bought or booked, when, what went wrong, and what you've already tried"),
            c.amount ? `I paid ${rupees(c.amount)}.` : "",
            `I request you to:\n${or(c.relief, "Refund / replace / repair")}`,
            c.online
              ? "Under Rule 4(5) of the Consumer Protection (E-Commerce) Rules, 2020, please acknowledge this complaint within 48 hours and resolve it within one month."
              : "Please resolve this within 15 days.",
            "If it is not resolved, I will approach the National Consumer Helpline and the Consumer Commission under the Consumer Protection Act, 2019.",
            signature(me),
          ),
        };
      },
    },
    nch: {
      title: "National Consumer Helpline grievance",
      to: "consumerhelpline.gov.in, app, or 1915",
      build(c, me) {
        const complained = first(c, "complained");
        return {
          subject: `Grievance against ${or(c.party, "company")}`,
          body: paras(
            `Company: ${or(c.party, "Company name")}`,
            c.order ? `Order / invoice: ${c.order}` : "",
            c.amount ? `Amount paid: ${rupees(c.amount)}` : "",
            or(c.summary, "What happened"),
            complained ? `I complained to the company on ${formatDateLong(complained.date)}${complained.ref ? ` (ticket ${complained.ref})` : ""} and it has not been resolved.` : "",
            `What I want: ${or(c.relief, "refund / replacement / repair")}`,
          ),
        };
      },
    },
    notice: {
      title: "Legal notice (15 days)",
      to: "The company's registered office",
      build(c, me, today) {
        return {
          subject: `Notice before filing a consumer complaint${c.order ? ` — ${c.order}` : ""}`,
          body: paras(
            senderBlock(me),
            dated(today),
            `To\n${or(c.party, "Company name")}\n[Registered office address]`,
            "Subject: Notice for deficiency in service / defective goods",
            "Sir/Madam,",
            or(c.summary, "What happened"),
            c.amount ? `I paid ${rupees(c.amount)}${c.order ? ` against order/invoice ${c.order}` : ""}.` : "",
            "Your failure to resolve this amounts to deficiency in service and/or an unfair trade practice under the Consumer Protection Act, 2019.",
            `I call upon you, within 15 days of receiving this notice, to:\n${or(c.relief, "refund / replace / repair")}`,
            "If you fail to do so, I will file a complaint before the Consumer Commission seeking this relief, compensation for the harassment caused, and costs, without further notice.",
            signature(me),
          ),
        };
      },
    },
    commission: {
      title: "Consumer complaint (outline for e-Jagriti)",
      to: "Consumer Commission, via e-jagriti.gov.in",
      build(c, me, today) {
        const forum = forumFor(c.amount);
        const complained = first(c, "complained");
        const nch = latest(c, "nch");
        const notice = latest(c, "notice");
        return {
          subject: `Consumer complaint against ${or(c.party, "company")}`,
          body: paras(
            `BEFORE THE ${forum.name.toUpperCase()}, [district / state]`,
            `${or(me.name, "Your name")}, ${or(me.address, "your address")} … Complainant`,
            "versus",
            `${or(c.party, "Company name")}, [address] … Opposite Party`,
            "COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019",
            "1. The Complainant is a consumer who bought the goods / hired the services for personal use, not for resale or a commercial purpose.",
            `2. Facts: ${or(c.summary, "What happened, in date order")}`,
            `3. The Complainant paid ${c.amount ? rupees(c.amount) : "[amount]"}${c.order ? ` (order/invoice ${c.order})` : ""}.`,
            `4. The Complainant complained to the Opposite Party${complained ? ` on ${formatDateLong(complained.date)}` : ""}${nch ? `, then on the National Consumer Helpline on ${formatDateLong(nch.date)}${nch.ref ? ` (docket ${nch.ref})` : ""}` : ""}${notice ? `, and sent a notice on ${formatDateLong(notice.date)}` : ""}. The grievance remains unresolved.`,
            "5. Deficiency in service / defect: [one or two lines naming what the Opposite Party should have done].",
            `6. Cause of action arose on ${c.incidentDate ? formatDateLong(c.incidentDate) : "[date]"} and continues. This complaint is within the two-year limit under Section 69.`,
            `7. Jurisdiction: the Complainant resides / works for gain within this Commission's area (Section 34(2)(d)). The value of goods or services paid is ${c.amount ? rupees(c.amount) : "[amount]"}, within this Commission's limit.`,
            `8. Relief sought:\n(a) ${or(c.relief, "refund / replacement / repair")}\n(b) compensation of ₹[amount] for harassment and mental agony\n(c) costs of ₹[amount]`,
            "Documents: invoice / order confirmation, payment proof, photos, complaint emails and replies, NCH docket, notice and postal receipt.",
            "VERIFICATION: I verify that the contents above are true to my knowledge and belief.",
            dated(today),
            me.name || "[Your name]",
          ),
        };
      },
    },
  },
};
