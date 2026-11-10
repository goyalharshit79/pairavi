// Health, life, motor and other personal insurance
// → insurer's grievance officer → (Bima Bharosa) → Insurance Ombudsman.

import { addDays, addMonths, addYears, formatDate, formatDateLong, compare } from "../core/dates.js";
import { KIND, deadline, latest, first, isResolved, aimBy } from "../core/engine.js";
import { paras, senderBlock, signature, dated, or, rupees, numbered } from "../core/letter.js";

const INSURER_DAYS = 14; // IRDAI master circular, grievance TAT
const MEDIATION_ACCEPT_DAYS = 15; // Rule 16(2)
const AWARD_COMPLY_DAYS = 30; // Rule 17(6)

const KINDS = {
  health: "Health",
  life: "Life",
  motor: "Motor",
  other: "Other (home, travel, personal accident…)",
};

export default {
  id: "insurance",
  name: "Insurance claim",
  blurb: "A health, life, motor or other claim rejected, cut short or stuck. Also wrong policy terms or premium disputes.",
  party: "Insurer",
  forum: "Insurance Ombudsman",

  intake: [
    { key: "party", label: "Which insurance company?", placeholder: "e.g. Star Health, LIC, ICICI Lombard" },
    { key: "kind", label: "Type of insurance", type: "select", options: Object.entries(KINDS) },
    { key: "policy", label: "Policy number", optional: true },
    { key: "claimNo", label: "Claim number", optional: true },
    { key: "incidentDate", label: "When was the claim rejected or cut (or last chased)?", type: "date" },
    { key: "amount", label: "Amount you are claiming (₹)", type: "number", optional: true },
    { key: "coverYears", label: "Years of continuous cover (health only)", type: "number", optional: true },
    { key: "summary", label: "What happened, in a few lines", type: "textarea", placeholder: "I was admitted on … The insurer rejected the claim on … saying 'pre-existing disease', but …" },
    { key: "relief", label: "What do you want them to do?", type: "textarea", placeholder: "Pay the claim of ₹1,85,000 with interest for the delay." },
  ],

  updates: {
    complained: {
      label: "I wrote to the insurer's grievance officer",
      dateLabel: "Date sent",
      fields: [{ key: "ref", label: "Grievance number", optional: true }],
      help: "A written complaint, by email or on their grievance portal. A phone call doesn't count.",
    },
    reply: {
      label: "The insurer replied",
      dateLabel: "Date I received their reply",
      outcomes: [
        ["rejected", "They rejected it"],
        ["partial", "They paid part of it"],
        ["unsatisfied", "Replied, but didn't fix it"],
        ["resolved", "Paid in full / fixed"],
      ],
    },
    bimabharosa: {
      label: "I also complained on Bima Bharosa (IRDAI)",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "Bima Bharosa token number", optional: true }],
    },
    ombudsman: {
      label: "I filed with the Insurance Ombudsman",
      dateLabel: "Date filed",
      fields: [{ key: "ref", label: "Ombudsman complaint number", optional: true }],
    },
    recommendation: { label: "The Ombudsman sent a mediation recommendation", dateLabel: "Date I received it" },
    award: {
      label: "The Ombudsman passed an award",
      dateLabel: "Date of the award",
      outcomes: [
        ["favourable", "In my favour"],
        ["unfavourable", "Against me or too little"],
      ],
    },
    resolved: { label: "It's settled", dateLabel: "Date settled" },
  },

  ladder: [
    {
      title: "Write to the insurer's grievance officer",
      detail: "Email or their grievance portal, quoting policy and claim numbers. IRDAI expects a resolution with reasons within 14 days.",
      source: "irdai-grievance-14",
    },
    {
      title: "Optional: raise it on Bima Bharosa",
      detail: "IRDAI's portal sends your complaint to the insurer and tracks it. It does not decide claims, and you don't need it to reach the Ombudsman. Call 155255.",
      source: "irdai-bima-bharosa",
      channels: [
        { label: "Portal", value: "bimabharosa.irdai.gov.in", url: "https://bimabharosa.irdai.gov.in" },
        { label: "Call", value: "155255" },
      ],
    },
    {
      title: "Complain to the Insurance Ombudsman",
      detail: "Free, no lawyer needed, for claims up to ₹50 lakh. Allowed once the insurer rejects, gives an unsatisfactory reply, or doesn't reply within a month. File within one year.",
      source: "ios-14-3-b",
      channels: [{ label: "File online", value: "cioins.co.in/Complaint/Online", url: "https://www.cioins.co.in/Complaint/Online" }],
    },
    {
      title: "Award, then the insurer pays within 30 days",
      detail: "The award binds the insurer, with interest at bank rate + 2%. If you're unhappy with it, a Consumer Commission or court is still open to you.",
      source: "ios-17",
    },
  ],

  evaluate(c, today) {
    const d = [];
    const warnings = [];
    const complained = first(c, "complained");
    const reply = latest(c, "reply");
    const filed = latest(c, "ombudsman");
    const rec = latest(c, "recommendation");
    const award = latest(c, "award");

    if (isResolved(c)) {
      return { done: true, rung: 4, headline: "Settled", explain: "Check the amount paid against the claim and any interest due for delay (bank rate + 2%)." };
    }

    if (c.incidentDate) {
      d.push(deadline({ id: "consumer", label: "Consumer Commission limit (if you go there instead)", date: addYears(c.incidentDate, 2), kind: KIND.YOURS, source: "cpa-69", detail: "Two years from when the claim was rejected. Time spent before the Ombudsman may not stop this clock." }, today));
    }

    if (award) {
      if (award.outcome === "favourable") {
        const payBy = addDays(award.date, AWARD_COMPLY_DAYS);
        d.push(deadline({ id: "comply", label: "Insurer must pay the award", date: payBy, kind: KIND.THEIRS, source: "ios-17" }, today));
        return {
          rung: 4,
          headline: compare(today, payBy) > 0 ? "Insurer is late paying the award" : `Insurer must pay by ${formatDate(payBy)}`,
          explain: "The award binds the insurer. It must pay within 30 days of receiving the award, with interest at bank rate + 2% from when the claim should have been settled. If it doesn't, tell the Ombudsman's office and raise it on Bima Bharosa.",
          action: { label: "Watch for payment; check the interest" },
          deadlines: d,
          warnings,
        };
      }
      return {
        rung: 4,
        headline: "Consider a Consumer Commission",
        explain: "The award doesn't bind you. You can take the claim to a Consumer Commission or a civil court. Check the two-year limit below.",
        action: { label: "Prepare a Consumer Commission complaint" },
        deadlines: d,
        warnings,
      };
    }

    if (rec) {
      const acceptBy = addDays(rec.date, MEDIATION_ACCEPT_DAYS);
      d.push(deadline({ id: "accept", label: "Accept the recommendation in writing (if you agree)", date: acceptBy, kind: KIND.YOURS, source: "ios-16" }, today));
      return {
        rung: 4,
        headline: "Reply to the recommendation",
        explain: "If you accept it as full and final, write to the Ombudsman within 15 days of receiving it. The insurer must then comply within 15 days. If you don't accept, the Ombudsman goes on to pass an award.",
        action: { label: "Accept or decline in writing", by: aimBy(acceptBy, today, 3), hard: acceptBy },
        deadlines: d,
        warnings,
      };
    }

    if (filed) {
      d.push(deadline({ id: "award", label: "Ombudsman aims to pass an award (3 months from receiving all documents)", date: addMonths(filed.date, 3), kind: KIND.THEIRS, source: "ios-17", detail: "Counted from when the Ombudsman has everything it asked for, so it may run later." }, today));
      return {
        rung: 3,
        headline: "With the Insurance Ombudsman",
        explain: "Send any document the Ombudsman asks for quickly; the three-month clock runs from when they have everything. Hearings can be online. Don't file the same matter in a consumer commission or court while it's pending.",
        action: { label: "Reply to any request from the Ombudsman", letter: "ombudsman" },
        deadlines: d,
        warnings,
      };
    }

    if (!complained) {
      return {
        rung: 1,
        headline: "Write to the insurer's grievance officer",
        explain: "The Ombudsman only takes a complaint after you've written to the insurer. Email their grievance officer (the address is on the policy document and website) so you have a dated record.",
        action: { label: "Send your grievance letter", by: today, letter: "grievance" },
        deadlines: d,
        warnings,
      };
    }

    const received = complained.received || complained.date;
    const insurerDue = addDays(complained.date, INSURER_DAYS);
    const noReplyOpens = addDays(addMonths(received, 1), 1);
    const fileBy = reply ? addYears(reply.date, 1) : addYears(addMonths(complained.date, 1), 1);

    d.push(deadline({ id: "insurer", label: "Insurer should resolve with reasons", date: insurerDue, kind: KIND.THEIRS, source: "irdai-grievance-14" }, today));
    if (!reply) d.push(deadline({ id: "opens", label: "Ombudsman opens if they still haven't replied", date: noReplyOpens, kind: KIND.OPENS, source: "ios-14-3-a" }, today));
    d.push(deadline({ id: "file", label: "Last day to file with the Insurance Ombudsman", date: fileBy, kind: KIND.YOURS, source: "ios-14-3-b", detail: reply ? "One year from the insurer's reply." : "One year after the insurer's one month to reply ran out." }, today));

    if (compare(today, fileBy) > 0) {
      return {
        rung: 3,
        headline: "The one-year window has passed",
        explain: `The usual last day was ${formatDate(fileBy)}. The Ombudsman can still condone the delay if you explain why you were late, so file anyway with a short reason for the delay.`,
        action: { label: "File with a request to condone delay", letter: "ombudsman" },
        deadlines: d,
        warnings: warnings.concat(["Explain the delay plainly: illness, waiting on the insurer, not knowing the rule. The Ombudsman asks the insurer for objections before deciding."]),
      };
    }

    if (!reply && compare(today, noReplyOpens) < 0) {
      return {
        rung: 2,
        headline: `Insurer should reply by ${formatDate(insurerDue)}`,
        explain: `IRDAI expects a resolution with reasons within 14 days. If they reject it, or say nothing for a month, you can go to the Insurance Ombudsman. ${compare(today, insurerDue) > 0 ? "They're past 14 days, so you can raise it on Bima Bharosa now." : ""}`.trim(),
        action: { label: compare(today, insurerDue) > 0 ? "Raise it on Bima Bharosa" : "Wait for the insurer's reply", by: compare(today, insurerDue) > 0 ? today : insurerDue, letter: "ombudsman", prepare: true },
        deadlines: d,
        warnings,
      };
    }

    const why = reply
      ? { rejected: "The insurer rejected your grievance.", partial: "The insurer paid only part of it.", unsatisfied: "The insurer's reply didn't fix it." }[reply.outcome] || "The insurer's reply didn't fix it."
      : "The insurer hasn't replied in a month.";
    if (Number(c.amount) > 5000000) {
      warnings.push("The Ombudsman can award at most ₹50 lakh. For larger claims, a Consumer Commission or court may suit better.");
    }
    return {
      rung: 3,
      headline: "File with the Insurance Ombudsman",
      explain: `${why} You can now complain to the Insurance Ombudsman. It's free, you don't need a lawyer, and the award binds the insurer.`,
      action: { label: "File at cioins.co.in", by: aimBy(fileBy, today, 30), hard: fileBy, letter: "ombudsman" },
      deadlines: d,
      warnings,
    };
  },

  letters: {
    grievance: {
      title: "Grievance to the insurer",
      to: "The insurer's Grievance Redressal Officer",
      build(c, me, today) {
        const points = [];
        if (c.kind === "health") {
          points.push("IRDAI's Master Circular of 5 September 2024 requires that no health claim is repudiated without approval of the insurer's Claims Review Committee, and that the reasons cite the specific policy terms. Please confirm whether that approval was obtained.");
          points.push("The same circular says no claim shall be rejected or closed for want of documents or for delayed intimation.");
          if (Number(c.coverYears) >= 5) {
            points.push(`I have held continuous cover for ${c.coverYears} years. After the 60-month moratorium, a health policy and claim cannot be contested on grounds of non-disclosure or misrepresentation except for established fraud.`);
          }
        }
        if (c.kind === "life") points.push("Death claims must be settled within 15 days of intimation, or 45 days where investigation is warranted.");
        if (c.kind === "motor" || c.kind === "other") points.push("Where a survey is needed, the surveyor must report within 15 days of allocation and the insurer must decide within 7 days of the report.");
        points.push("Where a claim is not settled within the specified time, interest is payable at bank rate plus 2% from the date of intimation, without my having to ask.");
        return {
          subject: `Grievance: ${c.claimNo ? `Claim ${c.claimNo}` : "Claim"}${c.policy ? `, Policy ${c.policy}` : ""}`,
          body: paras(
            senderBlock(me),
            dated(today),
            `To\nThe Grievance Redressal Officer\n${or(c.party, "Insurance company")}`,
            `Subject: Grievance regarding ${c.claimNo ? `claim no. ${c.claimNo}` : "my claim"}${c.policy ? ` under policy no. ${c.policy}` : ""}`,
            "Dear Sir/Madam,",
            or(c.summary, "What happened: the claim, when it was made, what the insurer decided and the reason they gave"),
            c.amount ? `The amount claimed is ${rupees(c.amount)}.` : "",
            "I dispute this decision. I would like to draw your attention to the following:",
            numbered(points),
            `I request you to:\n${or(c.relief, "Settle the claim in full with interest for the delay")}`,
            "Please acknowledge this grievance and resolve it within 14 days, giving reasons with reference to the specific policy terms if you do not accept it.",
            "If it is not resolved, I will approach the Insurance Ombudsman under the Insurance Ombudsman Rules, 2017.",
            signature(me),
          ),
        };
      },
    },
    ombudsman: {
      title: "Insurance Ombudsman complaint",
      to: "Insurance Ombudsman, via cioins.co.in",
      build(c, me, today) {
        const complained = first(c, "complained");
        const reply = latest(c, "reply");
        const late = reply ? compare(today, addYears(reply.date, 1)) > 0 : complained ? compare(today, addYears(addMonths(complained.date, 1), 1)) > 0 : false;
        return {
          subject: `Complaint against ${or(c.party, "insurer")} under Rule 14, Insurance Ombudsman Rules, 2017`,
          body: paras(
            `Complainant: ${or(me.name, "Your name")}${me.address ? `, ${me.address}` : ""}${me.phone ? `, ${me.phone}` : ""}${me.email ? `, ${me.email}` : ""}`,
            `Insurer: ${or(c.party, "Insurance company")}`,
            `Policy no.: ${or(c.policy, "policy number")}   Claim no.: ${or(c.claimNo, "claim number")}`,
            `Type of insurance: ${KINDS[c.kind] || "[type]"}`,
            "Facts:",
            or(c.summary, "What happened, with dates"),
            numbered([
              complained ? `I made a written representation to the insurer on ${formatDateLong(complained.date)}${complained.ref ? ` (grievance no. ${complained.ref})` : ""}.` : "I made a written representation to the insurer on [date].",
              reply
                ? `The insurer replied on ${formatDateLong(reply.date)} and ${{ rejected: "rejected it", partial: "paid only part of the claim", unsatisfied: "did not resolve it" }[reply.outcome] || "did not resolve it"}.`
                : "The insurer did not reply within one month.",
              "No proceedings on this matter are pending before, or have been decided by, any court, consumer forum or arbitrator.",
            ]),
            "Ground of complaint (Rule 13): [e.g. total or partial repudiation of claim / delay in settlement / policy servicing]",
            `Relief sought:\n${or(c.relief, "Payment of the claim with interest")}${c.amount ? `\nAmount: ${rupees(c.amount)}` : ""}`,
            late ? "Request for condonation of delay (Rule 14(4)): [explain in two or three lines why the complaint is being filed after one year.]" : "",
            "Documents: policy copy, claim form and bills, insurer's rejection letter, my grievance letter and proof of sending, any reply.",
            dated(today),
            me.name || "[Your name]",
          ),
        };
      },
    },
  },
};
