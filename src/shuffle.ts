// Shared randomness helpers for the question banks.
//
// Two problems this fixes. The banks were written with the correct answer
// sitting in the same slot far too often (65% of the exam bank was choice B,
// 75% of the quiz bank was choice A), which is a pattern you can pass on
// without knowing the material. And drawing a fresh random sample every
// attempt meant the same questions kept coming back while others never
// appeared. Both are fixed here rather than by rewriting the question data.

export interface Answerable {
  id: string;
  choices: string[];
  answer: number;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Permute a question's choices and move the answer index with them. Call this
// once when a question enters the queue, never during render, or the choices
// would jump around under the cursor.
export function withShuffledChoices<T extends Answerable>(q: T): T {
  const order = shuffle(q.choices.map((_, i) => i));
  return {
    ...q,
    choices: order.map((i) => q.choices[i]),
    answer: order.indexOf(q.answer),
  };
}

export function shuffleAllChoices<T extends Answerable>(items: readonly T[]): T[] {
  return items.map(withShuffledChoices);
}

// -------------------------------------------------------------- fresh draws

const seenKey = (bankKey: string) => `netlab.seen.${bankKey}`;

function readSeen(bankKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(seenKey(bankKey));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(bankKey: string, ids: Iterable<string>): void {
  try {
    localStorage.setItem(seenKey(bankKey), JSON.stringify([...ids]));
  } catch {
    // Private browsing or a full quota. Losing the history is harmless.
  }
}

export function resetSeen(bankKey: string): void {
  try {
    localStorage.removeItem(seenKey(bankKey));
  } catch {
    // Nothing to do.
  }
}

export function seenCount(bankKey: string): number {
  return readSeen(bankKey).size;
}

/**
 * Draw `count` items, taking questions you have not been served yet before
 * falling back to ones you have. Every question in the bank gets used once
 * before any of them repeat. Pass a bankKey to keep separate histories for
 * separate banks.
 */
export function drawFresh<T extends { id: string }>(bank: readonly T[], count: number, bankKey: string): T[] {
  const seen = readSeen(bankKey);
  const unseen = bank.filter((q) => !seen.has(q.id));
  const used = bank.filter((q) => seen.has(q.id));

  const want = Math.min(count, bank.length);
  let picked = shuffle(unseen).slice(0, want);

  if (picked.length < want) {
    // The unseen pool ran dry, so the history rolls over. Top up from the
    // already-seen pile and start the next cycle from just this draw.
    const topUp = shuffle(used).slice(0, want - picked.length);
    picked = shuffle([...picked, ...topUp]);
    writeSeen(bankKey, picked.map((q) => q.id));
    return picked;
  }

  writeSeen(bankKey, [...seen, ...picked.map((q) => q.id)]);
  return picked;
}
