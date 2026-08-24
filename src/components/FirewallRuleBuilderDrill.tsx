import { useMemo, useState } from 'react';
import { ExamShell, ExamQuestionPanel, ExamScore } from './ExamChrome';

// Firewall Rule Builder PBQ. The student is handed an empty rule table and a
// short list of business requirements, and has to write the rules themselves
// rather than flipping a permit or deny on rules somebody else wrote.
//
// Every cell is a dropdown, which is how the real performance-based items do
// it, so the whole thing grades in the browser with no free text parsing.

type Col = 'proto' | 'srcIp' | 'srcPort' | 'dstIp' | 'dstPort' | 'action';

interface Row {
  proto: string;
  srcIp: string;
  srcPort: string;
  dstIp: string;
  dstPort: string;
  action: string;
}

const BLANK: Row = { proto: '', srcIp: '', srcPort: '', dstIp: '', dstPort: '', action: '' };

const LAN = '30.1.2.100-200';
const STORAGE = '20.1.2.1';
const DB = '20.1.2.5';
const FTP = '20.1.2.9';

const OPTIONS: Record<Col, string[]> = {
  proto: ['SMB', 'SQL', 'FTP', 'RDP', 'SSH', 'HTTPS', 'SNMP', 'Any'],
  srcIp: [LAN, STORAGE, DB, FTP, '40.1.2.1', 'Any'],
  srcPort: ['Any', '445', '1433', '20-21', '3389', '22'],
  dstIp: [LAN, STORAGE, DB, FTP, '40.1.2.1', 'Any'],
  dstPort: ['445', '1433', '20-21', '3389', '22', '443', '161', 'Any'],
  action: ['Allow', 'Deny'],
};

const HEADS: { col: Col; label: string }[] = [
  { col: 'proto', label: 'Protocol' },
  { col: 'srcIp', label: 'Source IP' },
  { col: 'srcPort', label: 'Source Port' },
  { col: 'dstIp', label: 'Destination IP' },
  { col: 'dstPort', label: 'Destination Port' },
  { col: 'action', label: 'Action' },
];

interface Want {
  id: string;
  label: string;
  row: Row;
  why: string;
}

// The three permits can be written in any order. The cleanup rule has to sit
// last, because a deny any placed above a permit swallows it.
const WANTS: Want[] = [
  {
    id: 'storage',
    label: 'LAN hosts reach the storage server',
    row: { proto: 'SMB', srcIp: LAN, srcPort: 'Any', dstIp: STORAGE, dstPort: '445', action: 'Allow' },
    why: 'Server Message Block is the file sharing protocol and it listens on TCP 445. The client picks a random high source port, so source port is Any. Only the destination port is pinned, and only to the storage server.',
  },
  {
    id: 'db',
    label: 'LAN hosts reach the database server',
    row: { proto: 'SQL', srcIp: LAN, srcPort: 'Any', dstIp: DB, dstPort: '1433', action: 'Allow' },
    why: 'Microsoft SQL Server listens on TCP 1433. Same shape as the storage rule: named source range, Any source port, one destination host, one destination port.',
  },
  {
    id: 'ftp',
    label: 'The FTP server is reachable from the wide area network',
    row: { proto: 'FTP', srcIp: 'Any', srcPort: 'Any', dstIp: FTP, dstPort: '20-21', action: 'Allow' },
    why: 'This one is opened to the whole internet, so the source is Any. File Transfer Protocol uses 21 for control and 20 for data, so the destination port is the 20-21 range.',
  },
];

const CLEANUP: Row = { proto: 'Any', srcIp: 'Any', srcPort: 'Any', dstIp: 'Any', dstPort: 'Any', action: 'Deny' };

const SCENARIO = [
  'Company B keeps its storage, database and FTP servers behind a firewall. The workstations sit on their own subnet on the other side of it.',
  'You have been asked to write the firewall rule set from scratch. The firewall reads the table from the top down and the first rule that matches wins.',
];

const INSTRUCTIONS = [
  'Rule 1: allow the LAN hosts to reach the storage server and the database server from outside their subnet.',
  'Rule 2: allow the FTP server to be reached from the wide area network.',
  'Rule 3: deny all other traffic.',
  'Use the dropdowns to fill in each cell. The three permit rules can go in any order, but the cleanup rule has to be last.',
];

const FOOT = 'Think about which side picks the port. Clients use a random high port; servers listen on the well known one.';

function sameRow(a: Row, b: Row): boolean {
  return HEADS.every((h) => a[h.col] === b[h.col]);
}

interface Part {
  id: string;
  label: string;
  ok: boolean;
  your: string;
  correct: string;
  why: string;
}

const fmt = (r: Row): string =>
  HEADS.map((h) => r[h.col] || '(blank)').join(' | ');

export function FirewallRuleBuilderDrill({ onBack }: { onBack?: () => void } = {}) {
  const [rows, setRows] = useState<Row[]>([{ ...BLANK }, { ...BLANK }, { ...BLANK }, { ...BLANK }]);
  const [showQ, setShowQ] = useState(true);
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;

  const set = (i: number, col: Col, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [col]: value } : r)));

  const filled = useMemo(() => rows.every((r) => HEADS.every((h) => r[h.col])), [rows]);

  const reset = () => {
    setRows([{ ...BLANK }, { ...BLANK }, { ...BLANK }, { ...BLANK }]);
    setParts(null);
  };

  const submit = () => {
    const permitRows = rows.slice(0, 3);
    const next: Part[] = WANTS.map((w) => {
      const hit = permitRows.find((r) => sameRow(r, w.row));
      return {
        id: w.id,
        label: w.label,
        ok: Boolean(hit),
        your: hit ? fmt(hit) : 'no rule in the first three lines matches this requirement',
        correct: fmt(w.row),
        why: w.why,
      };
    });
    const last = rows[3];
    next.push({
      id: 'cleanup',
      label: 'The last rule denies everything else',
      ok: sameRow(last, CLEANUP),
      your: fmt(last),
      correct: fmt(CLEANUP),
      why: 'A deny any any at the bottom is the cleanup rule. Firewalls already end in an implicit deny, but writing it out makes the intent obvious and gives you something to log against. Put it anywhere above a permit and it swallows that permit, because the first match wins.',
    });
    setParts(next);
  };

  const correct = parts?.filter((p) => p.ok).length ?? 0;

  return (
    <ExamShell
      title="Firewall Rule Builder Simulation"
      lead="Read the question carefully, follow the instructions, and then click the submit button when you have finished. You will receive a numeric score once you have submitted a response."
      sectionLabel="Network Diagram for Company B"
      onSubmit={locked ? undefined : submit}
      submitDisabled={!filled}
      onReset={reset}
      onShowQuestion={() => setShowQ((v) => !v)}
      questionOpen={showQ}
      onBack={onBack}
    >
      <div className="csim-work frb-work">
        {showQ && <ExamQuestionPanel scenario={SCENARIO} instructions={INSTRUCTIONS} footNote={FOOT} onClose={() => setShowQ(false)} />}

        <div className="frb-main">
          <div className="frb-diagram">
            <svg viewBox="0 0 620 210" className="frb-svg" role="img" aria-label="Company B network: hosts and internet on the left, firewall in the middle, servers on the right">
              <rect x="8" y="14" width="150" height="82" rx="8" fill="#eef7fd" stroke="#bcdcef" />
              <text x="83" y="30" className="frb-zone" textAnchor="middle">INTERNET</text>
              <ellipse cx="52" cy="62" rx="30" ry="17" fill="#fff" stroke="#9ab4c6" />
              <text x="52" y="66" className="frb-mini" textAnchor="middle">WAN</text>
              <rect x="96" y="48" width="46" height="26" rx="4" fill="#4a5a6a" />
              <text x="119" y="88" className="frb-mini" textAnchor="middle">Router_1</text>
              <text x="119" y="99" className="frb-mini dim" textAnchor="middle">40.1.2.1</text>

              <rect x="8" y="112" width="150" height="86" rx="8" fill="#eefaf3" stroke="#bfe6d2" />
              <text x="83" y="128" className="frb-zone" textAnchor="middle">HOSTS</text>
              <rect x="28" y="140" width="42" height="28" rx="3" fill="#4a5a6a" />
              <rect x="96" y="140" width="42" height="28" rx="3" fill="#4a5a6a" />
              <text x="49" y="182" className="frb-mini" textAnchor="middle">PC_1</text>
              <text x="49" y="193" className="frb-mini dim" textAnchor="middle">30.1.2.100</text>
              <text x="117" y="182" className="frb-mini" textAnchor="middle">PC_2</text>
              <text x="117" y="193" className="frb-mini dim" textAnchor="middle">30.1.2.200</text>

              <path d="M158 62 L206 62 M158 154 L206 154 L206 62" fill="none" stroke="#8ec9e8" strokeWidth="2" />

              <g transform="translate(206 40)">
                <rect x="0" y="0" width="54" height="128" rx="4" fill="#e8613c" />
                {Array.from({ length: 8 }, (_, r) =>
                  Array.from({ length: 3 }, (_, c) => (
                    <rect key={`${r}-${c}`} x={2 + c * 18 + (r % 2 ? 9 : 0)} y={2 + r * 16} width="16" height="14" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.4" />
                  ))
                )}
                <text x="27" y="146" className="frb-mini" textAnchor="middle">Firewall</text>
              </g>

              <path d="M260 104 L306 104" fill="none" stroke="#8ec9e8" strokeWidth="2" />

              <rect x="306" y="14" width="300" height="184" rx="8" fill="#fdeef2" stroke="#f0c2ce" />
              <text x="456" y="32" className="frb-zone" textAnchor="middle">SERVERS</text>
              {[
                { y: 44, name: 'Storage Server', ip: STORAGE },
                { y: 100, name: 'Database Server', ip: DB },
                { y: 156, name: 'FTP Server', ip: FTP },
              ].map((s) => (
                <g key={s.ip}>
                  <path d={`M306 104 L346 ${s.y + 16}`} fill="none" stroke="#8ec9e8" strokeWidth="2" />
                  <rect x="346" y={s.y} width="30" height="34" rx="3" fill="#4a5a6a" />
                  <rect x="350" y={s.y + 5} width="22" height="5" rx="1" fill="#6b7b8b" />
                  <rect x="350" y={s.y + 14} width="22" height="5" rx="1" fill="#6b7b8b" />
                  <rect x="350" y={s.y + 23} width="22" height="5" rx="1" fill="#6b7b8b" />
                  <text x="386" y={s.y + 15} className="frb-mini">{s.name}</text>
                  <text x="386" y={s.y + 28} className="frb-mini dim">{s.ip}</text>
                </g>
              ))}
            </svg>
          </div>

          <div className="frb-table">
            <div className="frb-row frb-head">
              <span>#</span>
              {HEADS.map((h) => (
                <span key={h.col}>{h.label}</span>
              ))}
            </div>
            {rows.map((row, i) => (
              <div className="frb-row" key={i}>
                <span className="frb-num">{i + 1}</span>
                {HEADS.map((h) => (
                  <select
                    key={h.col}
                    value={row[h.col]}
                    disabled={locked}
                    onChange={(e) => set(i, h.col, e.target.value)}
                    aria-label={`Rule ${i + 1} ${h.label}`}
                  >
                    <option value="">...</option>
                    {OPTIONS[h.col].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            ))}
            {!filled && !locked && <p className="frb-hint">Fill in every cell of all four rules to submit.</p>}
          </div>
        </div>
      </div>

      {locked && parts && (
        <div className="csim-results">
          <ExamScore correct={correct} total={parts.length} passLabel="Rule set is tight" failLabel="Review the rules below" />
          <div className="csim-insight">
            <span className="csim-insight-tag">The takeaway</span>
            <p>
              Two habits carry every firewall question. Pin the destination port to the service and leave the source port as
              Any, because the client picks a random high port and hard coding it breaks the rule. Then keep the deny any at
              the bottom, since first match wins and a broad deny placed too high quietly kills every permit under it.
            </p>
          </div>
          <div className="csim-parts">
            {parts.map((p) => (
              <div className={p.ok ? 'csim-part ok' : 'csim-part bad'} key={p.id}>
                <div className="csim-part-head">
                  <span className="csim-part-mark">{p.ok ? '✓' : '✗'}</span>
                  <span>{p.label}</span>
                </div>
                {!p.ok && (
                  <div className="csim-part-diff">
                    <span>
                      You wrote: <b className="bad-text">{p.your}</b>
                    </span>
                    <span>
                      Correct: <b className="ok-text">{p.correct}</b>
                    </span>
                  </div>
                )}
                <p className="csim-part-why">{p.why}</p>
              </div>
            ))}
          </div>
          <div className="csim-result-actions">
            <button className="csim-submit" onClick={reset}>
              Try again
            </button>
            {onBack && (
              <button className="csim-exit" onClick={onBack}>
                All PBQs
              </button>
            )}
          </div>
        </div>
      )}
    </ExamShell>
  );
}
