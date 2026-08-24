import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

// Shared chrome that makes a PBQ look like the real CompTIA performance-based
// simulation instead of the rest of this site. Light page, thin title, blue
// Submit in the top right, a toolbar strip, and draggable blue-title windows.
// The exam does not use our dark theme, so neither do the drills built on this.

interface ShellProps {
  title: string;
  lead: string;
  sectionLabel: string;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onReset?: () => void;
  onShowQuestion?: () => void;
  questionOpen?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function ExamShell({
  title,
  lead,
  sectionLabel,
  onSubmit,
  submitLabel = 'Submit',
  submitDisabled,
  onReset,
  onShowQuestion,
  questionOpen,
  onBack,
  children,
}: ShellProps) {
  return (
    <div className="csim">
      <div className="csim-head">
        <div className="csim-head-text">
          <h1 className="csim-title">{title}</h1>
          <p className="csim-lead">{lead}</p>
        </div>
        <div className="csim-head-actions">
          {onBack && (
            <button className="csim-exit" onClick={onBack} title="Leave the simulation">
              Exit sim
            </button>
          )}
          {onSubmit && (
            <button className="csim-submit" onClick={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </button>
          )}
        </div>
      </div>

      <div className="csim-toolbar">
        <span className="csim-section">{sectionLabel}</span>
        <div className="csim-tools">
          {onShowQuestion && (
            <button className="csim-tool" onClick={onShowQuestion}>
              <span className="csim-tool-ico" aria-hidden="true">
                &#9636;
              </span>
              {questionOpen ? 'Hide Question' : 'Show Question'}
            </button>
          )}
          {onReset && (
            <button className="csim-tool" onClick={onReset}>
              <span className="csim-tool-ico" aria-hidden="true">
                &#8635;
              </span>
              Reset All Answers
            </button>
          )}
        </div>
      </div>

      <div className="csim-stage">{children}</div>
    </div>
  );
}

// The floating TEST QUESTION panel the real sim docks on the left.
export function ExamQuestionPanel({
  scenario,
  instructions,
  footNote,
  onClose,
}: {
  scenario: string[];
  instructions: string[];
  footNote?: string;
  onClose: () => void;
}) {
  return (
    <aside className="csim-qpanel">
      <div className="csim-qpanel-bar">
        <span className="csim-qpanel-ico" aria-hidden="true">
          &#9776;
        </span>
        <span className="csim-qpanel-name">TEST QUESTION</span>
        <button className="csim-qpanel-x" onClick={onClose} aria-label="Close the question panel">
          &#10005;
        </button>
      </div>
      <div className="csim-qpanel-body">
        {scenario.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <div className="csim-qpanel-sub">INSTRUCTIONS</div>
        {instructions.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {footNote && <p className="csim-qpanel-note">{footNote}</p>}
      </div>
    </aside>
  );
}

// A draggable window with the blue title bar the sim uses for every device.
export function ExamWindow({
  name,
  x,
  y,
  width,
  onClose,
  onFocus,
  z,
  children,
}: {
  name: string;
  x: number;
  y: number;
  width: number;
  onClose: () => void;
  onFocus?: () => void;
  z?: number;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ x, y });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onMove = useCallback((e: PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) });
  }, []);

  const onUp = useCallback(() => {
    drag.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onMove, onUp]);

  const startDrag = (e: React.PointerEvent) => {
    onFocus?.();
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };

  const style: CSSProperties = { left: pos.x, top: pos.y, width, zIndex: z ?? 40 };

  return (
    <div className="csim-win" style={style} onPointerDown={onFocus}>
      <div className="csim-win-bar" onPointerDown={startDrag}>
        <span className="csim-win-name">{name}</span>
        <button
          className="csim-win-x"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Close ${name}`}
        >
          &#10005;
        </button>
      </div>
      <div className="csim-win-body">{children}</div>
    </div>
  );
}

// The bootstrap-style tab strip the router window uses.
export function ExamTabs({
  tabs,
  active,
  onPick,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="csim-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={t.id === active ? 'csim-tab on' : 'csim-tab'}
          onClick={() => onPick(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Result strip shared by the sim-styled drills so grading looks consistent.
export function ExamScore({
  correct,
  total,
  passLabel,
  failLabel,
}: {
  correct: number;
  total: number;
  passLabel: string;
  failLabel: string;
}) {
  const pct = Math.round((correct / total) * 100);
  const perfect = correct === total;
  return (
    <div className={perfect ? 'csim-score perfect' : 'csim-score'}>
      <span className="csim-score-num">
        {correct}/{total}
      </span>
      <span className="csim-score-pct">{pct}%</span>
      <span className="csim-score-tag">{perfect ? passLabel : failLabel}</span>
    </div>
  );
}
