import { describe, it, expect, beforeEach } from 'vitest';

// Vitest runs in node here, so the fresh-draw history has nowhere to live.
// A tiny in-memory stand-in is enough to exercise the real code path.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

import { drawFresh, resetSeen, shuffle, shuffleAllChoices, withShuffledChoices } from './shuffle';
import { EXAM_BANK } from './examData';
import { EASY_QUIZ, MEDIUM_QUIZ } from './quizData';

const q = (id: string) => ({ id, choices: ['a', 'b', 'c', 'd'], answer: 1 });

describe('choice shuffling', () => {
  it('keeps the correct answer pointing at the same text', () => {
    for (let i = 0; i < 500; i++) {
      const out = withShuffledChoices(q('x'));
      expect(out.choices).toHaveLength(4);
      expect(new Set(out.choices).size).toBe(4);
      expect(out.choices[out.answer]).toBe('b');
    }
  });

  it('spreads the correct answer across every slot', () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) counts[withShuffledChoices(q('x')).answer]++;
    // A fair 4-way split is 25% each. Anything inside 20 to 30 is noise.
    for (const c of counts) {
      expect(c / 4000).toBeGreaterThan(0.2);
      expect(c / 4000).toBeLessThan(0.3);
    }
  });

  it('flattens the real banks, which lean hard on one slot as written', () => {
    for (const bank of [EXAM_BANK, EASY_QUIZ, MEDIUM_QUIZ]) {
      const counts = [0, 0, 0, 0, 0];
      for (const item of shuffleAllChoices(bank)) {
        expect(item.choices[item.answer]).toBe(bank.find((b) => b.id === item.id)!.choices[
          bank.find((b) => b.id === item.id)!.answer
        ]);
        counts[item.answer]++;
      }
      // No single slot should hold more than 45% once shuffled. The raw banks
      // were at 65% and 75%.
      const worst = Math.max(...counts) / bank.length;
      expect(worst).toBeLessThan(0.45);
    }
  });
});

describe('fresh draws', () => {
  const KEY = 'test-bank';
  const bank = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}` }));

  beforeEach(() => resetSeen(KEY));

  it('never repeats a question until the bank is exhausted', () => {
    const a = drawFresh(bank, 10, KEY);
    const b = drawFresh(bank, 10, KEY);
    const c = drawFresh(bank, 10, KEY);
    const ids = [...a, ...b, ...c].map((x) => x.id);
    expect(new Set(ids).size).toBe(30);
  });

  it('rolls over once every question has been served', () => {
    drawFresh(bank, 30, KEY);
    const next = drawFresh(bank, 10, KEY);
    expect(next).toHaveLength(10);
    expect(new Set(next.map((x) => x.id)).size).toBe(10);
  });

  it('caps the draw at the bank size', () => {
    expect(drawFresh(bank, 100, KEY)).toHaveLength(30);
  });
});

describe('shuffle', () => {
  it('keeps every element', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(src);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
