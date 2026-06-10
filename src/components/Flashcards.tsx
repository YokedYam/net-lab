import { useMemo, useState, useEffect, useCallback } from 'react';
import { FLASHCARDS } from '../flashcardData';
import type { Flashcard } from '../flashcardData';
import { DOMAINS, domainName } from '../study';
import type { DomainId } from '../study';
import { conceptById } from '../concepts';

type Filter = DomainId | 'all';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Flashcards({ onResource }: { onResource: (conceptId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const pool = useMemo(
    () => (filter === 'all' ? FLASHCARDS : FLASHCARDS.filter((c) => c.domain === filter)),
    [filter]
  );

  const start = useCallback(() => {
    setDeck(shuffle(pool));
    setPos(0);
    setFlipped(false);
    setKnown(new Set());
    setStarted(true);
  }, [pool]);

  const card = deck[pos];

  const go = useCallback(
    (dir: 1 | -1) => {
      setFlipped(false);
      setPos((p) => (p + dir + deck.length) % deck.length);
    },
    [deck.length]
  );

  const rate = (good: boolean) => {
    if (!card) return;
    setKnown((k) => {
      const n = new Set(k);
      if (good) n.add(card.id);
      else n.delete(card.id);
      return n;
    });
    go(1);
  };

  const reshuffle = () => {
    setDeck(shuffle(deck));
    setPos(0);
    setFlipped(false);
  };

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, go]);

  if (!started) {
    return (
      <div className="study study-cards">
        <div className="study-intro">
          <h1>Flashcards</h1>
          <p className="study-lead">
            The facts that show up most — ports, OSI layers, subnetting, and the pairs people always
            mix up (TCP vs UDP, switch vs router, TLS vs SSL). Flip, rate yourself, repeat.
          </p>
          <div className="study-filter">
            <span className="study-filter-label">Pick a focus</span>
            <div className="chip-row">
              <button className={filter === 'all' ? 'fchip active' : 'fchip'} onClick={() => setFilter('all')}>
                All · {FLASHCARDS.length} cards
              </button>
              {DOMAINS.map((d) => {
                const n = FLASHCARDS.filter((x) => x.domain === d.id).length;
                if (n === 0) return null;
                return (
                  <button
                    key={d.id}
                    className={filter === d.id ? 'fchip active' : 'fchip'}
                    onClick={() => setFilter(d.id)}
                    style={{ '--accent': d.color } as React.CSSProperties}
                  >
                    {d.id} {d.name} · {n}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="big-btn" onClick={start}>
            Start the deck →
          </button>
          <p className="study-tip">Tip: Space flips · ← → moves between cards.</p>
        </div>
      </div>
    );
  }

  if (!card) return null;
  const linked = card.conceptId ? conceptById(card.conceptId) : null;
  const accent = DOMAINS.find((d) => d.id === card.domain)?.color ?? '#3b82f6';

  return (
    <div className="study study-cards">
      <div className="cards-statusbar">
        <div className="qs-left">
          <span className="qs-domain" style={{ color: accent }}>
            {card.domain} {domainName(card.domain)}
          </span>
          <span className="qs-topic">· {card.topic}</span>
        </div>
        <div className="qs-right">
          <span className="qs-score">
            {known.size} known · card {pos + 1}/{deck.length}
          </span>
          <button className="btn small" onClick={reshuffle}>
            Shuffle
          </button>
          <button className="btn small" onClick={() => setStarted(false)}>
            Change focus
          </button>
        </div>
      </div>

      <div className="card-stage">
        <button className="btn nav" onClick={() => go(-1)} aria-label="Previous card">
          ‹
        </button>
        <div
          className={flipped ? 'flashcard flipped' : 'flashcard'}
          onClick={() => setFlipped((f) => !f)}
          style={{ '--accent': accent } as React.CSSProperties}
        >
          <div className="flashcard-inner">
            <div className="flashcard-face front">
              <span className="fc-tag">Question</span>
              <p>{card.front}</p>
              <span className="fc-hint">click to flip</span>
            </div>
            <div className="flashcard-face back">
              <span className="fc-tag">Answer</span>
              <p>{card.back}</p>
              {linked && (
                <button
                  className="fc-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResource(card.conceptId!);
                  }}
                >
                  Watch the {linked.title} demo →
                </button>
              )}
            </div>
          </div>
        </div>
        <button className="btn nav" onClick={() => go(1)} aria-label="Next card">
          ›
        </button>
      </div>

      <div className="card-rate">
        <button className="big-btn ghost" onClick={() => rate(false)}>
          Review again
        </button>
        <button className="big-btn" onClick={() => rate(true)}>
          Got it ✓
        </button>
      </div>
    </div>
  );
}
