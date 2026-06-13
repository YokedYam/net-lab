import { useEffect, useRef, useState } from 'react';
import type { Mission, MissionApi, MissionCtx } from '../missions';
import { MISSIONS } from '../missions';
import { SequenceDiagram } from './SequenceDiagram';

const DONE_KEY = 'netlab.missions.done';

export function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markDone(id: string) {
  try {
    const s = loadDone();
    s.add(id);
    localStorage.setItem(DONE_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

// ---------- mission picker ----------

const LEVEL_CLASS: Record<string, string> = {
  Beginner: 'lvl beg',
  Intermediate: 'lvl int',
  Advanced: 'lvl adv',
};

export function GuidedHome({ onStart }: { onStart: (id: string) => void }) {
  const [done, setDone] = useState<Set<string>>(() => loadDone());
  useEffect(() => setDone(loadDone()), []);

  // Group by category, preserving the order categories first appear (which is
  // also the order of rising difficulty).
  const cats: { name: string; items: { m: (typeof MISSIONS)[number]; n: number }[] }[] = [];
  MISSIONS.forEach((m, i) => {
    let c = cats.find((x) => x.name === m.category);
    if (!c) {
      c = { name: m.category, items: [] };
      cats.push(c);
    }
    c.items.push({ m, n: i + 1 });
  });

  const doneCount = MISSIONS.filter((m) => done.has(m.id)).length;

  return (
    <div className="guided-home">
      <div className="gh-head">
        <h2>Guided missions</h2>
        <p>
          Short, hands-on walkthroughs that build from the ground up. The screen dims, a spotlight
          lands on the one control you need, and it only moves on once you have actually done it.
          Learn the idea, then do it on the real canvas.
        </p>
        <div className="gh-progress">
          {doneCount} of {MISSIONS.length} complete
        </div>
      </div>
      {cats.map((c) => (
        <details key={c.name} className="gh-cat" open>
          <summary className="gh-cat-head">
            <span className="gh-cat-name">{c.name}</span>
            <span className="gh-cat-count">{c.items.length}</span>
          </summary>
          <div className="gh-grid">
            {c.items.map(({ m, n }) => (
              <button key={m.id} className="gh-card" onClick={() => onStart(m.id)}>
                <div className="gh-num">{String(n).padStart(2, '0')}</div>
                <div className="gh-body">
                  <div className="gh-title">
                    {m.title}
                    {done.has(m.id) && <span className="gh-check">✓ done</span>}
                  </div>
                  <div className="gh-sub">{m.subtitle}</div>
                  <div className="gh-meta">
                    <span className={LEVEL_CLASS[m.level] ?? 'lvl'}>{m.level}</span>
                    <span className="gh-min">~{m.minutes} min</span>
                  </div>
                </div>
                <div className="gh-go">Start ▸</div>
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------- the screen-darkening spotlight overlay ----------

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function GuidedOverlay({
  mission,
  stepIndex,
  ctx,
  api,
  onNext,
  onBack,
  onExit,
  onPractice,
}: {
  mission: Mission;
  stepIndex: number;
  ctx: MissionCtx;
  api: MissionApi;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  onPractice?: (pbqId: string) => void;
}) {
  const step = mission.steps[stepIndex];
  const total = mission.steps.length;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const startRef = useRef(ctx);
  const [passed, setPassed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  // Step entry: seed the canvas and snapshot the context for "did it change?" checks.
  useEffect(() => {
    setPassed(false);
    setShowHint(false);
    step.setup?.(api);
    startRef.current = ctxRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, mission.id]);

  // Latest onNext, so the celebration timer always calls the current one
  // without putting onNext in an effect's deps (its identity changes each render).
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  // Detect the moment the learner satisfies the step.
  useEffect(() => {
    if (passed || !step.check) return;
    if (step.check(ctx, startRef.current)) setPassed(true);
  }, [ctx, step, passed]);

  // After the green celebration, advance. Kept in its own effect (deps: [passed])
  // so re-renders from new ctx/onNext can't clear the pending timer.
  useEffect(() => {
    if (!passed) return;
    const t = window.setTimeout(() => onNextRef.current(), 1150);
    return () => clearTimeout(t);
  }, [passed]);

  // Track the spotlight target's position every frame so it follows pans/drags.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (step.target) {
        const el = document.querySelector(`[data-coach="${step.target}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        } else {
          setRect(null);
        }
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step.target]);

  const pad = 10;
  const hole: Rect | null = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const isTeach = !step.check;
  const dia = mission.diagram;
  const lastStep = stepIndex === total - 1;
  const pct = Math.round(((stepIndex + (passed ? 1 : 0)) / total) * 100);

  // Anchor the coach bubble beside the spotlight, on whichever side has room,
  // so the words sit right next to the thing you are meant to click.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  let side: 'right' | 'left' | 'top' | 'bottom' = 'bottom';
  let bx = vw / 2;
  let by = vh - 130;
  if (rect) {
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    if (right < vw * 0.34) {
      side = 'right';
      bx = right + 22;
      by = clamp(cy, 150, vh - 150);
    } else if (rect.left > vw * 0.6) {
      side = 'left';
      bx = rect.left - 22;
      by = clamp(cy, 150, vh - 150);
    } else if (cy < vh * 0.5) {
      side = 'bottom';
      bx = clamp(cx, 200, vw - 200);
      by = bottom + 22;
    } else {
      side = 'top';
      bx = clamp(cx, 200, vw - 200);
      by = rect.top - 22;
    }
  }

  const Bar = (
    <div className="coach-bar">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
  const stepN = (
    <span className="coach-stepn">
      Step {stepIndex + 1} of {total}
    </span>
  );

  return (
    <div className="coach-root">
      {dia ? (
        <>
          <div className="coach-soft" />
          <div className="coach-stage">
            <SequenceDiagram actors={dia.actors} messages={dia.messages} visible={step.reveal ?? 0} />
          </div>
        </>
      ) : hole ? (
        <div
          className={passed ? 'coach-hole pass' : 'coach-hole'}
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        >
          {passed && <span className="coach-tick">✓</span>}
        </div>
      ) : (
        <div className="coach-soft" />
      )}

      {isTeach ? (
        <div className={dia || step.place === 'bottom' ? 'coach-lesson dock-bottom' : 'coach-lesson'}>
          <div className="coach-eyebrow-row">
            <span className="coach-eyebrow">{mission.title}</span>
            {stepN}
          </div>
          {Bar}
          {!dia && <div className="coach-emoji">{lastStep ? '🎉' : '👋'}</div>}
          <h3 className="coach-h">{step.title}</h3>
          <p className="coach-p">{step.body}</p>
          <div className="coach-foot">
            <button className="btn small ghost" onClick={onExit}>
              Exit
            </button>
            <div className="coach-foot-r">
              {stepIndex > 0 && (
                <button className="btn small" onClick={onBack}>
                  ◂ Back
                </button>
              )}
              {lastStep && mission.pbq && onPractice && (
                <button
                  className="btn small accent"
                  onClick={() => {
                    markDone(mission.id);
                    onPractice(mission.pbq!);
                  }}
                >
                  Practice it (PBQ) ▸
                </button>
              )}
              <button className="btn small" onClick={onNext}>
                {lastStep ? 'Finish 🎉' : 'Got it, show me ▸'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`coach-bubble pos-${side}${passed ? ' pass' : ''}`} style={{ left: bx, top: by }}>
          <div className="coach-eyebrow-row">
            <span className={passed ? 'coach-tag done' : 'coach-tag'}>{passed ? 'Done ✓' : 'Your turn'}</span>
            {stepN}
            <button className="coach-x" onClick={onExit} aria-label="Exit mission">
              ✕
            </button>
          </div>
          {Bar}
          <h3 className="coach-h sm">{step.title}</h3>
          <p className="coach-p sm">{step.body}</p>
          {passed && step.done ? (
            <div className="coach-done">{step.done}</div>
          ) : showHint && step.hint ? (
            <div className="coach-hint">💡 {step.hint}</div>
          ) : null}
          {!passed && (
            <div className="coach-foot">
              <div className="coach-foot-l">
                {stepIndex > 0 && (
                  <button className="btn small" onClick={onBack} title="Back">
                    ◂
                  </button>
                )}
                {step.hint && (
                  <button className="btn small" onClick={() => setShowHint((v) => !v)}>
                    {showHint ? 'Hide hint' : 'Stuck?'}
                  </button>
                )}
              </div>
              <button className="btn small ghost" onClick={onNext} title="Skip this step">
                Skip ▸
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
