// A UML-style sequence (ladder) diagram: vertical lifelines per actor, time
// flowing down, diagonal arrows for each message. Protocol missions reveal one
// message per step, so a handshake builds up the way a real one unfolds.

export interface SeqActor {
  name: string;
}

export interface SeqMessage {
  from: number; // actor index
  to: number; // actor index
  label: string;
  sub?: string;
  color?: string;
}

export function SequenceDiagram({
  actors,
  messages,
  visible,
}: {
  actors: SeqActor[];
  messages: SeqMessage[];
  visible: number;
}) {
  const W = 780;
  const top = 16;
  const headerH = 40;
  const lifeTop = top + headerH + 10;
  const rowH = 64;
  const firstRow = lifeTop + 36;
  const H = firstRow + Math.max(1, messages.length) * rowH + 10;

  const n = Math.max(1, actors.length);
  const pad = 160;
  const xOf = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1));

  const shown = messages.slice(0, Math.max(0, visible));

  return (
    <svg className="seqdiag" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin meet">
      {actors.map((a, i) => (
        <g key={i}>
          <line x1={xOf(i)} y1={lifeTop} x2={xOf(i)} y2={H - 10} className="seq-life" />
          <rect x={xOf(i) - 72} y={top} width={144} height={headerH} rx={9} className="seq-actor" />
          <text x={xOf(i)} y={top + headerH / 2 + 5} className="seq-actor-t">
            {a.name}
          </text>
        </g>
      ))}

      {shown.map((m, i) => {
        const y = firstRow + i * rowH;
        const x1 = xOf(m.from);
        const x2 = xOf(m.to);
        const dir = x2 >= x1 ? 1 : -1;
        const ye = y + 13;
        const ah = 8;
        const xeLine = x2 - dir * ah;
        const color = m.color ?? '#93c5fd';
        const latest = i === shown.length - 1;
        const head = `M ${x2} ${ye} L ${xeLine} ${ye - 5} L ${xeLine} ${ye + 5} Z`;
        const midx = (x1 + x2) / 2;
        return (
          <g key={i} className={latest ? 'seq-msg latest' : 'seq-msg'}>
            <line x1={x1} y1={y} x2={xeLine} y2={ye} stroke={color} className="seq-arrow" />
            <path d={head} fill={color} />
            <text x={midx} y={y - 10} className="seq-label" fill={color}>
              {m.label}
            </text>
            {m.sub && (
              <text x={midx} y={ye + 20} className="seq-sub">
                {m.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
