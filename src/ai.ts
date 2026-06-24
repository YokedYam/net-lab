import type { QuizQuestion } from './quizData';
import type { Pbq, MatchPbq, CategorizePbq, OrderPbq, SubnetPbq } from './pbqData';

// Client for the lab's /api/generate Azure Function (same Azure OpenAI backend
// pattern as the AZ-305 lab). Generation is strictly user-triggered: these
// functions only run when someone clicks the button. Failures come back as
// values so the UI can show a small message instead of throwing.
export type AiResult<T> = { ok: true; value: T } | { ok: false; message: string };

const ENDPOINT = '/api/generate';

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

async function post(body: unknown): Promise<AiResult<Record<string, unknown>>> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, message: "Couldn't reach the AI service." };
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error page, e.g. 404 when the API isn't deployed */
  }
  if (!res.ok) {
    const message =
      typeof data.error === 'string' && data.error
        ? data.error
        : res.status === 404 || res.status === 503
          ? "The AI generator isn't available right now."
          : `The AI generator returned an error (HTTP ${res.status}).`;
    return { ok: false, message };
  }
  return { ok: true, value: data };
}

export async function generateSimilarQuestion(
  source: QuizQuestion,
): Promise<AiResult<QuizQuestion>> {
  const res = await post({
    action: 'question',
    source: {
      topic: source.topic,
      question: source.question,
      choices: source.choices,
      answer: source.answer,
      explanation: source.explanation,
    },
  });
  if (!res.ok) return res;
  const raw = res.value.question as Record<string, unknown> | undefined;
  if (
    !raw ||
    typeof raw.question !== 'string' ||
    !Array.isArray(raw.choices) ||
    raw.choices.length !== 4 ||
    typeof raw.answer !== 'number' ||
    raw.answer < 0 ||
    raw.answer >= raw.choices.length ||
    typeof raw.explanation !== 'string'
  ) {
    return { ok: false, message: 'The AI wrote an unusable question. Try again.' };
  }
  return {
    ok: true,
    value: {
      id: uid('ai-q'),
      domain: source.domain,
      difficulty: source.difficulty ?? 'medium',
      topic: typeof raw.topic === 'string' && raw.topic ? raw.topic : source.topic,
      conceptId: source.conceptId,
      resourceLabel: source.resourceLabel,
      question: raw.question,
      choices: raw.choices as string[],
      answer: raw.answer,
      explanation: raw.explanation,
      ai: true,
    },
  };
}

// Subnet PBQs don't need a model: the grading is computed from ip + cidr, so a
// fresh one is just fresh numbers. Instant, free, and never wrong.
function randomSubnetPbq(source: SubnetPbq): SubnetPbq {
  const bases = [
    () => `10.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
    () => `172.${rand(16, 31)}.${rand(0, 255)}.${rand(1, 254)}`,
    () => `192.168.${rand(0, 255)}.${rand(1, 254)}`,
  ];
  const ip = bases[rand(0, bases.length - 1)]();
  let cidr = rand(22, 29);
  if (cidr === source.cidr) cidr = cidr === 29 ? 28 : cidr + 1;
  return {
    ...source,
    id: uid('ai-pbq'),
    title: `Subnet drill: ${ip}/${cidr}`,
    scenario: `A new VLAN was carved out and a host landed on ${ip}/${cidr}. Work out the addressing facts for its subnet.`,
    ip,
    cidr,
    ai: true,
  };
}
const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

export async function generateSimilarPbq(source: Pbq): Promise<AiResult<Pbq>> {
  if (source.kind === 'subnet') {
    return { ok: true, value: randomSubnetPbq(source) };
  }

  const res = await post({ action: 'pbq', source });
  if (!res.ok) return res;
  const raw = res.value.pbq as Record<string, unknown> | undefined;
  if (!raw || raw.kind !== source.kind) {
    return { ok: false, message: 'The AI wrote an unusable PBQ. Try again.' };
  }

  const base = {
    id: uid('ai-pbq'),
    domain: source.domain,
    resources: source.resources,
    title: String(raw.title || source.title),
    scenario: String(raw.scenario || ''),
    instruction: String(raw.instruction || ''),
    ai: true as const,
  };

  if (source.kind === 'match') {
    const options = (raw.options as string[]) ?? [];
    const prompts = ((raw.prompts as Array<Record<string, string>>) ?? [])
      .filter((p) => p?.text && p?.why && options.includes(p.correct))
      .map((p, i) => ({ id: `g${i}`, text: p.text, correct: p.correct, why: p.why }));
    if (options.length < 4 || prompts.length < 4) {
      return { ok: false, message: 'The AI wrote an unusable PBQ. Try again.' };
    }
    const pbq: MatchPbq = { ...base, kind: 'match', options, prompts };
    return { ok: true, value: pbq };
  }

  if (source.kind === 'categorize') {
    const buckets = (raw.buckets as string[]) ?? [];
    const items = ((raw.items as Array<Record<string, string>>) ?? [])
      .filter((it) => it?.text && it?.why && buckets.includes(it.bucket))
      .map((it, i) => ({ id: `g${i}`, text: it.text, bucket: it.bucket, why: it.why }));
    if (buckets.length < 2 || items.length < 4) {
      return { ok: false, message: 'The AI wrote an unusable PBQ. Try again.' };
    }
    const pbq: CategorizePbq = { ...base, kind: 'categorize', buckets, items };
    return { ok: true, value: pbq };
  }

  const items = ((raw.items as Array<Record<string, string>>) ?? [])
    .filter((it) => it?.text)
    .map((it, i) => ({ id: `g${i}`, text: it.text }));
  if (items.length < 4) {
    return { ok: false, message: 'The AI wrote an unusable PBQ. Try again.' };
  }
  const pbq: OrderPbq = { ...base, kind: 'order', items };
  return { ok: true, value: pbq };
}
