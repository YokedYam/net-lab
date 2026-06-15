import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MATCH_SETS, ROUND_PAIRS } from '../matchData';
import type { MatchPair, MatchSet } from '../matchData';

type Side = 'term' | 'def';
type Status = 'idle' | 'sel' | 'matched' | 'wrong';

interface Tile {
  key: string;
  pairId: number;
  side: Side;
  text: string;
  status: Status;
}

interface Summary {
  ms: number;
  mistakes: number;
  pairs: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sample up to ROUND_PAIRS pairs, skipping duplicate terms or defs so a round
// never shows the same word twice (matters most for the Mixed set).
function samplePairs(pool: MatchPair[]): MatchPair[] {
  const out: MatchPair[] = [];
  const seenTerm = new Set<string>();
  const seenDef = new Set<string>();
  for (const p of shuffle(pool)) {
    if (seenTerm.has(p.term) || seenDef.has(p.def)) continue;
    out.push(p);
    seenTerm.add(p.term);
    seenDef.add(p.def);
    if (out.length >= ROUND_PAIRS) break;
  }
  return out;
}

function buildTiles(pairs: MatchPair[]): Tile[] {
  const tiles: Tile[] = [];
  pairs.forEach((p, i) => {
    tiles.push({ key: `t${i}`, pairId: i, side: 'term', text: p.term, status: 'idle' });
    tiles.push({ key: `d${i}`, pairId: i, side: 'def', text: p.def, status: 'idle' });
  });
  return shuffle(tiles);
}

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}

const bestKey = (setId: string) => `netlab.match.best.${setId}`;

const MIXED_POOL: MatchPair[] = MATCH_SETS.flatMap((s) => s.pairs);

export function MatchGame() {
  const [setId, setSetId] = useState<string>('');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [matched, setMatched] = useState(0);
  const [roundPairs, setRoundPairs] = useState(ROUND_PAIRS);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSet: MatchSet | null = useMemo(
    () => MATCH_SETS.find((s) => s.id === setId) ?? null,
    [setId]
  );
  const accent = setId === 'mixed' ? '#a78bfa' : activeSet?.color ?? '#3b82f6';

  // Tick the clock while a round is live.
  useEffect(() => {
    if (startTs === null || summary) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startTs, summary]);

  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    []
  );

  const startRound = useCallback((id: string) => {
    const pool = id === 'mixed' ? MIXED_POOL : MATCH_SETS.find((s) => s.id === id)?.pairs ?? [];
    const pairs = samplePairs(pool);
    setSetId(id);
    setRoundPairs(pairs.length);
    setTiles(buildTiles(pairs));
    setSelected(null);
    setLocked(false);
    setMistakes(0);
    setMatched(0);
    setStartTs(null);
    setNow(0);
    setSummary(null);
    const raw = localStorage.getItem(bestKey(id));
    setBest(raw ? Number(raw) : null);
  }, []);

  const setStatus = (keys: string[], status: Status) =>
    setTiles((ts) => ts.map((t) => (keys.includes(t.key) ? { ...t, status } : t)));

  const finish = useCallback(
    (finalMistakes: number) => {
      const ms = startTs ? Date.now() - startTs : 0;
      setSummary({ ms, mistakes: finalMistakes, pairs: roundPairs });
      setStartTs(null);
      const prev = localStorage.getItem(bestKey(setId));
      if (!prev || ms < Number(prev)) {
        localStorage.setItem(bestKey(setId), String(ms));
        setBest(ms);
      }
    },
    [startTs, roundPairs, setId]
  );

  const onTile = (t: Tile) => {
    if (locked || t.status === 'matched' || summary) return;
    if (startTs === null) {
      setStartTs(Date.now());
      setNow(Date.now());
    }
    if (selected === null) {
      setSelected(t.key);
      setStatus([t.key], 'sel');
      return;
    }
    if (selected === t.key) {
      setSelected(null);
      setStatus([t.key], 'idle');
      return;
    }
    const first = tiles.find((x) => x.key === selected);
    if (!first) return;

    if (first.pairId === t.pairId) {
      setStatus([first.key, t.key], 'matched');
      setSelected(null);
      const nextMatched = matched + 1;
      setMatched(nextMatched);
      if (nextMatched >= roundPairs) finish(mistakes);
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setStatus([first.key, t.key], 'wrong');
      setLocked(true);
      wrongTimer.current = setTimeout(() => {
        setTiles((ts) =>
          ts.map((x) => (x.status === 'wrong' ? { ...x, status: 'idle' } : x))
        );
        setSelected(null);
        setLocked(false);
      }, 650);
    }
  };

  // Set picker (intro screen). Mixed has no activeSet, so gate on setId.
  if (!setId) {
    return (
      <div className="study study-match">
        <div className="study-intro">
          <h1>Matching</h1>
          <p className="study-lead">
            Race the clock. Tap a term, then tap its match. Get them all as fast as you can. Wrong
            taps flash and cost you time, so go quick but read first.
          </p>
          <div className="study-filter">
            <span className="study-filter-label">Pick a set</span>
            <div className="chip-row">
              {MATCH_SETS.map((s) => (
                <button
                  key={s.id}
                  className="fchip"
                  onClick={() => startRound(s.id)}
                  style={{ '--accent': s.color } as React.CSSProperties}
                >
                  {s.name} · {s.pairs.length}
                </button>
              ))}
              <button
                className="fchip"
                onClick={() => startRound('mixed')}
                style={{ '--accent': '#a78bfa' } as React.CSSProperties}
              >
                Mixed · all sets
              </button>
            </div>
          </div>
          <p className="study-tip">Tip: each round is {ROUND_PAIRS} pairs. Your best time per set is saved.</p>
        </div>
      </div>
    );
  }

  const elapsed = startTs ? now - startTs : 0;
  const setName = activeSet ? activeSet.name : 'Mixed';

  return (
    <div className="study study-match">
      <div className="match-bar" style={{ '--accent': accent } as React.CSSProperties}>
        <button className="btn" onClick={() => setSetId('')}>
          ← Sets
        </button>
        <span className="match-setname">{setName}</span>
        <div className="match-hud">
          <span className="match-stat">
            <span className="match-stat-label">Time</span>
            <span className="match-stat-val">{fmt(elapsed)}</span>
          </span>
          <span className="match-stat">
            <span className="match-stat-label">Pairs</span>
            <span className="match-stat-val">
              {matched}/{roundPairs}
            </span>
          </span>
          <span className="match-stat">
            <span className="match-stat-label">Misses</span>
            <span className="match-stat-val">{mistakes}</span>
          </span>
          {best != null && (
            <span className="match-stat">
              <span className="match-stat-label">Best</span>
              <span className="match-stat-val">{fmt(best)}</span>
            </span>
          )}
        </div>
        <button className="btn" onClick={() => startRound(setId)}>
          Shuffle
        </button>
      </div>

      <div className="match-grid" style={{ '--accent': accent } as React.CSSProperties}>
        {tiles.map((t) => (
          <button
            key={t.key}
            className={`match-tile ${t.side} ${t.status}`}
            data-pid={t.pairId}
            onClick={() => onTile(t)}
            disabled={t.status === 'matched'}
          >
            {t.text}
          </button>
        ))}
      </div>

      {summary && (
        <div className="match-done-wrap">
          <div className="match-done" style={{ '--accent': accent } as React.CSSProperties}>
            <h2>Cleared it</h2>
            <div className="match-done-stats">
              <div className="mds">
                <span className="mds-val">{fmt(summary.ms)}</span>
                <span className="mds-label">your time</span>
              </div>
              <div className="mds">
                <span className="mds-val">{summary.mistakes}</span>
                <span className="mds-label">wrong taps</span>
              </div>
              <div className="mds">
                <span className="mds-val">
                  {Math.round((summary.pairs / (summary.pairs + summary.mistakes)) * 100)}%
                </span>
                <span className="mds-label">accuracy</span>
              </div>
            </div>
            <p className="match-done-best">
              {best != null && summary.ms <= best
                ? 'New best time for this set. Nice.'
                : best != null
                  ? `Best so far: ${fmt(best)}`
                  : ''}
            </p>
            <div className="match-done-btns">
              <button className="big-btn" onClick={() => startRound(setId)}>
                Play again
              </button>
              <button className="big-btn ghost" onClick={() => setSetId('')}>
                Pick another set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
