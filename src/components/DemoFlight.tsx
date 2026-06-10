import { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

// One-way labeled packet animation used by demo mode. Plays a dot (with an
// optional floating label) along a polyline, then bursts red if `fail`.
export function DemoFlight({
  points,
  color = '#fbbf24',
  label,
  fail = false,
  delay = 0,
  onDone,
}: {
  points: Point[];
  color?: string;
  label?: string;
  fail?: boolean;
  delay?: number;
  onDone: () => void;
}) {
  const [dot, setDot] = useState<Point | null>(null);
  const [burst, setBurst] = useState<Point | null>(null);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    const cum: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    }
    const total = cum[cum.length - 1];
    const speed = 270;
    let raf = 0;
    let t = -delay * 270;
    let last = performance.now();
    let finished = false;
    const timeouts: number[] = [];

    const posAt = (d: number): Point => {
      const dd = Math.min(Math.max(d, 0), total);
      let i = 1;
      while (i < cum.length && cum[i] < dd) i++;
      if (i >= cum.length) return points[points.length - 1];
      const len = cum[i] - cum[i - 1] || 1;
      const f = (dd - cum[i - 1]) / len;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * f,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * f,
      };
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt * speed;
      if (t >= 0) setDot(posAt(t));
      if (t >= total && !finished) {
        finished = true;
        setDot(null);
        if (fail) setBurst(points[points.length - 1]);
        timeouts.push(window.setTimeout(() => cb.current(), fail ? 900 : 150));
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
    };
  }, [points, fail, delay]);

  return (
    <g className="demo-flight">
      {dot && (
        <>
          <circle cx={dot.x} cy={dot.y} r={6} fill={color} style={{ filter: `drop-shadow(0 0 7px ${color})` }} />
          {label && (
            <text x={dot.x} y={dot.y - 14} textAnchor="middle" className="flight-label" fill={color}>
              {label}
            </text>
          )}
        </>
      )}
      {burst && <circle cx={burst.x} cy={burst.y} r={8} className="burst bad" />}
    </g>
  );
}
