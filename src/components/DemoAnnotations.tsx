import type { DemoNote } from '../concepts';

interface Pt {
  x: number;
  y: number;
}

// Callout cards pinned to devices during a demo step. Each one draws a leader
// line from the device to a small box, so the explanation lands on the diagram
// instead of only in the side caption. Pointer events are off so it never
// blocks panning the canvas.
export function DemoAnnotations({ notes, pos }: { notes: DemoNote[]; pos: Map<string, Pt> }) {
  const W = 200;
  const H = 84;
  const GAP = 58;

  return (
    <g className="demo-notes">
      {notes.map((n, i) => {
        const p = pos.get(n.at);
        if (!p) return null;
        const side = n.side ?? 'top';
        const color = n.color ?? '#5eead4';

        let bx = p.x - W / 2;
        let by = p.y - GAP - H;
        let tx = p.x;
        let ty = by + H;
        if (side === 'bottom') {
          bx = p.x - W / 2;
          by = p.y + GAP;
          tx = p.x;
          ty = by;
        } else if (side === 'left') {
          bx = p.x - GAP - W;
          by = p.y - H / 2;
          tx = bx + W;
          ty = p.y;
        } else if (side === 'right') {
          bx = p.x + GAP;
          by = p.y - H / 2;
          tx = bx;
          ty = p.y;
        }

        return (
          <g key={i} className="demo-note" style={{ animationDelay: `${i * 0.12}s` }}>
            <line className="demo-note-link" x1={p.x} y1={p.y} x2={tx} y2={ty} stroke={color} />
            <circle className="demo-note-dot" cx={p.x} cy={p.y} r={5} fill={color} />
            <foreignObject x={bx} y={by} width={W} height={H}>
              <div className="demo-note-box" style={{ borderColor: color }}>
                {n.text}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
