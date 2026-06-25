import { useEffect, useMemo, useState } from 'react';
import { EXAM_BANK } from '../examData';
import type { QuizQuestion } from '../quizData';
import { DOMAINS, domainName } from '../study';
import { explainMissedExamQuestion } from '../ai';

const EXAM_SIZE = 65;
const PASSING_SCORE = 39;
const EXAM_SECONDS = 90 * 60;

type Phase = 'intro' | 'active' | 'results';
type AiNotes = Record<number, string>;
type AiErrors = Record<number, string>;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExamSim({ onExit }: { onExit?: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [aiNotes, setAiNotes] = useState<AiNotes>({});
  const [aiErrors, setAiErrors] = useState<AiErrors>({});
  const [aiBusy, setAiBusy] = useState<number | null>(null);

  const q = questions[pos];

  const startExam = () => {
    const next = shuffle(EXAM_BANK).slice(0, EXAM_SIZE);
    setQuestions(next);
    setAnswers(Array(next.length).fill(null));
    setPos(0);
    setSelected(null);
    setTimeLeft(EXAM_SECONDS);
    setAiNotes({});
    setAiErrors({});
    setAiBusy(null);
    setPhase('active');
  };

  const score = useMemo(
    () => questions.reduce((sum, item, i) => sum + (answers[i] === item.answer ? 1 : 0), 0),
    [answers, questions],
  );

  const breakdown = useMemo(
    () =>
      DOMAINS.map((d) => {
        const domainQs = questions
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => item.domain === d.id);
        const correct = domainQs.filter(({ item, i }) => answers[i] === item.answer).length;
        return { domain: d, correct, total: domainQs.length };
      }).filter((row) => row.total > 0),
    [answers, questions],
  );

  const missedByDomain = useMemo(
    () =>
      DOMAINS.map((d) => {
        const misses = questions
          .map((item, i) => ({ item, i, picked: answers[i] }))
          .filter(({ item, picked }) => item.domain === d.id && picked !== item.answer);
        return { domain: d, misses };
      }).filter((row) => row.misses.length > 0),
    [answers, questions],
  );

  useEffect(() => {
    if (phase !== 'active') return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const saveAndNext = () => {
    if (!q || selected === null) return;
    setAnswers((prev) => {
      const next = prev.slice();
      next[pos] = selected;
      return next;
    });
    setSelected(null);
    if (pos + 1 >= questions.length) {
      setPhase('results');
      return;
    }
    setPos((p) => p + 1);
  };

  const askAi = async (i: number) => {
    const item = questions[i];
    const picked = answers[i];
    if (!item || picked === item.answer || aiBusy !== null) return;
    setAiBusy(i);
    setAiErrors((prev) => ({ ...prev, [i]: '' }));
    const res = await explainMissedExamQuestion({
      question: item.question,
      correct: item.choices[item.answer],
      selected: picked === null ? 'No answer selected' : item.choices[picked],
      explanation: item.explanation,
    });
    setAiBusy(null);
    if (!res.ok) {
      setAiErrors((prev) => ({ ...prev, [i]: res.message }));
      return;
    }
    setAiNotes((prev) => ({ ...prev, [i]: res.value }));
  };

  if (phase === 'intro') {
    return (
      <div className="study exam-sim">
        <div className="study-intro exam-intro">
          <span className="exam-kicker">Simulated exam</span>
          <h1>Exam Sim</h1>
          <p className="study-lead">
            A timed 65-question run from the harder bank. No backtracking, hints, or instant
            feedback. Treat it like the real thing, then review the misses by domain.
          </p>
          <div className="exam-rules">
            <div><b>65</b><span>questions</span></div>
            <div><b>90:00</b><span>countdown</span></div>
            <div><b>{PASSING_SCORE}/65</b><span>practice pass line</span></div>
          </div>
          <div className="exam-intro-actions">
            <button className="big-btn" onClick={startExam}>
              Start Exam
            </button>
            {onExit && (
              <button className="big-btn ghost" onClick={onExit}>
                Back to Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const passed = score >= PASSING_SCORE;
    return (
      <div className="study exam-sim">
        <div className="exam-results">
          <span className={passed ? 'exam-result-pill pass' : 'exam-result-pill fail'}>
            {passed ? 'Pass' : 'Fail'}
          </span>
          <h1>{score} / {questions.length || EXAM_SIZE}</h1>
          <p>
            {passed
              ? 'You cleared the practice pass line. Now review the weak domains before trusting the score.'
              : 'Close the gaps before another full run. The domain breakdown is the study plan.'}
          </p>
          <div className="exam-domain-list">
            {breakdown.map((row) => (
              <div key={row.domain.id} className="exam-domain-row">
                <span className="exam-domain-name" style={{ color: row.domain.color }}>
                  {row.domain.id} {domainName(row.domain.id)}
                </span>
                <span className="exam-domain-score">
                  {row.correct}/{row.total}
                </span>
              </div>
            ))}
          </div>
          {missedByDomain.length > 0 && (
            <div className="exam-review">
              <h2>Missed questions by domain</h2>
              {missedByDomain.map((group) => (
                <section key={group.domain.id} className="exam-review-domain">
                  <h3 style={{ color: group.domain.color }}>
                    {group.domain.id} {domainName(group.domain.id)} · {group.misses.length} missed
                  </h3>
                  <div className="exam-miss-list">
                    {group.misses.map(({ item, i, picked }) => (
                      <article key={item.id} className="exam-miss-card">
                        <span className="exam-miss-topic">{item.topic}</span>
                        <p className="exam-miss-q">{item.question}</p>
                        <div className="exam-miss-answers">
                          <span>Your answer: <b>{picked === null ? 'No answer selected' : item.choices[picked]}</b></span>
                          <span>Correct answer: <b>{item.choices[item.answer]}</b></span>
                        </div>
                        <p className="exam-miss-explain">{item.explanation}</p>
                        <button className="big-btn ghost" onClick={() => askAi(i)} disabled={aiBusy !== null}>
                          {aiBusy === i ? 'Asking AI...' : 'Ask AI'}
                        </button>
                        {aiErrors[i] && <p className="gen-err">{aiErrors[i]}</p>}
                        {aiNotes[i] && <p className="exam-ai-text">{aiNotes[i]}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          <button className="big-btn" onClick={startExam}>
            Retake
          </button>
          {onExit && (
            <button className="big-btn ghost" onClick={onExit}>
              Back to Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="study exam-sim">
      <div className="exam-statusbar">
        <div>
          <span className="qs-domain" style={{ color: DOMAINS.find((d) => d.id === q.domain)?.color }}>
            {q.domain} {domainName(q.domain)}
          </span>
          <span className="qs-topic"> · {q.topic}</span>
        </div>
        <div className="exam-clock" aria-label="Time remaining">
          {formatTime(timeLeft)}
        </div>
        <div className="exam-progress">
          Question {pos + 1}/{questions.length}
        </div>
      </div>

      <div className="quiz-card exam-card">
        <div className="quiz-q">{q.question}</div>
        <div className="quiz-choices">
          {q.choices.map((choice, i) => {
            let cls = 'quiz-choice';
            if (selected === i) {
              cls += ' selected';
            }
            return (
              <button key={choice} className={cls} onClick={() => setSelected(i)}>
                <span className="qc-key">{String.fromCharCode(65 + i)}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        <div className="exam-actions">
          <button className="big-btn" disabled={selected === null} onClick={saveAndNext}>
            {pos + 1 >= questions.length ? 'Finish exam' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
