import { useMemo, useState, useEffect, useCallback } from 'react';
import { EASY_QUIZ, MEDIUM_QUIZ } from '../quizData';
import type { QuizDifficulty, QuizQuestion } from '../quizData';
import { DOMAINS, domainName } from '../study';
import type { DomainId } from '../study';
import { conceptById } from '../concepts';
import { generateSimilarQuestion } from '../ai';
import { AcronymHelp, acronymsInText } from './AcronymHelp';
import { ExamSim } from './ExamSim';

type Filter = DomainId | 'all';
type DifficultyOption = {
  id: QuizDifficulty;
  title: string;
  eyebrow: string;
  copy: string;
};

const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'easy',
    title: 'Easy',
    eyebrow: 'Vocab warm-up',
    copy: 'Definitions, true or false, and quick concept checks. Use this before the scenario pool.',
  },
  {
    id: 'medium',
    title: 'Medium',
    eyebrow: 'Scenario practice',
    copy: 'The existing exam-style bank. Best-answer questions with longer explanations.',
  },
];

const bankFor = (difficulty: QuizDifficulty) => (difficulty === 'easy' ? EASY_QUIZ : MEDIUM_QUIZ);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizMode({ onResource }: { onResource: (conceptId: string) => void }) {
  const [examOpen, setExamOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('easy');
  const [filter, setFilter] = useState<Filter>('all');
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<Record<string, number>>({});
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState('');

  const pool = useMemo(
    () => {
      const bank = bankFor(difficulty);
      return filter === 'all' ? bank : bank.filter((q) => q.domain === filter);
    },
    [difficulty, filter]
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
  const acronymItems = useMemo(() => {
    if (!q) return [];
    return acronymsInText([
      q.topic,
      q.question,
      ...q.choices,
      ...(picked !== null ? [q.explanation] : []),
    ]);
  }, [picked, q]);

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
    setGenErr('');
    if (pos + 1 >= queue.length) {
      setQueue(shuffle(pool));
      setPos(0);
      setRound((r) => r + 1);
    } else {
      setPos((p) => p + 1);
    }
  };

  // Strictly button-triggered: writes one new question similar to the current
  // one and queues it next, so "extra practice" is always an explicit ask.
  const genSimilar = async () => {
    if (!q || genBusy) return;
    setGenBusy(true);
    setGenErr('');
    const res = await generateSimilarQuestion(q);
    setGenBusy(false);
    if (!res.ok) {
      setGenErr(res.message);
      return;
    }
    setQueue((prev) => [...prev.slice(0, pos + 1), res.value, ...prev.slice(pos + 1)]);
    setPicked(null);
    setPos((p) => p + 1);
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

  if (examOpen) {
    return <ExamSim onExit={() => setExamOpen(false)} />;
  }

  if (!started) {
    return (
      <div className="study study-quiz">
        <div className="study-intro">
          <h1>Practice Quiz</h1>
          <p className="study-lead">
            Start with recall, then move into scenario practice. Miss one and the lab points you to
            the demo that explains it.
          </p>
          <div className="quiz-mode-grid" aria-label="Pick a quiz difficulty">
            {DIFFICULTIES.map((d) => {
              const bank = bankFor(d.id);
              return (
                <button
                  key={d.id}
                  className={difficulty === d.id ? 'quiz-mode-card active' : 'quiz-mode-card'}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className="mode-eyebrow">{d.eyebrow}</span>
                  <span className="mode-title">{d.title}</span>
                  <span className="mode-copy">{d.copy}</span>
                  <span className="mode-count">{bank.length} questions</span>
                </button>
              );
            })}
          </div>
          <button className="quiz-exam-card" onClick={() => setExamOpen(true)}>
            <span className="mode-eyebrow">Timed review</span>
            <span className="mode-title">Exam Sim</span>
            <span className="mode-copy">
              65 harder questions, 90 minutes, no hints, no instant feedback. Review the misses at
              the end.
            </span>
            <span className="mode-count">150-question bank</span>
          </button>
          <div className="study-filter">
            <span className="study-filter-label">Pick a focus</span>
            <div className="chip-row">
              <button className={filter === 'all' ? 'fchip active' : 'fchip'} onClick={() => setFilter('all')}>
                All domains · {bankFor(difficulty).length} Q
              </button>
              {DOMAINS.map((d) => {
                const n = bankFor(difficulty).filter((x) => x.domain === d.id).length;
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
  const qDifficulty = q.difficulty ?? 'medium';

  return (
    <div className="study study-quiz">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain" style={{ color: DOMAINS.find((d) => d.id === q.domain)?.color }}>
            {q.domain} {domainName(q.domain)}
          </span>
          <span className="qs-topic">· {q.topic}</span>
          <span className={`qs-difficulty ${qDifficulty}`}>{qDifficulty}</span>
          {q.ai && <span className="qs-ai">AI generated</span>}
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
        <AcronymHelp items={acronymItems} />
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
              <button className="big-btn ghost" onClick={genSimilar} disabled={genBusy}>
                {genBusy ? 'Writing a question…' : 'Generate a similar question'}
              </button>
              <button className="big-btn" onClick={next}>
                {isRight ? 'Next question →' : 'Keep quizzing →'}
              </button>
            </div>
            {genErr && <p className="gen-err">{genErr}</p>}
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
