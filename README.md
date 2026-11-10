# Pairavi · पैरवी

**An advocate that doesn't get tired.** Pairavi takes one person's dispute with an institution and walks it up the official complaint ladder until it's resolved. For each case it gives:

- **your next move**, with the date it must happen by;
- **the drafted letter** for that step, filled in from your details;
- **every deadline**: theirs, yours, and the day your next option opens, each linked to the clause that sets it.

People don't lose these disputes on the merits. They lose on stamina: the 30 days of silence, the form nobody mentioned, the window that closed quietly. The ombudsmen are free and the rights are written down. Pairavi does the counting.

## Ladders covered (India)

| Dispute | Ladder | Key rules |
|---|---|---|
| Bank, UPI, card, NBFC, wallet, credit report | Bank → (Internal Ombudsman) → **RBI Ombudsman** → Appellate Authority | RB-IOS 2026: bank has 30 days; file with RBI within 90 days after that or after their last reply; accept an Award within 30 days |
| Insurance claim | Insurer's grievance officer → Bima Bharosa (optional) → **Insurance Ombudsman** | IRDAI: insurer resolves in 14 days. Ombudsman Rules 2017 r.14: opens after a rejection or a month of silence; file within one year; awards up to ₹50 lakh |
| Seller or service | Company → National Consumer Helpline → notice → **Consumer Commission** | E-commerce: acknowledge in 48h, resolve in a month. CPA 2019 s.69: file within two years; forum by amount paid (₹50 lakh / ₹2 crore) |
| Government records (RTI) | PIO → First Appellate Authority → **Information Commission** | RTI Act: 30 days (48h life/liberty, 40 with a third party, +5 via an APIO); appeal within 30; second appeal within 90 |

Every number lives in [`src/playbooks/sources.js`](src/playbooks/sources.js) with its clause, a quote from the official text, and the date it was checked (**10 Nov 2026**). The in-app **Sources** page shows the same list. Day counts follow the General Clauses Act: the trigger day is excluded.

## Privacy

Cases are stored only in the browser on your device. Nothing is sent anywhere. **Your details** has backup and restore to a JSON file. On claude.ai, the optional **Tighten wording with Claude** button sends only the letter you're viewing, and only when you press it.

## Run it

```bash
npm install
npm test            # rules and deadline maths (node:test)
npm run build       # → dist/index.html, one self-contained file
npm run smoke       # drives the built page in a phone-sized browser (needs Playwright)
```

Open `dist/index.html` in any browser, or host it anywhere static. `dist/artifact.html` is the same app without the document wrapper, for publishing as a claude.ai artifact.

## Layout

```
src/core/dates.js        date-only arithmetic, Indian date formats
src/core/engine.js       case → next move, deadlines, urgency
src/core/letter.js       letter helpers (₹ formatting, blocks)
src/playbooks/*.js       one file per ladder: intake, updates, ladder, evaluate(), letters
src/playbooks/sources.js every rule's clause, quote and URL
src/platform/            on-device storage; optional claude.ai extras
src/ui/                  the single-page app (no framework)
test/                    each rule pinned to its clause
```

## Adding or changing a rule

1. Read the clause in the official document.
2. Update or add its entry in `sources.js` (clause, short quote, URL) and `VERIFIED_ON`.
3. Change the playbook, citing that source id on the deadline.
4. Add or adjust a test in `test/playbooks.test.js`.

## Known limits

- The Consumer Commission fee table was not re-read in the official text; the app says "confirm on e-Jagriti".
- Banks may have longer reply periods than 30 days for some disputes (RBI/NPCI/card-network turnaround times). The scheme applies whichever is longer; Pairavi uses 30 and says so.
- A draft 2025 amendment to the Insurance Ombudsman Rules (adding an appellate authority) was not in force when checked.
- State RTI rules (fees, forms, portals) vary; Pairavi gives the central rules and flags state cases.

Pairavi is a guide, not a lawyer.
