import { describe, it, expect } from 'vitest';
import { QUIZ } from './quizData';
import { FLASHCARDS } from './flashcardData';
import { PBQS } from './pbqData';
import { CONCEPTS } from './concepts';
import { DOMAINS, subnetFacts, type SubnetField } from './study';

const CONCEPT_IDS = new Set(CONCEPTS.map((c) => c.id));
const DOMAIN_IDS = new Set(DOMAINS.map((d) => d.id));
const SUBNET_FIELDS: SubnetField[] = ['mask', 'network', 'broadcast', 'firstHost', 'lastHost', 'hostCount'];

// Collect every string value reachable from a value (deep walk).
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

describe('Quiz bank', () => {
  it('has a non-trivial number of questions', () => {
    expect(QUIZ.length).toBeGreaterThanOrEqual(20);
  });
  it('has unique ids', () => {
    const ids = QUIZ.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every answer index is within its choices', () => {
    for (const q of QUIZ) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
    }
  });
  it('every domain is valid and copy is non-empty', () => {
    for (const q of QUIZ) {
      expect(DOMAIN_IDS.has(q.domain)).toBe(true);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });
  it('every conceptId links to a real Learn demo', () => {
    for (const q of QUIZ) {
      if (q.conceptId) expect(CONCEPT_IDS.has(q.conceptId)).toBe(true);
    }
  });
});

describe('Flashcards', () => {
  it('has a non-trivial number of cards', () => {
    expect(FLASHCARDS.length).toBeGreaterThanOrEqual(20);
  });
  it('has unique ids', () => {
    const ids = FLASHCARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every card has a valid domain, non-empty front/back, and valid conceptId link', () => {
    for (const c of FLASHCARDS) {
      expect(DOMAIN_IDS.has(c.domain)).toBe(true);
      expect(c.front.trim().length).toBeGreaterThan(0);
      expect(c.back.trim().length).toBeGreaterThan(0);
      if (c.conceptId) expect(CONCEPT_IDS.has(c.conceptId)).toBe(true);
    }
  });
});

describe('PBQs', () => {
  it('has unique ids and valid domains', () => {
    const ids = PBQS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PBQS) expect(DOMAIN_IDS.has(p.domain)).toBe(true);
  });
  it('every suggested resource links to a real Learn demo', () => {
    for (const p of PBQS) {
      for (const r of p.resources ?? []) expect(CONCEPT_IDS.has(r)).toBe(true);
    }
  });
  it('match PBQs: every correct answer is one of the offered options', () => {
    for (const p of PBQS) {
      if (p.kind !== 'match') continue;
      for (const prompt of p.prompts) expect(p.options).toContain(prompt.correct);
    }
  });
  it('categorize PBQs: every item bucket is a declared bucket', () => {
    for (const p of PBQS) {
      if (p.kind !== 'categorize') continue;
      for (const item of p.items) expect(p.buckets).toContain(item.bucket);
    }
  });
  it('subnet PBQs: valid fields and computable addressing', () => {
    for (const p of PBQS) {
      if (p.kind !== 'subnet') continue;
      expect(p.cidr).toBeGreaterThanOrEqual(0);
      expect(p.cidr).toBeLessThanOrEqual(32);
      expect(p.fields.length).toBeGreaterThan(0);
      for (const f of p.fields) expect(SUBNET_FIELDS).toContain(f);
      expect(() => subnetFacts(p.ip, p.cidr)).not.toThrow();
    }
  });
  it('order PBQs: at least two steps to sequence', () => {
    for (const p of PBQS) {
      if (p.kind !== 'order') continue;
      expect(p.items.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Humanizer voice regression guard', () => {
  it('no em dashes (\\u2014) anywhere in user-facing content', () => {
    const offenders: string[] = [];
    const scan = (label: string, data: unknown) => {
      for (const s of collectStrings(data)) {
        if (s.includes('\u2014')) offenders.push(`${label}: ${s}`);
      }
    };
    scan('QUIZ', QUIZ);
    scan('FLASHCARDS', FLASHCARDS);
    scan('PBQS', PBQS);
    scan('CONCEPTS', CONCEPTS);
    expect(offenders).toEqual([]);
  });
});
