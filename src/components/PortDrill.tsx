import { useMemo, useState } from 'react';
import { PROTOCOLS } from '../portDrillData';
import type { Protocol } from '../portDrillData';

type DrillMode = 'guided' | 'hard';
type Phase = 'main' | 'review' | 'done';

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
  const [phase, setPhase] = useState<Phase>('main');

  // Main round
  const [order, setOrder] = useState<number[]>(() => shuffle(PROTOCOLS.map((_, i) => i)));
  const [pos, setPos] = useState(0);

  // Review round
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [reviewPos, setReviewPos] = useState(0);

  // Session tracking
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [hinted, setHinted] = useState<Set<number>>(new Set());

  // Current card
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [grade, setGrade] = useState<FieldGrade | null>(null);
  const [hintShown, setHintShown] = useState(false);

  // Reset confirm
  const [confirmReset, setConfirmReset] = useState(false);

  const currentIndex = phase === 'review' ? reviewQueue[reviewPos] : order[pos];
  const protocol = phase === 'done' ? null : PROTOCOLS[currentIndex];

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
    setOrder(shuffle(PROTOCOLS.map((_, i) => i)));
    setPos(0);
    setReviewQueue([]);
    setReviewPos(0);
    setPhase('main');
    setMissed(new Set());
    setHinted(new Set());
    setAnswers(EMPTY);
    setGrade(null);
    setHintShown(false);
    setConfirmReset(false);
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
    const isWrong = !Object.values(g).every(Boolean);
    if (phase === 'main' && isWrong) {
      setMissed((prev) => new Set([...prev, currentIndex]));
    }
  };

  const handleNext = () => {
    const isCorrect = grade !== null && Object.values(grade).every(Boolean);

    if (phase === 'main') {
      const nextPos = pos + 1;
      if (nextPos >= TOTAL) {
        setAnswers(EMPTY);
        setGrade(null);
        setHintShown(false);
        setPos(nextPos);
        if (missed.size > 0) {
          setReviewQueue(shuffle([...missed]));
          setReviewPos(0);
          setPhase('review');
        } else {
          setPhase('done');
        }
        return;
      }
      setPos(nextPos);
      setAnswers(EMPTY);
      setGrade(null);
      setHintShown(false);
      return;
    }

    if (phase === 'review') {
      const newQueue = [...reviewQueue];
      let newPos = reviewPos;

      if (isCorrect) {
        newQueue.splice(reviewPos, 1);
        if (newQueue.length === 0) {
          setReviewQueue([]);
          setPhase('done');
          setAnswers(EMPTY);
          setGrade(null);
          setHintShown(false);
          return;
        }
        newPos = reviewPos >= newQueue.length ? 0 : reviewPos;
      } else {
        newPos = (reviewPos + 1) % newQueue.length;
      }

      setReviewQueue(newQueue);
      setReviewPos(newPos);
      setAnswers(EMPTY);
      setGrade(null);
      setHintShown(false);
    }
  };

  if (phase === 'done') {
    const firstAttemptCorrect = TOTAL - missed.size;
    return (
      <div className="study">
        <div className="drill-done">
          <h2>Session complete</h2>
          <div className="drill-done-stats">
            <div className="drill-done-stat">
              <span className="drill-done-val">{firstAttemptCorrect}/{TOTAL}</span>
              <span className="drill-done-label">first attempt</span>
            </div>
            {missed.size > 0 && (
              <div className="drill-done-stat">
                <span className="drill-done-val">{missed.size}</span>
                <span className="drill-done-label">needed review</span>
              </div>
            )}
            {hinted.size > 0 && (
              <div className="drill-done-stat">
                <span className="drill-done-val">{hinted.size}</span>
                <span className="drill-done-label">used a hint</span>
              </div>
            )}
          </div>
          {missed.size === 0 ? (
            <p>Clean sweep. No protocols needed a second look.</p>
          ) : (
            <p>
              You cleared all {missed.size} missed {missed.size === 1 ? 'protocol' : 'protocols'} in review.
              Come back in Hard mode to lock them in without the options.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="big-btn" onClick={resetSession}>
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

  const isLastMain = phase === 'main' && pos === TOTAL - 1;
  const progressLabel =
    phase === 'review'
      ? `Review: ${reviewQueue.length} remaining`
      : `${pos}/${TOTAL} completed`;

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
                {isLastMain ? 'Finish' : 'Next →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
