import { useState } from 'react';

// Troubleshooting console PBQ. Each ticket shows real command output across a
// few tabs; the student reads the symptoms, then names the fault and the fix
// from a shared pool of options. Graded deterministically with a per-ticket
// breakdown, same engine shape as the other PBQs.

interface Tab {
  name: string;
  lines: string[];
}

interface Ticket {
  id: string;
  who: string;
  tabs: Tab[];
  fault: string; // option id
  fix: string; // option id
  why: string;
}

interface Opt {
  id: string;
  text: string;
}

interface Part {
  id: string;
  label: string;
  faultOk: boolean;
  fixOk: boolean;
  yourFault: string;
  yourFix: string;
  correctFault: string;
  correctFix: string;
  why: string;
}

const FAULTS: Opt[] = [
  { id: 'f-apipa', text: 'DHCP failed, host self-assigned an APIPA address' },
  { id: 'f-dns', text: 'DNS name resolution is down' },
  { id: 'f-gw', text: 'Default gateway is outside the host subnet' },
  { id: 'f-dup', text: 'Duplicate IP address on the segment' },
  { id: 'f-link', text: 'Physical link is down (Layer 1)' },
];

const FIXES: Opt[] = [
  { id: 'x-renew', text: 'Repair DHCP, then release and renew the lease' },
  { id: 'x-dns', text: 'Point the host at a working DNS server' },
  { id: 'x-gw', text: 'Correct the gateway to match the host subnet' },
  { id: 'x-dup', text: 'Assign a unique IP or fix the DHCP reservation' },
  { id: 'x-link', text: 'Reseat or replace the cable, check the switch port' },
];

const TICKETS: Ticket[] = [
  {
    id: 't-apipa',
    who: 'Ticket 1: A Sales user says nothing loads. Their PC just finished booting.',
    tabs: [
      {
        name: 'ipconfig',
        lines: [
          'C:\\> ipconfig',
          '',
          'IPv4 Address. . . . . . : 169.254.88.21',
          'Subnet Mask . . . . . . : 255.255.0.0',
          'Default Gateway . . . . :',
        ],
      },
      {
        name: 'ping',
        lines: [
          'C:\\> ping 192.168.1.1',
          '',
          'Request timed out.',
          'Request timed out.',
        ],
      },
    ],
    fault: 'f-apipa',
    fix: 'x-renew',
    why: 'A 169.254.x.x address with a 255.255.0.0 mask and no gateway is APIPA: the client never got a DHCP lease. Repair DHCP, then release and renew.',
  },
  {
    id: 't-dns',
    who: 'Ticket 2: A user cannot open any site by name, but a coworker says the internet is fine.',
    tabs: [
      {
        name: 'ping IP',
        lines: ['C:\\> ping 8.8.8.8', '', 'Reply from 8.8.8.8: bytes=32 time=14ms TTL=115', 'Reply from 8.8.8.8: bytes=32 time=13ms TTL=115'],
      },
      {
        name: 'ping name',
        lines: ['C:\\> ping www.google.com', '', 'Ping request could not find host www.google.com.', 'Please check the name and try again.'],
      },
      {
        name: 'nslookup',
        lines: ['C:\\> nslookup www.google.com', '', 'DNS request timed out.', '    timeout was 2 seconds.', '*** Request to server timed-out'],
      },
    ],
    fault: 'f-dns',
    fix: 'x-dns',
    why: 'Pinging an IP works, but names fail and nslookup times out. That isolates the fault to DNS. Point the host at a reachable DNS server.',
  },
  {
    id: 't-gw',
    who: 'Ticket 3: A statically addressed workstation reaches machines on its own floor but nothing beyond the building.',
    tabs: [
      {
        name: 'ipconfig',
        lines: ['C:\\> ipconfig', '', 'IPv4 Address. . . . . . : 192.168.10.40', 'Subnet Mask . . . . . . : 255.255.255.0', 'Default Gateway . . . . : 192.168.20.1'],
      },
      {
        name: 'ping local',
        lines: ['C:\\> ping 192.168.10.7', '', 'Reply from 192.168.10.7: bytes=32 time<1ms TTL=128'],
      },
      {
        name: 'ping remote',
        lines: ['C:\\> ping 8.8.8.8', '', 'Reply from 192.168.10.40: Destination host unreachable.'],
      },
    ],
    fault: 'f-gw',
    fix: 'x-gw',
    why: 'Local traffic works, remote fails, and the gateway 192.168.20.1 is not inside the host 192.168.10.0/24 network. The host cannot reach its own gateway. Set the gateway to a 192.168.10.x address.',
  },
  {
    id: 't-dup',
    who: 'Ticket 4: Two users report intermittent drops that started right after a new device was plugged in.',
    tabs: [
      {
        name: 'system log',
        lines: ['Event 4199, Tcpip', '', 'Windows has detected an IP address conflict.', 'Another computer on this network has the same IP', 'address as this computer (192.168.1.50).'],
      },
      {
        name: 'ipconfig',
        lines: ['C:\\> ipconfig', '', 'IPv4 Address. . . . . . : 192.168.1.50 (Duplicate)', 'Subnet Mask . . . . . . : 255.255.255.0', 'Default Gateway . . . . : 192.168.1.1'],
      },
    ],
    fault: 'f-dup',
    fix: 'x-dup',
    why: 'The OS reports an address conflict: two hosts claim 192.168.1.50. Give the new device a unique address, or fix the DHCP scope or reservation so it stops handing out a used IP.',
  },
  {
    id: 't-link',
    who: 'Ticket 5: A workstation has no connectivity at all. The link light on the NIC is off.',
    tabs: [
      {
        name: 'ipconfig',
        lines: ['C:\\> ipconfig', '', 'Ethernet adapter Ethernet:', '', '   Media State . . . . . : Media disconnected'],
      },
      {
        name: 'ping',
        lines: ['C:\\> ping 192.168.1.1', '', 'PING: transmit failed. General failure.'],
      },
    ],
    fault: 'f-link',
    fix: 'x-link',
    why: '"Media disconnected" means Layer 1 is down: there is no link at all. Reseat or replace the cable and check the switch port before chasing anything higher up the stack.',
  },
];

const faultText = (id: string) => FAULTS.find((f) => f.id === id)?.text ?? '(none)';
const fixText = (id: string) => FIXES.find((f) => f.id === id)?.text ?? '(none)';

interface Answer {
  fault: string;
  fix: string;
}

function grade(answers: Record<string, Answer>): Part[] {
  return TICKETS.map((t) => {
    const a = answers[t.id] ?? { fault: '', fix: '' };
    return {
      id: t.id,
      label: t.who,
      faultOk: a.fault === t.fault,
      fixOk: a.fix === t.fix,
      yourFault: a.fault ? faultText(a.fault) : '(blank)',
      yourFix: a.fix ? fixText(a.fix) : '(blank)',
      correctFault: faultText(t.fault),
      correctFix: fixText(t.fix),
      why: t.why,
    };
  });
}

const allAnswered = (answers: Record<string, Answer>): boolean =>
  TICKETS.every((t) => answers[t.id]?.fault && answers[t.id]?.fix);

function TicketCard({
  ticket,
  answer,
  onChange,
  part,
}: {
  ticket: Ticket;
  answer: Answer;
  onChange: (a: Answer) => void;
  part: Part | null;
}) {
  const [tab, setTab] = useState(0);
  const locked = part !== null;
  const solved = part?.faultOk && part?.fixOk;

  return (
    <div className={`tshoot-ticket${locked ? (solved ? ' ok' : ' bad') : ''}`}>
      <div className="tshoot-who">
        {locked && <span className="tshoot-mark">{solved ? '✓' : '✗'}</span>}
        <span>{ticket.who}</span>
      </div>

      <div className="tshoot-term">
        <div className="tshoot-tabs">
          {ticket.tabs.map((t, i) => (
            <button key={t.name} className={i === tab ? 'active' : ''} onClick={() => setTab(i)}>
              {t.name}
            </button>
          ))}
        </div>
        <div className="tshoot-screen">
          {ticket.tabs[tab].lines.map((line, i) => (
            <span key={i}>{line || ' '}</span>
          ))}
        </div>
      </div>

      <div className="tshoot-selects">
        <label className={`tshoot-field${locked ? (part?.faultOk ? ' ok' : ' bad') : ''}`}>
          <span>What is the fault?</span>
          <select value={answer.fault} disabled={locked} onChange={(e) => onChange({ ...answer, fault: e.target.value })}>
            <option value="">Choose the fault…</option>
            {FAULTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.text}
              </option>
            ))}
          </select>
        </label>
        <label className={`tshoot-field${locked ? (part?.fixOk ? ' ok' : ' bad') : ''}`}>
          <span>What is the fix?</span>
          <select value={answer.fix} disabled={locked} onChange={(e) => onChange({ ...answer, fix: e.target.value })}>
            <option value="">Choose the fix…</option>
            {FIXES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.text}
              </option>
            ))}
          </select>
        </label>
      </div>

      {locked && !solved && (
        <div className="tshoot-correction">
          {!part?.faultOk && (
            <span>
              Fault: <b className="bad-text">{part?.yourFault}</b> · Correct: <b className="ok-text">{part?.correctFault}</b>
            </span>
          )}
          {!part?.fixOk && (
            <span>
              Fix: <b className="bad-text">{part?.yourFix}</b> · Correct: <b className="ok-text">{part?.correctFix}</b>
            </span>
          )}
          <span className="pbq-why">{ticket.why}</span>
        </div>
      )}
    </div>
  );
}

export function TshootConsoleDrill({ onBack }: { onBack?: () => void } = {}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;
  const solved = parts?.filter((p) => p.faultOk && p.fixOk).length ?? 0;
  const perfect = locked && solved === TICKETS.length;

  const reset = () => {
    setAnswers({});
    setParts(null);
  };

  const setAnswer = (id: string, a: Answer) => {
    setAnswers((cur) => ({ ...cur, [id]: a }));
  };

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Troubleshooting PBQ</span>
          <span className="qs-topic"> · read the console, name the fault</span>
        </div>
        <div className="qs-right">
          {!locked && (
            <button className="btn small" onClick={reset}>
              Reset
            </button>
          )}
          {onBack && (
            <button className="btn small" onClick={onBack}>
              ← All PBQs
            </button>
          )}
        </div>
      </div>

      <div className="pbq-card">
        <h2 className="pbq-title">Help desk: diagnose each ticket</h2>
        <p className="pbq-scenario">
          Each ticket gives you the command output for one host. Flip through the tabs, read the
          symptoms, then pick the single fault and the fix that resolves it. A ticket only counts if
          both are right.
        </p>

        <div className="tshoot-queue">
          {TICKETS.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              answer={answers[t.id] ?? { fault: '', fix: '' }}
              onChange={(a) => setAnswer(t.id, a)}
              part={parts?.find((p) => p.id === t.id) ?? null}
            />
          ))}
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(answers))} disabled={!allAnswered(answers)}>
              Submit &amp; grade →
            </button>
            {!allAnswered(answers) && <span className="pbq-submit-hint">Answer the fault and fix on every ticket to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {solved}/{TICKETS.length}
              </span>
              <span className="pbq-score-pct">{Math.round((solved / TICKETS.length) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'Every ticket closed' : 'Reopen the missed tickets'}</span>
            </div>

            <div className="pbq-insight">
              <span className="pbq-insight-tag">Insight</span>
              <p>
                The exam wants you to isolate the layer before you act. 169.254 means DHCP failed. IP
                works but names do not means DNS. Local works but remote fails means gateway or routing.
                An OS conflict message means a duplicate IP. "Media disconnected" means Layer 1 is down,
                so you check the cable first and never start at the top of the stack.
              </p>
            </div>

            <div className="pbq-result-actions">
              <button className="big-btn" onClick={reset}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
