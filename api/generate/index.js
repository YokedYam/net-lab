// AI generator for the Net+ Visual Lab. Strictly button-triggered from the UI,
// never automatic. Two actions over one endpoint:
//   { action: "question", source } -> a fresh quiz question similar to source
//   { action: "pbq",      source } -> a fresh PBQ of the same kind as source
//
// Same Azure OpenAI setup as the portfolio Copilot and the AZ-305 lab:
// OPENAI_BASE_URL is the resource's /openai/v1 path, OPENAI_MODEL is the
// deployment name, auth is the api-key header, all via the v1 Responses API.
const MODEL = process.env.OPENAI_MODEL || "johnny-copilot";
const BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_URL = `${BASE_URL}/responses`;
const IS_AZURE = BASE_URL.includes("azure.com");

// Cheap per-instance rate limits so nobody drains the Azure credit.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = Number(process.env.GEN_MAX_PER_MINUTE || 5);
const RATE_MAX_PER_DAY_IP = Number(process.env.GEN_MAX_PER_DAY_IP || 30);
const RATE_MAX_PER_DAY_GLOBAL = Number(process.env.GEN_MAX_PER_DAY_GLOBAL || 150);
const hits = new Map();
const dayHits = new Map();
let globalDay = { key: "", count: 0 };

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function rateLimited(ip) {
  const now = Date.now();
  const today = dayKey();

  if (globalDay.key !== today) globalDay = { key: today, count: 0 };
  if (globalDay.count >= RATE_MAX_PER_DAY_GLOBAL) return "global";

  const daily = dayHits.get(ip);
  const dailyCount = daily && daily.key === today ? daily.count : 0;
  if (dailyCount >= RATE_MAX_PER_DAY_IP) return "day";

  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_PER_WINDOW) return "minute";

  recent.push(now);
  hits.set(ip, recent);
  dayHits.set(ip, { key: today, count: dailyCount + 1 });
  globalDay.count += 1;
  if (hits.size > 1000) hits.clear();
  if (dayHits.size > 5000) dayHits.clear();
  return null;
}

const VOICE = `Voice rules: plain English a beginner can follow, contractions are fine, no em dashes anywhere. Explanations should teach, not just assert, and a simple everyday analogy is welcome when it helps something click.`;

const QUESTION_INSTRUCTIONS = `You write practice questions for a CompTIA Network+ (N10-009) study app.

You'll get one existing question as a reference. Write ONE new question on the same topic at the same difficulty, but distinctly different: new scenario, new specifics, and don't reuse the reference's wording or its answer text. Scenario style, "BEST answer" phrasing where natural, exactly like the real exam.

${VOICE}

Output: a single JSON object, nothing else. No markdown fences. Schema:
{
  "question": "the scenario question",
  "choices": ["four plausible choices"],
  "answer": 0,
  "explanation": "why the winner wins and why the tempting losers lose, beginner-friendly",
  "topic": "short topic label"
}

Rules:
- Exactly 4 choices. Every wrong choice is a real networking thing used out of context, never invented junk.
- "answer" is the zero-based index of the correct choice. Vary its position; don't default to 0.
- The explanation must mention why at least one wrong choice is tempting but wrong.`;

const PBQ_INSTRUCTIONS = `You write performance-based questions (PBQs) for a CompTIA Network+ (N10-009) study app.

You'll get one existing PBQ as a reference. Write ONE new PBQ of the SAME kind on the same topic family, but with fresh content: new scenario, new items, don't copy the reference's rows.

${VOICE}

Output: a single JSON object, nothing else. No markdown fences. Schema by kind:

kind "match":
{ "kind": "match", "title": "...", "scenario": "...", "instruction": "...",
  "options": ["pool of options, include a couple of plausible decoys"],
  "prompts": [ { "text": "...", "correct": "one of options", "why": "one-line reason" } ] }

kind "categorize":
{ "kind": "categorize", "title": "...", "scenario": "...", "instruction": "...",
  "buckets": ["2 to 4 buckets"],
  "items": [ { "text": "...", "bucket": "one of buckets", "why": "one-line reason" } ] }

kind "order":
{ "kind": "order", "title": "...", "scenario": "...", "instruction": "...",
  "items": [ { "text": "step text" } ] }   // listed in the CORRECT order

Rules:
- 5 to 8 prompts/items.
- For "match", every prompt's "correct" must appear in "options", and "options" should have 1-3 extra decoys that match no prompt.
- For "categorize", every item's "bucket" must appear in "buckets".
- For "order", the items array IS the correct sequence; the app shuffles it for the student.
- Every "why" teaches the rule in one sentence.`;

function json(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body,
  };
}

function extractText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const chunks = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

async function callModel(instructions, input, maxTokens) {
  const authHeader = IS_AZURE
    ? { "api-key": process.env.OPENAI_API_KEY }
    : { authorization: `Bearer ${process.env.OPENAI_API_KEY}` };
  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { ...authHeader, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      instructions,
      input,
      max_output_tokens: maxTokens,
      // Reasoning tokens count against the cap, so it needs real headroom.
      reasoning: { effort: "medium" },
      text: { verbosity: "low" },
      store: false,
    }),
  });
  const data = await upstream.json();
  if (!upstream.ok) {
    const err = new Error("model request failed");
    err.detail = data;
    throw err;
  }
  return extractText(data);
}

function parseJsonObject(text) {
  const cleaned = String(text || "")
    .replace(/^```(json)?/m, "")
    .replace(/```\s*$/m, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function validQuestion(q) {
  return (
    q &&
    typeof q.question === "string" &&
    Array.isArray(q.choices) &&
    q.choices.length === 4 &&
    q.choices.every((c) => typeof c === "string" && c.trim()) &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer < q.choices.length &&
    typeof q.explanation === "string" &&
    q.explanation.length > 30
  );
}

function validPbq(p, kind) {
  if (!p || p.kind !== kind) return false;
  if (typeof p.title !== "string" || typeof p.scenario !== "string" || typeof p.instruction !== "string") return false;
  if (kind === "match") {
    if (!Array.isArray(p.options) || !Array.isArray(p.prompts)) return false;
    if (p.prompts.length < 4 || p.prompts.length > 10) return false;
    return p.prompts.every(
      (r) => r && typeof r.text === "string" && typeof r.why === "string" && p.options.includes(r.correct),
    );
  }
  if (kind === "categorize") {
    if (!Array.isArray(p.buckets) || p.buckets.length < 2 || !Array.isArray(p.items)) return false;
    if (p.items.length < 4 || p.items.length > 10) return false;
    return p.items.every(
      (r) => r && typeof r.text === "string" && typeof r.why === "string" && p.buckets.includes(r.bucket),
    );
  }
  if (kind === "order") {
    if (!Array.isArray(p.items) || p.items.length < 4 || p.items.length > 10) return false;
    return p.items.every((r) => r && typeof r.text === "string" && r.text.trim());
  }
  return false;
}

module.exports = async function (context, req) {
  if (!process.env.OPENAI_API_KEY) {
    context.res = json(503, { error: "The AI backend is not configured." });
    return;
  }

  const ip = (req.headers?.["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const limited = rateLimited(ip);
  if (limited === "minute") {
    context.res = json(429, { error: "Slow down a little. Try again in a minute." });
    return;
  }
  if (limited) {
    context.res = json(429, { error: "The AI budget for today is used up. Try again tomorrow." });
    return;
  }

  const action = req.body?.action;
  const source = req.body?.source;

  try {
    if (action === "question") {
      if (!source || typeof source.question !== "string") {
        context.res = json(400, { error: "Missing source question." });
        return;
      }
      const prompt = `Reference question (topic: ${String(source.topic || "general")}):\n${JSON.stringify(
        {
          question: String(source.question).slice(0, 600),
          choices: (source.choices || []).slice(0, 5),
          answer: source.answer,
          explanation: String(source.explanation || "").slice(0, 600),
        },
        null,
        2,
      )}\n\nWrite one new, different question on the same topic.`;
      let out = null;
      for (let attempt = 0; attempt < 2 && !out; attempt++) {
        const parsed = parseJsonObject(await callModel(QUESTION_INSTRUCTIONS, prompt, 2500));
        if (parsed && validQuestion(parsed)) out = parsed;
        else context.log.warn("question attempt rejected");
      }
      if (!out) {
        context.res = json(502, { error: "The AI wrote an unusable question. Try again." });
        return;
      }
      context.res = json(200, { question: out });
      return;
    }

    if (action === "pbq") {
      const kind = source?.kind;
      if (!["match", "categorize", "order"].includes(kind)) {
        context.res = json(400, { error: "Unsupported PBQ kind." });
        return;
      }
      const prompt = `Reference PBQ (kind: ${kind}):\n${JSON.stringify(
        {
          title: String(source.title || "").slice(0, 200),
          scenario: String(source.scenario || "").slice(0, 600),
          instruction: String(source.instruction || "").slice(0, 300),
          options: source.options,
          buckets: source.buckets,
          prompts: source.prompts,
          items: source.items,
        },
        null,
        2,
      ).slice(0, 4000)}\n\nWrite one new, different PBQ of the same kind on the same topic family.`;
      let out = null;
      for (let attempt = 0; attempt < 2 && !out; attempt++) {
        const parsed = parseJsonObject(await callModel(PBQ_INSTRUCTIONS, prompt, 3500));
        if (parsed && validPbq(parsed, kind)) out = parsed;
        else context.log.warn("pbq attempt rejected");
      }
      if (!out) {
        context.res = json(502, { error: "The AI wrote an unusable PBQ. Try again." });
        return;
      }
      context.res = json(200, { pbq: out });
      return;
    }

    context.res = json(400, { error: "Unknown action." });
  } catch (error) {
    context.log.error(error.detail || error);
    context.res = json(502, { error: "The AI request failed. Try again." });
  }
};
