// Optional extras when Pairavi runs as a claude.ai artifact:
//   - "Tighten wording" asks Claude (on the viewer's own account) to edit a letter;
//   - saving a file goes through the viewer's confirmation.
// Outside claude.ai both quietly fall back or hide.

let samplePromise = null;
let downloadsPromise = null;

function use(name) {
  try {
    if (window.claude && typeof window.claude.use === "function") return window.claude.use(name).catch(() => null);
  } catch {}
  return Promise.resolve(null);
}

export function getSample() {
  if (!samplePromise) samplePromise = use("sample");
  return samplePromise;
}

function getDownloads() {
  if (!downloadsPromise) downloadsPromise = use("downloads");
  return downloadsPromise;
}

const SAMPLE_COPY = {
  not_granted: "Claude isn't allowed on this page. Your letter is unchanged.",
  sampling_disabled: "Claude isn't available on this account. Your letter is unchanged.",
  rate_limited: "Too many requests just now. Try again in a little while.",
  refused: "Claude declined to edit this letter. Your letter is unchanged.",
  session_expired: "Please sign in to claude.ai again, then retry.",
  prompt_too_large: "This letter is too long to edit in one go.",
};

export function sampleErrorText(e) {
  return SAMPLE_COPY[e?.code] || "Something went wrong reaching Claude. Your letter is unchanged.";
}

export function tightenPrompt(letter, context) {
  return [
    "You are helping an individual in India send a formal complaint letter to an institution. Edit the letter below so it is clear, firm, polite and short.",
    "Rules:",
    "- Keep every fact, date, amount, reference number and legal citation exactly as given. Do not add facts, laws, numbers or deadlines that are not in the letter.",
    "- Keep any text in [square brackets] as it is: those are blanks the writer will fill in.",
    "- Keep the sender block, date, addressee, subject line and signature structure.",
    "- Use plain Indian English. No flattery, no threats beyond what the letter already says.",
    "- Reply with only the edited letter text, nothing before or after it.",
    "",
    `Context: ${context}`,
    "",
    "LETTER:",
    letter,
  ].join("\n");
}

// Save a text file: the viewer confirms in claude.ai; elsewhere a normal download.
export async function saveFile(filename, text) {
  const dl = await getDownloads();
  if (dl) {
    try {
      await dl.save({ filename, data: text });
      return "saved";
    } catch (e) {
      if (e?.code === "declined") return "declined";
      if (!["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(e?.code)) return "failed";
    }
  }
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "saved";
  } catch {
    return "failed";
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
