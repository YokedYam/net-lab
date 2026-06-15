import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVE_KEY = 'netlab.sessionTimer.active';

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// A true per-session timer. The user starts it; on a refresh or a return visit
// it restarts fresh from zero (the active flag persists, the elapsed time does
// not). Reset stops it and hides the readout again.
export function SessionTimer() {
  const startRef = useRef<number>(0);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(ACTIVE_KEY) === '1') {
      startRef.current = Date.now();
      setActive(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const tick = () => setElapsed(Date.now() - startRef.current);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setActive(true);
    localStorage.setItem(ACTIVE_KEY, '1');
  }, []);

  const reset = useCallback(() => {
    setActive(false);
    setElapsed(0);
    localStorage.setItem(ACTIVE_KEY, '0');
  }, []);

  if (!active) {
    return (
      <button className="btn session-start" onClick={start} title="Track your total time on the site this visit">
        <span className="session-clock" aria-hidden>&#9201;</span>
        Start timer
      </button>
    );
  }

  return (
    <div className="session-pill" title="Time on the site this visit. A refresh or return starts it fresh.">
      <span className="session-clock" aria-hidden>&#9201;</span>
      <span className="session-time">{fmt(elapsed)}</span>
      <button className="session-reset" onClick={reset} title="Stop and reset" aria-label="Stop and reset timer">
        &#8635;
      </button>
    </div>
  );
}
