import { useMemo, useState, useEffect, useCallback } from 'react';
import { QUIZ } from '../quizData';
import type { QuizQuestion } from '../quizData';
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

export function QuizMode({ onResource }: { onResource: (conceptId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<Record<string, number>>({});

  const pool = useMemo(
    () => (filter === 'all' ? QUIZ : QUIZ.filter((q) => q.domain === filter)),
    [filter]
  );

  const start = useCallback(() => {
    setQueue(shuffle(pool));
    setPos(0);
    setRound(1);
    setPicked(null);
    setAnswered(0);
    setCorrect(0);
    setMissed({});
    setStarted(true);
  }, [pool]);

  const q = queue[pos];
  const isRight = picked !== null && q && picked === q.answer;

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    setAnswered((n) => n + 1);
    if (i === q.answer) {
      setCorrect((n) => n + 1);
    } else {
      setMissed((m) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }));
    }
  };

  const next = () => {
    setPicked(null);
    if (pos + 1 >= queue.length) {
      setQueue(shuffle(pool));
      setPos(0);
      setRound((r) => r + 1);
    } else {
      setPos((p) => p + 1);
    }
  };

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (!q) return;
      if (picked === null && ['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < q.choices.length) choose(idx);
      } else if (picked !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!started) {
    return (
      <div className="study study-quiz">
        <div className="study-intro">
          <h1>Practice Quiz</h1>
          <p className="study-lead">
            Exam-style multiple choice. Miss one and the lab points you to the demo that explains it.
            Keep quizzing or go watch it. The pool reshuffles forever, so drill as long as you like.
          </p>
          <div className="study-filter">
            <span className="study-filter-label">Pick a focus</span>
            <div className="chip-row">
              <button className={filter === 'all' ? 'fchip active' : 'fchip'} onClick={() => setFilter('all')}>
                All domains · {QUIZ.length} Q
              </button>
              {DOMAINS.map((d) => {
                const n = QUIZ.filter((x) => x.domain === d.id).length;
                return (
                  <button
                    key={d.id}
                    className={filter === d.id ? 'fchip active' : 'fchip'}
                    onClick={() => setFilter(d.id)}
                    style={{ '--accent': d.color } as React.CSSProperties}
                  >
                    {d.id} {d.name} · {n} Q
                  </button>
                );
              })}
            </div>
          </div>
          <button className="big-btn" onClick={start}>
            Start quizzing →
          </button>
          <p className="study-tip">Tip: press 1–4 to answer, Enter for the next question.</p>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const linkedConcept = q.conceptId ? conceptById(q.conceptId) : null;
  const missedList = Object.entries(missed).sort((a, b) => b[1] - a[1]);

  return (
    <div className="study study-quiz">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain" style={{ color: DOMAINS.find((d) => d.id === q.domain)?.color }}>
            {q.domain} {domainName(q.domain)}
          </span>
          <span className="qs-topic">· {q.topic}</span>
        </div>
        <div className="qs-right">
          <span className="qs-score">
            {correct}/{answered} correct · {accuracy}%
          </span>
          <span className="qs-round">round {round}</span>
          <button className="btn small" onClick={() => setStarted(false)}>
            Change focus
          </button>
        </div>
      </div>

      <div className="quiz-card">
        <div className="quiz-q">{q.question}</div>
        <div className="quiz-choices">
          {q.choices.map((c, i) => {
            let cls = 'quiz-choice';
            if (picked !== null) {
              if (i === q.answer) cls += ' right';
              else if (i === picked) cls += ' wrong';
              else cls += ' dim';
            }
            return (
              <button key={i} className={cls} disabled={picked !== null} onClick={() => choose(i)}>
                <span className="qc-key">{String.fromCharCode(65 + i)}</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className={isRight ? 'quiz-feedback ok' : 'quiz-feedback bad'}>
            <div className="qf-head">{isRight ? '✓ Correct' : '✗ Not quite'}</div>
            <p className="qf-text">{q.explanation}</p>
            <div className="qf-actions">
              {!isRight && linkedConcept && (
                <button className="big-btn ghost" onClick={() => onResource(q.conceptId!)}>
                  Review: {q.resourceLabel ?? `${linkedConcept.title} demo`} →
                </button>
              )}
              <button className="big-btn" onClick={next}>
                {isRight ? 'Next question →' : 'Keep quizzing →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {missedList.length > 0 && (
        <div className="quiz-weakspots">
          <span className="ws-label">Weak spots this session</span>
          <div className="chip-row">
            {missedList.map(([topic, count]) => (
              <span key={topic} className="ws-chip">
                {topic} <b>×{count}</b>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
