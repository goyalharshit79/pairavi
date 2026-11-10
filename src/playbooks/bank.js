// Banks, NBFCs, payment apps, wallets, UPI, cards and credit bureaus
// → the RBI Ombudsman under the Integrated Ombudsman Scheme, 2026.

import { addDays, formatDate, formatDateLong, maxDate, addYears, compare } from "../core/dates.js";
import { KIND, deadline, latest, first, isResolved, aimBy } from "../core/engine.js";
import { paras, senderBlock, signature, dated, or, rupees, numbered } from "../core/letter.js";

const RE_REPLY_DAYS = 30; // clause 10(1)(f)
const OMBUDSMAN_WINDOW = 90; // clause 10(1)(g)
const AWARD_ACCEPT_DAYS = 30; // clause 15(4)
const APPEAL_DAYS = 30; // clause 17(3)

export default {
  id: "bank",
  name: "Bank, UPI or card",
  blurb: "A wrong debit, failed UPI transfer, fraud, card charge, loan or credit-report error, or a bank that won't respond.",
  party: "Bank, NBFC or payment app",
  forum: "RBI Ombudsman",

  intake: [
    { key: "party", label: "Which bank, NBFC or app?", placeholder: "e.g. State Bank of India, PhonePe" },
    { key: "account", label: "Account, card or loan number (last 4 digits are enough)", placeholder: "XXXX 1234", optional: true },
    { key: "incidentDate", label: "When did it happen?", type: "date" },
    { key: "amount", label: "Amount involved (₹)", type: "number", optional: true },
    { key: "summary", label: "What happened, in a few lines", type: "textarea", placeholder: "On 2 Oct I paid ₹4,500 by UPI to … The money left my account but never reached …" },
    { key: "relief", label: "What do you want them to do?", type: "textarea", placeholder: "Refund ₹4,500 with interest, and confirm in writing." },
  ],

  updates: {
    complained: {
      label: "I complained to the bank",
      dateLabel: "Date the bank received it",
      fields: [{ key: "ref", label: "Complaint or ticket number", optional: true }],
      help: "Use the date they received it: the email date, the portal submission date, or the date on the branch acknowledgement.",
    },
    reply: {
      label: "The bank replied",
      dateLabel: "Date of their reply",
      outcomes: [
        ["rejected", "They rejected it"],
        ["partial", "Partly fixed, not fully"],
        ["unsatisfied", "Replied, but didn't fix it"],
        ["resolved", "Fully fixed"],
      ],
      fields: [{ key: "ioReviewed", label: "Their reply says the Internal Ombudsman reviewed it", type: "checkbox", optional: true }],
    },
    ombudsman: {
      label: "I filed with the RBI Ombudsman",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "RBI complaint number", optional: true }],
    },
    award: {
      label: "The Ombudsman decided",
      dateLabel: "Date I received the decision",
      outcomes: [
        ["favourable", "In my favour (an Award)"],
        ["unfavourable", "Against me or not enough"],
      ],
    },
    resolved: { label: "It's settled", dateLabel: "Date settled" },
  },

  ladder: [
    {
      title: "Complain to the bank in writing",
      detail: "Email, the bank's grievance portal, or a letter at the branch. Keep proof. The RBI will not take your case without this step.",
      source: "rbi-10-1-e",
    },
    {
      title: "Wait up to 30 days for their reply",
      detail: "If they reject it, give a partial fix, or say nothing for 30 days, you can go to the RBI Ombudsman. Rejections must first be reviewed by the bank's Internal Ombudsman.",
      source: "rbi-10-1-f",
    },
    {
      title: "Complain to the RBI Ombudsman",
      detail: "Free, no lawyer needed. Online at cms.rbi.org.in, by email to crpc@rbi.org.in, or by post to CRPC, RBI, Central Vista, Sector 17, Chandigarh 160017. Helpline 14448.",
      source: "rbi-10-1-g",
      channels: [
        { label: "File online", value: "cms.rbi.org.in", url: "https://cms.rbi.org.in" },
        { label: "Email", value: "crpc@rbi.org.in" },
        { label: "Helpline", value: "14448" },
      ],
    },
    {
      title: "Accept the Award, or appeal",
      detail: "Send the bank a letter accepting the Award within 30 days or it lapses. If you disagree, appeal to the RBI Appellate Authority within 30 days.",
      source: "rbi-15-4",
    },
  ],

  evaluate(c, today) {
    const d = [];
    const warnings = [];
    const complained = first(c, "complained");
    const reply = latest(c, "reply");
    const filed = latest(c, "ombudsman");
    const award = latest(c, "award");

    if (isResolved(c)) {
      return { done: true, rung: 4, headline: "Settled", explain: "Keep the bank's written confirmation and your bank statement showing the credit." };
    }

    if (c.incidentDate) {
      // Limitation Act, 1963: most money claims, three years (clause 10(1)(l)).
      const limit = addYears(c.incidentDate, 3);
      if (!complained) {
        d.push(deadline({ id: "limitation", label: "Complain to the bank before the usual three-year limitation period ends", date: limit, kind: KIND.YOURS, source: "rbi-10-1-l", detail: "The Limitation Act, 1963 sets three years for most money claims. Some claims differ; complain as early as you can." }, today));
      }
    }

    if (award) {
      const acceptBy = addDays(award.date, AWARD_ACCEPT_DAYS);
      const appealBy = addDays(award.date, APPEAL_DAYS);
      if (award.outcome === "favourable") {
        d.push(deadline({ id: "accept", label: "Send the bank your letter accepting the Award", date: acceptBy, kind: KIND.YOURS, source: "rbi-15-4" }, today));
        d.push(deadline({ id: "appeal", label: "Or appeal to the Appellate Authority if the Award is too little", date: appealBy, kind: KIND.YOURS, source: "rbi-17-3" }, today));
        return {
          rung: 4,
          headline: "Accept the Award in writing",
          explain: `The Award lapses unless the bank receives your acceptance within 30 days of the day you received it. Once they have it, they must comply within 30 days.`,
          action: { label: "Send your acceptance letter to the bank", by: aimBy(acceptBy, today, 3), hard: acceptBy, letter: "accept" },
          deadlines: d,
          warnings,
        };
      }
      d.push(deadline({ id: "appeal", label: "Appeal to the RBI Appellate Authority", date: appealBy, kind: KIND.YOURS, source: "rbi-17-3", detail: "The Appellate Authority may allow up to 30 more days if you show sufficient cause." }, today));
      return {
        rung: 4,
        headline: "Decide whether to appeal",
        explain: "You can appeal to the Appellate Authority (an Executive Director of the RBI) within 30 days of receiving the decision. You can also take the dispute to a Consumer Commission or a civil court instead.",
        action: { label: "File an appeal with the Appellate Authority", by: aimBy(appealBy, today, 5), hard: appealBy },
        deadlines: d,
        warnings,
      };
    }

    if (filed) {
      return {
        rung: 3,
        headline: "With the RBI Ombudsman",
        explain: "Track it on cms.rbi.org.in with your complaint number and mobile number, or call 14448. Answer any RBI request quickly; complaints not pursued with reasonable diligence can be rejected. Don't file the same matter in a court or consumer commission while this is pending.",
        action: { label: "Watch for RBI emails and reply to any request", letter: "ombudsman" },
        deadlines: d,
        warnings,
      };
    }

    if (!complained) {
      return {
        rung: 1,
        headline: "Write to the bank first",
        explain: "The RBI Ombudsman only takes complaints the bank has already had a chance to fix, with proof that you complained. Email or use the bank's grievance portal so you have a dated record.",
        action: { label: "Send your complaint to the bank", by: today, letter: "complaint" },
        deadlines: d,
        warnings: warnings.concat(c.summary && /fraud|unauthori[sz]ed|scam|hack|didn.?t make|not done by me/i.test(c.summary)
          ? ["For a transaction you did not make: report it to the bank at once (call and in writing), and report fraud at cybercrime.gov.in or 1930. How quickly you report affects how much the bank can hold you liable for."]
          : []),
      };
    }

    // Complained. The 30-day reply period, then the 90-day window.
    const replyDue = addDays(complained.date, RE_REPLY_DAYS);
    const lastFromBank = reply ? reply.date : null;
    const windowStart = maxDate(replyDue, lastFromBank);
    const fileBy = addDays(windowStart, OMBUDSMAN_WINDOW);
    const opensOn = reply ? reply.date : addDays(replyDue, 1);

    d.push(deadline({ id: "reply", label: "Bank's reply due", date: replyDue, kind: KIND.THEIRS, source: "rbi-10-1-f", detail: "RBI, NPCI or card-network rules may give them longer for some disputes; the longer period applies." }, today));
    d.push(deadline({ id: "opens", label: "You can file with the RBI Ombudsman", date: opensOn, kind: KIND.OPENS, source: "rbi-10-1-f" }, today));
    d.push(deadline({ id: "file", label: "Last day to file with the RBI Ombudsman", date: fileBy, kind: KIND.YOURS, source: "rbi-10-1-g", detail: "90 days from the end of the bank's 30-day reply period, or from their last communication, whichever is later." }, today));

    if (compare(today, fileBy) > 0) {
      return {
        rung: 2,
        headline: "The RBI window has closed",
        explain: `The last day to file with the RBI Ombudsman was ${formatDate(fileBy)}. We found no provision in the 2026 Scheme for accepting a late complaint. You may still be able to go to a Consumer Commission (two years from when the problem arose) or a civil court.`,
        action: { label: "Consider a Consumer Commission complaint instead" },
        deadlines: d,
        warnings,
      };
    }

    if (!reply && compare(today, replyDue) <= 0) {
      return {
        rung: 2,
        headline: `Bank must reply by ${formatDate(replyDue)}`,
        explain: "If they don't reply, or reject it, you can go to the RBI Ombudsman. Keep everything they send you. If they reject it, their reply should say it was reviewed by their Internal Ombudsman.",
        action: { label: "Wait for the bank's reply", by: replyDue, letter: "ombudsman", prepare: true },
        deadlines: d,
        warnings,
      };
    }

    const why = reply
      ? { rejected: "The bank rejected your complaint.", partial: "The bank only partly fixed it.", unsatisfied: "The bank's reply didn't fix it." }[reply.outcome] || "The bank replied without fixing it."
      : `The bank didn't reply within 30 days.`;
    if (reply && reply.outcome === "rejected" && !reply.ioReviewed) {
      warnings.push("Banks must have their Internal Ombudsman review a complaint before rejecting it, and the rejection should say so. If yours doesn't, mention it in your RBI complaint.");
    }
    return {
      rung: 3,
      headline: "File with the RBI Ombudsman",
      explain: `${why} You can now complain to the RBI Ombudsman. It is free, and the bank can be ordered to pay the amount in dispute plus up to ₹30 lakh for consequential loss and ₹3 lakh for your time and harassment.`,
      action: { label: "File at cms.rbi.org.in", by: aimBy(fileBy, today), hard: fileBy, letter: "ombudsman" },
      deadlines: d,
      warnings,
    };
  },

  letters: {
    complaint: {
      title: "Complaint to the bank",
      to: "The bank's grievance officer",
      build(c, me, today) {
        return {
          subject: `Complaint: ${or(c.title, "short description")}${c.account ? ` — A/c ${c.account}` : ""}`,
          body: paras(
            senderBlock(me),
            dated(today),
            `To\nThe Grievance Redressal Officer\n${or(c.party, "Bank name")}`,
            `Subject: Complaint regarding ${or(c.title, "the problem")}${c.account ? ` (account/card ${c.account})` : ""}`,
            "Dear Sir/Madam,",
            `I am writing to complain about the following${c.incidentDate ? `, which happened on ${formatDateLong(c.incidentDate)}` : ""}:`,
            or(c.summary, "Describe what happened, with dates, amounts and transaction reference numbers"),
            c.amount ? `The amount involved is ${rupees(c.amount)}.` : "",
            `I request you to:\n${or(c.relief, "say exactly what you want: refund, reversal, correction, closure")}`,
            "Please acknowledge this complaint, give me a complaint reference number, and send me a written reply within 30 days. If you reject my complaint in whole or in part, please have it reviewed by your Internal Ombudsman as RBI's directions require, and give me your reasons in writing.",
            "If the matter is not resolved within 30 days, I will approach the RBI Ombudsman under the Reserve Bank – Integrated Ombudsman Scheme, 2026.",
            "Copies of supporting documents (statement extract, transaction screenshots, earlier messages) are attached.",
            signature(me),
          ),
        };
      },
    },
    ombudsman: {
      title: "RBI Ombudsman complaint (to paste into cms.rbi.org.in)",
      to: "RBI Ombudsman, via cms.rbi.org.in",
      build(c, me, today) {
        const complained = first(c, "complained");
        const reply = latest(c, "reply");
        return {
          subject: `Complaint against ${or(c.party, "bank")} under RB-IOS 2026`,
          body: paras(
            `Complaint against: ${or(c.party, "Bank / NBFC / payment app")}`,
            c.account ? `Account / card / loan: ${c.account}` : "",
            "Facts of the complaint:",
            or(c.summary, "What happened, with dates, amounts and transaction references"),
            numbered([
              complained ? `I complained to ${or(c.party, "the bank")} on ${formatDateLong(complained.date)}${complained.ref ? ` (reference ${complained.ref})` : ""}.` : "I complained to the bank in writing [date and reference].",
              reply
                ? `They replied on ${formatDateLong(reply.date)}: ${{ rejected: "they rejected my complaint", partial: "they resolved it only in part", unsatisfied: "their reply did not resolve it" }[reply.outcome] || "the reply did not resolve it"}.`
                : complained ? `They did not reply within 30 days (by ${formatDateLong(addDays(complained.date, 30))}).` : "",
              "The matter is not pending before, or decided by, any court, tribunal, arbitrator or consumer commission.",
            ]),
            "Deficiency in service:",
            "[Say in one or two lines what the bank should have done and did not, e.g. failed to reverse a failed transaction, failed to credit within the required time, debited charges not disclosed.]",
            `Relief sought:\n${or(c.relief, "Refund / reversal / correction")}${c.amount ? `\nAmount in dispute: ${rupees(c.amount)}` : ""}`,
            "Compensation sought: [Optional: amount for consequential loss, and for time, expenses and harassment, up to ₹3 lakh, with a one-line reason.]",
            "Documents: copy of my complaint to the bank and proof it was sent, the bank's reply (if any), account statement, transaction screenshots.",
            senderBlock(me),
            dated(today),
          ),
        };
      },
    },
    accept: {
      title: "Letter accepting the Award",
      to: "The bank (copy to the RBI Ombudsman)",
      build(c, me, today) {
        const award = latest(c, "award");
        const filed = latest(c, "ombudsman");
        return {
          subject: `Acceptance of Award${filed?.ref ? ` — RBI complaint ${filed.ref}` : ""}`,
          body: paras(
            senderBlock(me),
            dated(today),
            `To\nThe Grievance Redressal Officer\n${or(c.party, "Bank name")}`,
            `Subject: Acceptance of Award passed by the RBI Ombudsman${filed?.ref ? ` in complaint no. ${filed.ref}` : ""}`,
            "Dear Sir/Madam,",
            `I received the Award passed by the RBI Ombudsman${award ? ` on ${formatDateLong(award.date)}` : ""}. I accept the Award in full and final settlement of my claim, as required by clause 15(4) of the Reserve Bank – Integrated Ombudsman Scheme, 2026.`,
            "Please comply with the Award within 30 days of receiving this letter and confirm compliance to me in writing.",
            signature(me),
            "Copy to: The RBI Ombudsman (by email, quoting the complaint number)",
          ),
        };
      },
    },
  },
};
