import { useEffect, useRef } from 'react';
import type { LogEntry } from '../model';

export function EventLog({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);
  return (
    <div className="panel eventlog">
      <div className="panel-title">
        Event log
        <button className="btn small" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="log" ref={ref}>
        {log.length === 0 && <div className="muted">Quiet in here… try pinging something.</div>}
        {log.map((e) => (
          <div key={e.id} className={`log-entry ${e.kind}`}>
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}
