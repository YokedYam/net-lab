import { useEffect, useRef, useState } from 'react';
import type { PingPlan, PlanEvent } from '../model';

interface Point {
  x: number;
  y: number;
}

export function PacketFlight({
  plan,
  points,
  onLog,
  onDone,
}: {
  plan: PingPlan;
  points: Point[];
  onLog: (events: PlanEvent[]) => void;
  onDone: () => void;
}) {
  const [dot, setDot] = useState<{ x: number; y: number; reply: boolean } | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number; ok: boolean } | null>(null);
  const cb = useRef({ onLog, onDone });
  cb.current = { onLog, onDone };

  useEffect(() => {
    const pts = points.slice(0, plan.stopIndex + 1);
    const cum: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = cum[cum.length - 1];
    const speed = 290;
    const emitted = new Set<number>();
    const emit = (i: number) => {
      if (emitted.has(i)) return;
      emitted.add(i);
      const es = plan.eventsAt.get(i);
      if (es && es.length) cb.current.onLog(es);
    };

    const posAt = (d: number): Point => {
      const dd = Math.min(Math.max(d, 0), total);
      let i = 1;
      while (i < cum.length && cum[i] < dd) i++;
      if (i >= cum.length) return pts[pts.length - 1];
      const len = cum[i] - cum[i - 1] || 1;
      const f = (dd - cum[i - 1]) / len;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
      };
    };

    let mode: 'req' | 'wait' | 'reply' | 'done' = 'req';
    let t = 0;
    let waitLeft = 0.45;
    let raf = 0;
    let last = performance.now();
    const timeouts: number[] = [];

    emit(0);
    setDot({ ...pts[0], reply: false });

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (mode === 'req') {
        t += dt * speed;
        for (let i = 0; i < cum.length; i++) if (t >= cum[i]) emit(i);
        setDot({ ...posAt(t), reply: false });
        if (t >= total) {
          if (plan.outcome === 'blocked') {
            mode = 'done';
            setDot(null);
            setBurst({ ...pts[pts.length - 1], ok: false });
            cb.current.onLog(plan.finale);
            timeouts.push(window.setTimeout(() => cb.current.onDone(), 1300));
            return;
          }
          mode = 'wait';
        }
      } else if (mode === 'wait') {
        waitLeft -= dt;
        if (waitLeft <= 0) {
          mode = 'reply';
          t = 0;
        }
      } else if (mode === 'reply') {
        t += dt * speed;
        setDot({ ...posAt(total - t), reply: true });
        if (t >= total) {
          mode = 'done';
          setDot(null);
          setBurst({ ...pts[0], ok: true });
          cb.current.onLog(plan.finale);
          timeouts.push(window.setTimeout(() => cb.current.onDone(), 1100));
          return;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
    };
  }, [plan, points]);

  return (
    <g className="flight">
      {dot && <circle cx={dot.x} cy={dot.y} r={6} className={dot.reply ? 'packet reply' : 'packet'} />}
      {burst && (
        <circle cx={burst.x} cy={burst.y} r={8} className={burst.ok ? 'burst ok' : 'burst bad'} />
      )}
    </g>
  );
}
