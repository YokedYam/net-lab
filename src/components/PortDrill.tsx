import { useMemo, useState } from 'react';
import { PROTOCOLS } from '../portDrillData';
import type { Protocol } from '../portDrillData';

type DrillMode = 'guided' | 'hard';
type Phase = 'card' | 'roundEnd';

// Rounds work the way a flashcard app works. You get a small batch, anything
// you miss comes straight back before you move on and again at the end of the
// round, and a protocol is only retired after two clean answers in a row. The
// batch grows as you stop missing things. Nothing is saved: refresh and you
// start the session over.
const ROUND_SIZES = [5, 8, 16];
// Get one right the first time and it is done. Miss it even once and you have
// to produce it correctly twice before it stops coming back.
const FIRST_TARGET = 1;
const RETRY_TARGET = 2;

const targetFor = (i: number, missed: Set<number>) => (missed.has(i) ? RETRY_TARGET : FIRST_TARGET);
const isLearned = (i: number, mastery: Record<number, number>, missed: Set<number>) =>
  (mastery[i] ?? 0) >= targetFor(i, missed);

interface Answers {
  fullName: string;
  description: string;
  port: string;
  transport: string;
}

interface FieldGrade {
  fullName: boolean;
  description: boolean;
  port: boolean;
  transport: boolean;
}

const EMPTY: Answers = { fullName: '', description: '', port: '', transport: '' };
const TOTAL = PROTOCOLS.length;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Weakest cards first: never answered right beats answered right once.
function buildRound(mastery: Record<number, number>, missed: Set<number>, size: number): number[] {
  const unlearned = PROTOCOLS.map((_, i) => i).filter((i) => !isLearned(i, mastery, missed));
  const cold = shuffle(unlearned.filter((i) => (mastery[i] ?? 0) === 0));
  const warm = shuffle(unlearned.filter((i) => (mastery[i] ?? 0) > 0));
  return shuffle([...cold, ...warm].slice(0, size));
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

function gradeFullName(answer: string, p: Protocol): boolean {
  const n = norm(answer);
  return n !== '' && p.fullNameAccept.some((a) => n === norm(a));
}

function gradePort(answer: string, p: Protocol): boolean {
  return answer.trim().toLowerCase().replace(/\s/g, '') === p.port.toLowerCase().replace(/\s/g, '');
}

function gradeTransport(answer: string, p: Protocol): boolean {
  return norm(answer) === norm(p.transport);
}

function gradeDescription(answer: string, p: Protocol): boolean {
  if (!answer.trim()) return false;
  const lower = answer.toLowerCase();
  return p.descKeywords.every((group) => group.some((kw) => lower.includes(kw)));
}

function gradeAll(mode: DrillMode, answers: Answers, p: Protocol): FieldGrade {
  if (mode === 'guided') {
    return {
      fullName: norm(answers.fullName) === norm(p.fullName),
      description: answers.description.trim() === p.description.trim(),
      port: gradePort(answers.port, p),
      transport: gradeTransport(answers.transport, p),
    };
  }
  return {
    fullName: gradeFullName(answers.fullName, p),
    description: gradeDescription(answers.description, p),
    port: gradePort(answers.port, p),
    transport: gradeTransport(answers.transport, p),
  };
}

function hintSentence(why: string): string {
  const dot = why.indexOf('. ');
  return dot >= 0 ? why.slice(0, dot + 1) : why;
}

export function PortDrill({ onBack }: { onBack?: () => void } = {}) {
  const [mode, setMode] = useState<DrillMode>('guided');
  const [phase, setPhase] = useState<Phase>('card');

  // The round in play
  const [roundNo, setRoundNo] = useState(1);
  const [tier, setTier] = useState(0);
  const [queue, setQueue] = useState<number[]>(() => buildRound({}, new Set(), ROUND_SIZES[0]));
  const [roundSize, setRoundSize] = useState(ROUND_SIZES[0]);
  const [qPos, setQPos] = useState(0);
  const [isRedo, setIsRedo] = useState(false);
  const [roundMissed, setRoundMissed] = useState<number[]>([]);

  // Session tracking. All in memory on purpose.
  const [mastery, setMastery] = useState<Record<number, number>>({});
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [hinted, setHinted] = useState<Set<number>>(new Set());

  // Current card
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [grade, setGrade] = useState<FieldGrade | null>(null);
  const [hintShown, setHintShown] = useState(false);

  // Reset confirm
  const [confirmReset, setConfirmReset] = useState(false);

  const currentIndex = queue[qPos];
  const protocol = phase === 'card' ? PROTOCOLS[currentIndex] : null;
  const masteredCount = PROTOCOLS.filter((_, i) => isLearned(i, mastery, missed)).length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const opts = useMemo(() => {
    if (!protocol) return null;
    const others = PROTOCOLS.filter((p) => p.abbr !== protocol.abbr);
    const pick = (pool: string[], correct: string, n: number) =>
      shuffle([correct, ...shuffle(pool.filter((v) => v !== correct)).slice(0, n)]);
    const allTransports = ['TCP', 'UDP', 'TCP and UDP'];
    return {
      fullNames: pick(others.map((p) => p.fullName), protocol.fullName, 3),
      descriptions: pick(others.map((p) => p.description), protocol.description, 3),
      ports: pick(others.map((p) => p.port), protocol.port, 3),
      transports: pick(allTransports.filter((t) => t !== protocol.transport), protocol.transport, 2),
    };
  }, [protocol?.abbr]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetSession = () => {
    setRoundNo(1);
    setTier(0);
    setQueue(buildRound({}, new Set(), ROUND_SIZES[0]));
    setRoundSize(ROUND_SIZES[0]);
    setQPos(0);
    setIsRedo(false);
    setRoundMissed([]);
    setPhase('card');
    setMastery({});
    setMissed(new Set());
    setHinted(new Set());
    setAnswers(EMPTY);
    setGrade(null);
    setHintShown(false);
    setConfirmReset(false);
  };

  const startNextRound = () => {
    const nextTier = roundMissed.length === 0 ? Math.min(tier + 1, ROUND_SIZES.length - 1) : tier;
    const next = buildRound(mastery, missed, ROUND_SIZES[nextTier]);
    setTier(nextTier);
    setQueue(next);
    setRoundSize(next.length);
    setQPos(0);
    setIsRedo(false);
    setRoundMissed([]);
    setRoundNo((r) => r + 1);
    setAnswers(EMPTY);
    setGrade(null);
    setHintShown(false);
    setPhase('card');
  };

  const switchMode = (m: DrillMode) => {
    setMode(m);
    setAnswers(EMPTY);
    setGrade(null);
    setHintShown(false);
  };

  const showHint = () => {
    setHintShown(true);
    setHinted((prev) => new Set([...prev, currentIndex]));
  };

  const setField =
    (field: keyof Answers) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setAnswers((a) => ({ ...a, [field]: e.target.value }));
    };

  const allFilled = Object.values(answers).every((v) => v.trim() !== '');

  const handleSubmit = () => {
    if (!protocol) return;
    const g = gradeAll(mode, answers, protocol);
    setGrade(g);
    if (!Object.values(g).every(Boolean)) {
      setMissed((prev) => new Set([...prev, currentIndex]));
      setMastery((m) => ({ ...m, [currentIndex]: 0 }));
      if (!isRedo && !roundMissed.includes(currentIndex)) {
        setRoundMissed((prev) => [...prev, currentIndex]);
      }
    }
  };

  const handleNext = () => {
    const isCorrect = grade !== null && Object.values(grade).every(Boolean);
    const idx = currentIndex;

    setAnswers(EMPTY);
    setGrade(null);
    setHintShown(false);

    // Miss it and you do that exact card again right now. Nothing else moves.
    if (!isCorrect) {
      setIsRedo(true);
      return;
    }

    let nextQueue = queue;
    if (isRedo) {
      // You needed a second go, so it comes back once more before the round ends.
      nextQueue = [...queue, idx];
      setQueue(nextQueue);
      setIsRedo(false);
    } else {
      setMastery((m) => ({ ...m, [idx]: Math.min((m[idx] ?? 0) + 1, RETRY_TARGET) }));
    }

    const nextPos = qPos + 1;
    if (nextPos >= nextQueue.length) {
      setPhase('roundEnd');
      return;
    }
    setQPos(nextPos);
  };

  if (phase === 'roundEnd') {
    const finished = masteredCount === PROTOCOLS.length;
    const clean = roundMissed.length === 0;
    const answered = roundSize;
    const nextSize = ROUND_SIZES[clean ? Math.min(tier + 1, ROUND_SIZES.length - 1) : tier];
    const remaining = PROTOCOLS.length - masteredCount;

    return (
      <div className="study">
        <div className="drill-done">
          <h2>{finished ? 'All 16 locked in' : `Round ${roundNo} done`}</h2>
          <div className="drill-done-stats">
            <div className="drill-done-stat">
              <span className="drill-done-val">
                {masteredCount}/{PROTOCOLS.length}
              </span>
              <span className="drill-done-label">locked in</span>
            </div>
            <div className="drill-done-stat">
              <span className="drill-done-val">
                {Math.max(0, answered - roundMissed.length)}/{answered}
              </span>
              <span className="drill-done-label">right first try</span>
            </div>
            {missed.size > 0 && (
              <div className="drill-done-stat">
                <span className="drill-done-val">{missed.size}</span>
                <span className="drill-done-label">missed at least once</span>
              </div>
            )}
            {hinted.size > 0 && (
              <div className="drill-done-stat">
                <span className="drill-done-val">{hinted.size}</span>
                <span className="drill-done-label">used a hint</span>
              </div>
            )}
          </div>

          <div className="drill-track">
            <div className="drill-track-fill" style={{ width: `${(masteredCount / PROTOCOLS.length) * 100}%` }} />
          </div>

          {finished ? (
            <p>
              Every protocol answered right twice in a row. Switch to Hard mode and run it again to prove you can
              produce them without the options in front of you.
            </p>
          ) : (
            <>
              {roundMissed.length > 0 ? (
                <>
                  <p>
                    You missed {roundMissed.length} {roundMissed.length === 1 ? 'protocol' : 'protocols'} in this round.
                    {roundMissed.length === 1 ? ' It came ' : ' They came '}back before the round ended, and anything
                    you miss has to come back right twice before it stops appearing.
                  </p>
                  <div className="drill-missed-chips">
                    {roundMissed.map((i) => (
                      <span className="drill-missed-chip" key={i}>
                        {PROTOCOLS[i].abbr}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  Clean round. The next batch steps up to {nextSize} {nextSize === PROTOCOLS.length ? '(the whole set)' : 'cards'}.
                </p>
              )}
              <p className="drill-remaining">
                {remaining} {remaining === 1 ? 'protocol' : 'protocols'} still to lock in.
              </p>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!finished && (
              <button className="big-btn" onClick={startNextRound}>
                Start round {roundNo + 1} &rarr;
              </button>
            )}
            <button className={finished ? 'big-btn' : 'big-btn ghost'} onClick={resetSession}>
              Start over
            </button>
            {onBack && (
              <button className="big-btn ghost" onClick={onBack}>
                Back to PBQs
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const locked = grade !== null;
  const anyWrong = grade !== null && !Object.values(grade).every(Boolean);

  const rowClass = (ok: boolean | undefined) =>
    ok === undefined ? 'match-row' : ok ? 'match-row ok' : 'match-row bad';

  const fields: { key: keyof Answers; label: string; fieldOpts: string[]; placeholder: string }[] = [
    { key: 'fullName', label: 'Full Name', fieldOpts: opts?.fullNames ?? [], placeholder: 'type from memory' },
    { key: 'description', label: 'What it does', fieldOpts: opts?.descriptions ?? [], placeholder: 'type from memory' },
    { key: 'port', label: 'Port', fieldOpts: opts?.ports ?? [], placeholder: 'port number(s)' },
    { key: 'transport', label: 'Transport', fieldOpts: opts?.transports ?? [], placeholder: 'TCP, UDP, or TCP and UDP' },
  ];

  const progressLabel = `Round ${roundNo} \u00b7 card ${qPos + 1} of ${queue.length} \u00b7 ${masteredCount}/${TOTAL} locked in`;

  return (
    <div className="study">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <div className="drill-mode-toggle">
            <button
              className={mode === 'guided' ? 'drill-mode-btn active' : 'drill-mode-btn'}
              onClick={() => switchMode('guided')}
            >
              Guided
            </button>
            <button
              className={mode === 'hard' ? 'drill-mode-btn active' : 'drill-mode-btn'}
              onClick={() => switchMode('hard')}
            >
              Hard
            </button>
          </div>
          {mode === 'hard' && (
            <span className="qs-topic" style={{ marginLeft: 8 }}>
              type from memory
            </span>
          )}
        </div>
        <div className="qs-right">
          <span className="drill-progress">{progressLabel}</span>
          {confirmReset ? (
            <span className="drill-confirm-reset">
              Reset session? All progress will be cleared.{' '}
              <button className="btn small accent" onClick={resetSession}>
                Confirm
              </button>
              <button className="btn small" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="btn small" onClick={() => setConfirmReset(true)}>
              Reset
            </button>
          )}
          {onBack && (
            <button className="btn small" onClick={onBack}>
              ← All PBQs
            </button>
          )}
        </div>
      </div>

      <div className="pbq-card">
        {isRedo && <div className="drill-redo">Second look. Answer it correctly to move on.</div>}
        <div className="drill-abbr">{protocol!.abbr}</div>

        <div className="match-rows">
          {fields.map(({ key, label, fieldOpts, placeholder }) => {
            const ok = grade ? grade[key] : undefined;
            return (
              <div className={rowClass(ok)} key={key}>
                <span className="match-prompt">{label}</span>
                {mode === 'guided' ? (
                  <select
                    className="match-select"
                    value={answers[key]}
                    disabled={locked}
                    onChange={setField(key)}
                  >
                    <option value="">Choose…</option>
                    {fieldOpts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="recall-input"
                    type="text"
                    value={answers[key]}
                    disabled={locked}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoComplete="off"
                    style={{ flex: 1 }}
                    onChange={setField(key)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {!locked && (
          <>
            {hintShown ? (
              <div className="drill-hint">{hintSentence(protocol!.why)}</div>
            ) : (
              <button className="btn small" style={{ marginTop: 12 }} onClick={showHint}>
                Show hint
              </button>
            )}
            <div className="pbq-submit">
              <button className="big-btn" onClick={handleSubmit} disabled={!allFilled}>
                Submit &amp; grade →
              </button>
              {!allFilled && <span className="pbq-submit-hint">Fill in every field to submit.</span>}
            </div>
          </>
        )}

        {locked && (
          <>
            {anyWrong && (
              <div className="drill-why">
                <span className="drill-why-label">Why</span>
                <p>{protocol!.why}</p>
              </div>
            )}
            {(mode === 'hard' || anyWrong) && (
              <>
                {mode === 'hard' && !anyWrong && (
                  <p className="drill-desc-hint">
                    Description graded on key words. Compare your answer to the model record below.
                  </p>
                )}
                <div className="drill-reveal">
                  <span className="drill-reveal-label">Full record</span>
                  <div className="drill-reveal-rows">
                    <div className="drill-reveal-row">
                      <span className="drill-reveal-key">Full Name</span>
                      <span className="drill-reveal-val">{protocol!.fullName}</span>
                    </div>
                    <div className="drill-reveal-row">
                      <span className="drill-reveal-key">What it does</span>
                      <span className="drill-reveal-val">{protocol!.description}</span>
                    </div>
                    <div className="drill-reveal-row">
                      <span className="drill-reveal-key">Port</span>
                      <span className="drill-reveal-val">{protocol!.port}</span>
                    </div>
                    <div className="drill-reveal-row">
                      <span className="drill-reveal-key">Transport</span>
                      <span className="drill-reveal-val">{protocol!.transport}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="pbq-submit" style={{ marginTop: 14 }}>
              <button className="big-btn" onClick={handleNext}>
                {anyWrong ? 'Try it again \u2192' : qPos + 1 >= queue.length ? 'End the round' : 'Next \u2192'}
              </button>
              {anyWrong && (
                <span className="pbq-submit-hint">
                  You answer this one again right now, and it comes back before the round ends.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
