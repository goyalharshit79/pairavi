// Every rule Pairavi computes with points to one of these entries.
// Each was read in the primary document on the date in VERIFIED_ON.
// "confidence: high" means the clause text below was read in the official
// document (or a verbatim copy compared against it). Anything weaker says so.
//
// When a rule changes: update the entry, the playbook that uses it, the
// tests, and VERIFIED_ON. Never edit a number in a playbook without a source.

export const VERIFIED_ON = "2026-11-10";

export const SOURCES = {
  // ---------------------------------------------------------------- RBI
  "rbi-ios-2026": {
    title: "Reserve Bank – Integrated Ombudsman Scheme, 2026",
    url: "https://cms.rbi.org.in",
    doc: "https://rbidocs.rbi.org.in/rdocs/content/pdfs/SCHEME16012026_A.pdf",
    note: "In force from 1 July 2026. Complaints filed with RBI before that date stay under the 2021 Scheme.",
    confidence: "high",
  },
  "rbi-10-1-e": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(e)",
    quote: "the Complainant had first made a complaint in writing or through any other mode to the Regulated Entity concerned, where proof of having made a complaint can be produced",
  },
  "rbi-10-1-f": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(f)",
    quote: "the Complainant has not received any reply within 30 days or within the time specified by the Reserve Bank, National Payments Corporation of India, or under Card Network guidelines, if any, whichever is higher after the Regulated Entity received the complaint; or the Complainant is not satisfied with the reply",
  },
  "rbi-10-1-g": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(g)",
    quote: "the complaint is made to the RBI Ombudsman within 90 days from the date on which the timeline specified in sub-clause (1)(f) expires or the date of the last communication from the concerned Regulated Entity, whichever is later",
  },
  "rbi-10-1-b": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(b)",
    quote: "the complaint is lodged by the Complainant personally or through an authorised representative other than an advocate unless the advocate is the aggrieved person",
  },
  "rbi-10-1-jk": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(h)–(k)",
    quote: "the complaint is not relating to the same grievance, which is already pending before any Court, Tribunal or Arbitrator or any other judicial or quasi-judicial forum",
  },
  "rbi-10-1-l": {
    parent: "rbi-ios-2026",
    clause: "Clause 10(1)(l)",
    quote: "the complaint to the Regulated Entity was made before the expiry of the period of limitation prescribed under the Limitation Act, 1963, for such claims",
  },
  "rbi-8-3": {
    parent: "rbi-ios-2026",
    clause: "Clause 8(3)",
    quote: "There is no limit on the amount in a dispute … for any consequential loss … compensation up to ₹30 lakh. In addition … up to ₹3 lakh for the loss of the Complainant’s time, expenses incurred, harassment/mental anguish",
  },
  "rbi-15-4": {
    parent: "rbi-ios-2026",
    clause: "Clause 15(4)",
    quote: "The Award … shall lapse and be of no effect unless the Complainant furnishes a letter of acceptance of the Award in full and final settlement … within a period of 30 days from the date of receipt of the copy of the Award",
  },
  "rbi-15-5": {
    parent: "rbi-ios-2026",
    clause: "Clause 15(5)",
    quote: "The Regulated Entity shall comply with the Award … within 30 days from the date of receipt of the letter of acceptance from the Complainant",
  },
  "rbi-17-3": {
    parent: "rbi-ios-2026",
    clause: "Clause 17(3)",
    quote: "The Complainant may, aggrieved by an Award under clause 15(1), within 30 days of the date of receipt of the Award, prefer an appeal before the Appellate Authority … may allow a further period not exceeding 30 days",
  },
  "rbi-channels": {
    parent: "rbi-ios-2026",
    clause: "Annex / RBI FAQ",
    quote: "online CMS portal at https://cms.rbi.org.in ; (ii) or by emailing to: crpc@rbi.org.in; … Centralised Receipt and Processing Centre (CRPC), Reserve Bank of India, Central Vista, Sector 17, Chandigarh - 160 017 … #14448",
  },
  "rbi-io": {
    title: "RBI (Internal Ombudsman) Directions for banks, NBFCs, PPI issuers and credit bureaus",
    url: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx",
    clause: "Internal Ombudsman Directions",
    quote: "All complaints that are partially resolved or wholly rejected by the bank's internal grievance redress mechanism shall be auto escalated to the office of the IO for review … the reply to the complainant should explicitly state that the said complaint has been reviewed by the IO",
    confidence: "high",
  },

  // ---------------------------------------------------------- Insurance
  "ios-rules": {
    title: "Insurance Ombudsman Rules, 2017 (as amended up to 9 Nov 2023)",
    url: "https://www.cioins.co.in/OmbudsmanRules2017",
    note: "A 2025 draft amendment proposing an appellate authority had not been notified as of this check.",
    confidence: "high",
  },
  "ios-14-3-a": {
    parent: "ios-rules",
    clause: "Rule 14(3)(a)",
    quote: "No complaint to the Insurance Ombudsman shall lie unless the complainant has made a representation in writing … and either the insurer had rejected the complaint; or … had not received any reply within a period of one month … or … is not satisfied with the reply",
  },
  "ios-14-3-b": {
    parent: "ios-rules",
    clause: "Rule 14(3)(b)",
    quote: "The complaint is made within one year (i) after the order of the insurer rejecting the representation is received; or (ii) after receipt of decision of the insurer … not to the satisfaction of the complainant; (iii) after expiry of a period of one month from the date of sending the written representation … if the insurer … fails to furnish reply",
  },
  "ios-14-4": {
    parent: "ios-rules",
    clause: "Rule 14(4)",
    quote: "The Ombudsman shall be empowered to condone the delay in such cases as he may consider necessary, after calling for objections of the insurer",
  },
  "ios-14-5": {
    parent: "ios-rules",
    clause: "Rule 14(5)",
    quote: "No complaint before the Insurance Ombudsman shall be maintainable on the same subject matter on which proceedings are pending before or disposed of by any court or consumer forum or arbitrator",
  },
  "ios-16": {
    parent: "ios-rules",
    clause: "Rule 16(2)–(3)",
    quote: "If the recommendation of the Ombudsman is acceptable to the complainant, he shall send a communication in writing within fifteen days … the insurer … shall … comply … not later than fifteen days",
  },
  "ios-17": {
    parent: "ios-rules",
    clause: "Rule 17(3)–(6)",
    quote: "not award compensation exceeding rupees fifty lakhs … pass an award within a period of three months of the receipt of all requirements … The insurer … shall comply with the award within thirty days of the receipt of the award",
  },
  "irdai-mc": {
    title: "IRDAI Master Circular on Protection of Policyholders’ Interests (IRDAI/PP&GR/CIR/MISC/117/9/2024, 5 Sep 2024)",
    url: "https://irdai.gov.in",
    confidence: "high",
  },
  "irdai-grievance-14": {
    parent: "irdai-mc",
    clause: "Grievance redressal, para 2(i)",
    quote: "On receipt of a complaint, the complainant will have to be given an acknowledgement immediately. Insurers should provide resolution to the complaint within 14 days along with the reasons for not accepting the complaint with specific reference to the relevant terms and conditions",
  },
  "irdai-bima-bharosa": {
    parent: "irdai-mc",
    clause: "Grievance redressal, para 1(ii)",
    quote: "The policyholder or the claimant also has the option to register the complaint on-line at IRDAI’s Bima Bharosa by visiting https://bimabharosa.irdai.gov.in/",
    note: "Bima Bharosa call centre: 155255 or 1800 4254 732; email complaints@irdai.gov.in (from the portal’s contact page).",
  },
  "irdai-ombudsman-free": {
    parent: "irdai-mc",
    clause: "Grievance redressal, para 3",
    quote: "escalate … to Insurance Ombudsman of concerned jurisdiction, in case the claim amount is up to Rs. 50 lakhs … without any charge / fee … Online by visiting https://cioins.co.in/Complaint/Online",
  },
  "irdai-health-15": {
    parent: "irdai-mc",
    clause: "Health claims, para 3(iii)",
    quote: "No claim shall be repudiated without the approval of Product Management Committee (PMC) or … the Claims Review Committee (CRC) … Settlement of claims (other than cashless) shall be settled within fifteen days from submission of claim",
  },
  "irdai-health-cashless": {
    parent: "irdai-mc",
    clause: "Health claims, para 3(i)",
    quote: "Insurer shall decide on the request for cashless authorization immediately but not more than one hour … final authorization within three hours … If there is any delay beyond three hours, the additional amount … shall be borne by the insurer",
  },
  "irdai-health-docs": {
    parent: "irdai-mc",
    clause: "Health claims, para V.1(ii)",
    quote: "No claim shall be rejected or closed for want of documents or for delayed intimation of claim",
  },
  "irdai-moratorium": {
    parent: "irdai-mc",
    clause: "Health policies, para 8",
    quote: "No policy and claim of health insurance shall be contestable on any grounds of non-disclosure and/or misrepresentation except for established fraud, after the completion of the Moratorium Period, i.e. 60 months of continuous coverage",
  },
  "irdai-life-tat": {
    parent: "irdai-mc",
    clause: "Life claims, para 2",
    quote: "Death claim, except in cases warranting investigation: within 15 days from the date of intimation of claim … warranting investigation: within 45 days",
  },
  "irdai-interest": {
    parent: "irdai-mc",
    clause: "Claims, interest on delay",
    quote: "In case the claim is not settled within the specified timelines, then the claimant is entitled for interest at bank rate plus 2 percent from the date of receipt of intimation till the date of payment … paid by the insurers suo-moto",
  },
  "irdai-general-survey": {
    parent: "irdai-mc",
    clause: "Retail general claims, para 4",
    quote: "The surveyor shall submit the survey report … within fifteen days of allocation … Rs. 500 per day for each day of delay shall be paid to the claimant … The insurer shall decide on the claim within seven days of receipt of the survey report",
  },

  // ----------------------------------------------------------- Consumer
  "cpa-2019": {
    title: "Consumer Protection Act, 2019",
    url: "https://www.indiacode.nic.in/handle/123456789/15256",
    confidence: "high",
  },
  "cpa-69": {
    parent: "cpa-2019",
    clause: "Section 69",
    quote: "The District Commission, the State Commission or the National Commission shall not admit a complaint unless it is filed within two years from the date on which the cause of action has arisen … may entertain a complaint after the period … if … sufficient cause",
  },
  "cpa-34": {
    parent: "cpa-2019",
    clause: "Section 34(2)(d)",
    quote: "the complainant resides or personally works for gain",
  },
  "cpa-38": {
    parent: "cpa-2019",
    clause: "Section 38(7)",
    quote: "Every complaint shall be heard … and endeavour shall be made to decide the complaint within a period of three months … and within five months if it requires analysis or testing of commodities",
  },
  "cpa-41": {
    parent: "cpa-2019",
    clause: "Sections 41, 51, 67",
    quote: "appeal … to the State Commission … within a period of forty-five days from the date of the order … to the National Commission within thirty days … to the Supreme Court within a period of thirty days",
  },
  "cpa-jurisdiction": {
    title: "Consumer Protection (Jurisdiction of the District Commission, the State Commission and the National Commission) Rules, 2021 (G.S.R. 912(E))",
    url: "https://consumeraffairs.nic.in",
    clause: "Rules 3–5",
    quote: "value of the goods or services paid as consideration does not exceed fifty lakh rupees … exceeds fifty lakh but does not exceed two crore rupees … exceeds two crore rupees",
    confidence: "high",
  },
  "cpa-fees": {
    title: "Consumer Protection (Consumer Commission Procedure) Rules, 2020 — fee table",
    url: "https://e-jagriti.gov.in",
    clause: "Fee schedule",
    quote: "No fee for complaints where the consideration paid is up to ₹5 lakh.",
    note: "Not re-read in the official text during this check. Confirm the fee shown on e-Jagriti when you file.",
    confidence: "medium",
  },
  "ecom-4-5": {
    title: "Consumer Protection (E-Commerce) Rules, 2020, Rule 4(5) (restated by the 2026 amendment, notified 9 Sep 2026)",
    url: "https://consumeraffairs.nic.in",
    clause: "Rule 4(5)",
    quote: "Every e-commerce entity shall ensure that the grievance officer … acknowledges the receipt of any consumer complaint within forty-eight hours … and redresses the complaint within one month from the date of receipt of the complaint",
    confidence: "high",
  },
  "nch": {
    title: "National Consumer Helpline (Department of Consumer Affairs)",
    url: "https://consumerhelpline.gov.in",
    clause: "Contact channels",
    quote: "Toll-free 1915 (8 AM–8 PM) · WhatsApp/SMS 8800001915 · online portal, NCH app, UMANG. NCH forwards the grievance to the company; it cannot order a remedy.",
    confidence: "high",
  },
  "ejagriti": {
    title: "e-Jagriti — online filing for Consumer Commissions",
    url: "https://e-jagriti.gov.in",
    clause: "Portal",
    quote: "File, pay, and track consumer complaints online.",
    confidence: "medium",
  },

  // ---------------------------------------------------------------- RTI
  "rti-act": {
    title: "Right to Information Act, 2005",
    url: "https://rti.gov.in/rti-act.pdf",
    confidence: "high",
  },
  "rti-6": {
    parent: "rti-act",
    clause: "Section 6(1)–(3)",
    quote: "A person, who desires to obtain any information … shall make a request in writing or through electronic means … An applicant … shall not be required to give any reason … transfer … within five days",
  },
  "rti-7-1": {
    parent: "rti-act",
    clause: "Section 7(1)",
    quote: "as expeditiously as possible, and in any case within thirty days of the receipt of the request … where the information sought for concerns the life or liberty of a person, the same shall be provided within forty-eight hours",
  },
  "rti-5-2": {
    parent: "rti-act",
    clause: "Section 5(2) proviso",
    quote: "where an application … is given to a Central Assistant Public Information Officer … a period of five days shall be added in computing the period for response",
  },
  "rti-7-2": {
    parent: "rti-act",
    clause: "Sections 7(2) and 7(6)",
    quote: "If the … Public Information Officer … fails to give decision … within the period specified … [he] shall be deemed to have refused the request … information shall be provided free of charge … where a public authority fails to comply with the time limits",
  },
  "rti-11": {
    parent: "rti-act",
    clause: "Section 11(3)",
    quote: "the … Public Information Officer shall, within forty days after receipt of the request … if the third party has been given an opportunity to make representation … make a decision",
  },
  "rti-19-1": {
    parent: "rti-act",
    clause: "Section 19(1)",
    quote: "Any person who … does not receive a decision within the time specified … or is aggrieved by a decision … may within thirty days from the expiry of such period or from the receipt of such a decision prefer an appeal to such officer who is senior in rank … may admit the appeal after the expiry of the period … if … sufficient cause",
  },
  "rti-19-6": {
    parent: "rti-act",
    clause: "Section 19(6)",
    quote: "An appeal under sub-section (1) … shall be disposed of within thirty days of the receipt of the appeal or within such extended period not exceeding a total of forty-five days from the date of filing thereof, as the case may be, for reasons to be recorded in writing",
  },
  "rti-19-3": {
    parent: "rti-act",
    clause: "Section 19(3)",
    quote: "A second appeal against the decision under sub-section (1) shall lie within ninety days from the date on which the decision should have been made or was actually received, with the Central Information Commission or the State Information Commission",
  },
  "rti-18-20": {
    parent: "rti-act",
    clause: "Sections 18 and 20",
    quote: "a penalty of two hundred and fifty rupees each day till application is received or information is furnished, so however, the total amount of such penalty shall not exceed twenty-five thousand rupees",
  },
  "rti-rules-2012": {
    title: "Right to Information Rules, 2012 (Central Government)",
    url: "https://cic.gov.in/sites/default/files/RTI/RTIRules2012.pdf",
    clause: "Rules 3–5",
    quote: "accompanied by a fee of rupees ten and shall ordinarily not contain more than five hundred words … no application shall be rejected only on the ground that it contains more than five hundred words … No fee … from any person who, is below poverty line",
    confidence: "high",
  },
  "rti-online": {
    title: "RTI Online (Central Government public authorities)",
    url: "https://rtionline.gov.in",
    clause: "Portal",
    quote: "Online RTI applications and first appeals to central ministries, departments and many central public authorities, with the ₹10 fee paid online.",
    confidence: "high",
  },
  "cic-dss": {
    title: "Central Information Commission — second appeals and complaints online",
    url: "https://dsscic.nic.in",
    clause: "Portal",
    quote: "Online filing of Second Appeals and Complaints through dsscic.nic.in portal. Helpdesk 011-26183053.",
    confidence: "high",
  },
};

// Resolve an entry with its parent document's title and URL filled in.
export function source(id) {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source: ${id}`);
  const parent = s.parent ? SOURCES[s.parent] : null;
  return {
    id,
    title: s.title || parent?.title || "",
    url: s.url || parent?.url || "",
    doc: s.doc || parent?.doc || "",
    clause: s.clause || "",
    quote: s.quote || "",
    note: s.note || parent?.note || "",
    confidence: s.confidence || parent?.confidence || "high",
  };
}
