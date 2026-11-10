// Drives the built page in a phone-sized browser: example case, new case,
// adding an update, opening a letter. Fails on any console error.
// Usage: node scripts/smoke.mjs [screenshot-dir]
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";

// Playwright is preinstalled globally in many environments; require() finds it there.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = new URL("..", import.meta.url).pathname;
const shots = process.argv[2];
if (shots) await mkdir(shots, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const results = [];

for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  page.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text()) && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(pathToFileURL(root + "dist/index.html").href);

  const snap = async (name) => shots && page.screenshot({ path: `${shots}/${scheme}-${name}.png`, fullPage: true });
  const noHScroll = async (where) => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (w > 0) {
      const who = await page.evaluate(() => [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.className}`).join(", ")
        + ` | iw=${innerWidth} cw=${document.documentElement.clientWidth} sx=${scrollX} body=${document.body.scrollWidth} `
        + [...document.querySelectorAll("*")].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "visible").slice(0, 3).map((e) => e.tagName + "." + e.className).join(","));
      errors.push(`[${scheme}] horizontal scroll of ${w}px on ${where}: ${who}`);
    }
  };

  // Home shows the seeded example.
  await page.waitForSelector(".case-card");
  results.push(`home: ${await page.locator(".case-card h3").first().innerText()}`);
  await noHScroll("home");
  await snap("1-home");

  // Example case: next move should be the RBI Ombudsman.
  await page.click(".case-card");
  await page.waitForSelector("#next-h");
  results.push(`example next move: ${await page.locator("#next-h").innerText()}`);
  await noHScroll("case");
  await snap("2-case");

  // Open the letter sheet.
  await page.click(".next [data-act=letter]");
  await page.waitForSelector("#l-body");
  const body = await page.locator("#l-body").inputValue();
  if (!/RB-IOS 2026/.test(body)) errors.push(`[${scheme}] ombudsman letter missing scheme reference`);
  await noHScroll("letter");
  await snap("3-letter");
  await page.click("[data-act=close-letter]");

  if (scheme === "light") {
    // New insurance case, then record a rejection.
    await page.goto(pathToFileURL(root + "dist/index.html").href + "#new-insurance");
    await page.fill("#f-title", "Knee surgery claim");
    await page.fill("#f-party", "Example Health Insurance");
    await page.selectOption("#f-kind", "health");
    await page.fill("#f-incidentDate", "2026-10-20");
    await page.fill("#f-amount", "185000");
    await page.fill("#f-coverYears", "6");
    await page.fill("#f-summary", "Claim rejected as pre-existing disease.");
    await page.fill("#f-relief", "Pay the claim in full with interest.");
    await page.click("button[type=submit]");
    await page.waitForSelector("#next-h");
    results.push(`new insurance case: ${await page.locator("#next-h").innerText()}`);

    await page.click("[data-act=letter][data-letter=grievance]");
    const g = await page.locator("#l-body").inputValue();
    if (!/60-month moratorium/.test(g)) errors.push("grievance letter missing moratorium point");
    await page.click("[data-act=close-letter]");

    await page.click("[data-act=add-update]");
    await page.selectOption("#u-type", "complained");
    await page.fill("#u-date", "2026-10-21");
    await page.click(".update button[type=submit]");
    await page.waitForSelector(".timeline li");
    await page.click("[data-act=add-update]");
    await page.selectOption("#u-type", "reply");
    await page.fill("#u-date", "2026-10-30");
    await page.check("#u-o-rejected");
    await page.click(".update button[type=submit]");
    await page.waitForFunction(() => /Ombudsman/.test(document.querySelector("#next-h")?.textContent));
    results.push(`after rejection: ${await page.locator("#next-h").innerText()} / ${await page.locator(".next .stamp").getAttribute("aria-label")}`);
    await noHScroll("insurance case");
    await snap("4-insurance");

    // Persistence across reload.
    await page.reload();
    await page.waitForSelector("#next-h");
    results.push(`after reload: ${await page.locator("#next-h").innerText()}`);

    // Other views render.
    for (const h of ["new", "new-rti", "new-consumer", "new-bank", "me", "sources"]) {
      await page.evaluate((hash) => (location.hash = hash), h);
      await page.waitForFunction((hash) => location.hash === "#" + hash && document.querySelector(".page-title"), h);
      await page.waitForTimeout(50);
      await noHScroll(h);
      if (h === "sources" || h === "new") await snap(`5-${h}`);
    }
  }
  await page.close();
}

await browser.close();
console.log(results.join("\n"));
if (errors.length) {
  console.error("\nPROBLEMS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("\nSmoke test passed: no console errors, no horizontal scroll.");
