import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ExamShell, ExamQuestionPanel, ExamWindow, ExamTabs, ExamScore } from './ExamChrome';
import {
  BASE_ACL,
  DNS_SERVER,
  DNS_TABLE,
  FAULT_RULE_ID,
  HOSTS,
  INTERFACES,
  OUTSIDE_SITE,
  evaluate,
  isIp,
} from './examConsoleData';
import type { AclRule, Host } from './examConsoleData';

// Network Troubleshooting simulation. Modelled on the CompTIA example
// simulation: a diagram you click, device windows you drag, a command prompt
// that actually parses what you type, and a router whose access control list
// drives every result on screen.

const SCENARIO = [
  'A network administrator reconfigured the router at Company A over the weekend to tighten security before an audit.',
  'On Monday morning the assistant on the second floor reports that nobody in the Executive Offices can reach any website. Both workstations show the same problem in the browser.',
  'The same users say internal email, the intranet site and printing to the local printer all still work normally.',
];

const INSTRUCTIONS = [
  'Check the IP configuration and connectivity on the workstations to decide whether the problem is on the client side or upstream.',
  'Open the router and review the Access Control List. Remove only the rule that is causing the reported outage by clicking the X beside it.',
  'The router implements an implicit deny, and rules are read from the top down.',
  'Reload the site in the workstation browser to confirm the issue is resolved, then click Submit.',
];

const FOOT = 'To put the simulation back the way you found it, click Reset All Answers.';

type WinKind = 'ws1' | 'ws2' | 'router';

interface TermLine {
  text: string;
  kind: 'cmd' | 'out';
}

interface Probes {
  ipconfig: boolean;
  reachOut: boolean;
  browserOk: boolean;
}

interface Part {
  id: string;
  label: string;
  ok: boolean;
  why: string;
}

// ------------------------------------------------------------------- icons

const ICON: Record<string, ReactElement> = {
  workstation: (
    <svg viewBox="0 0 40 44" width="30" height="33">
      <rect x="8" y="2" width="24" height="36" rx="2.5" fill="#4a5a6a" stroke="#33475b" strokeWidth="1.2" />
      <rect x="12" y="7" width="16" height="9" rx="1" fill="#9fd4ef" />
      <circle cx="15" cy="21" r="1.4" fill="#cfd8e0" />
      <circle cx="20" cy="21" r="1.4" fill="#cfd8e0" />
      <rect x="12" y="26" width="16" height="2" rx="1" fill="#7b8a99" />
      <rect x="12" y="30" width="16" height="2" rx="1" fill="#7b8a99" />
    </svg>
  ),
  router: (
    <svg viewBox="0 0 48 30" width="42" height="26">
      <ellipse cx="24" cy="9" rx="19" ry="5" fill="#5c6b7a" />
      <path d="M5 9v10c0 2.8 8.5 5 19 5s19-2.2 19-5V9" fill="#46545f" />
      <ellipse cx="24" cy="9" rx="19" ry="5" fill="none" stroke="#33475b" strokeWidth="1.1" />
      <path d="M15 9l-4-3m4 3l4-3M33 9l4 3m-4-3l-4 3" stroke="#dbe6ee" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  switch: (
    <svg viewBox="0 0 48 22" width="40" height="19">
      <rect x="2" y="4" width="44" height="14" rx="2" fill="#46545f" stroke="#33475b" strokeWidth="1.1" />
      <g fill="#9fd4ef">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={6 + i * 4.6} y={7} width="3" height="3" rx="0.5" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`b${i}`} x={6 + i * 4.6} y={12} width="3" height="3" rx="0.5" />
        ))}
      </g>
    </svg>
  ),
  server: (
    <svg viewBox="0 0 30 34" width="26" height="30">
      <rect x="3" y="2" width="24" height="30" rx="2" fill="#46545f" stroke="#33475b" strokeWidth="1.1" />
      {[6, 13, 20, 26].map((y) => (
        <g key={y}>
          <rect x="6" y={y} width="18" height="4.4" rx="1" fill="#5f6e7c" />
          <circle cx="21.5" cy={y + 2.2} r="1" fill="#8ee08e" />
        </g>
      ))}
    </svg>
  ),
  printer: (
    <svg viewBox="0 0 40 32" width="34" height="27">
      <rect x="9" y="2" width="22" height="9" rx="1" fill="#e6edf3" stroke="#9fb0bd" strokeWidth="1" />
      <rect x="3" y="11" width="34" height="12" rx="2" fill="#59687a" stroke="#33475b" strokeWidth="1.1" />
      <rect x="9" y="21" width="22" height="9" rx="1" fill="#f4f8fb" stroke="#9fb0bd" strokeWidth="1" />
      <circle cx="32" cy="15" r="1.4" fill="#8ee08e" />
    </svg>
  ),
  dns: (
    <svg viewBox="0 0 34 34" width="30" height="30">
      <circle cx="17" cy="17" r="15" fill="#2b8fd6" />
      <ellipse cx="17" cy="17" rx="6.5" ry="15" fill="none" stroke="#cfe9f9" strokeWidth="1.2" />
      <path d="M2.6 12h28.8M2.6 22h28.8" stroke="#cfe9f9" strokeWidth="1.2" />
      <text x="17" y="20.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        DNS
      </text>
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 60 36" width="54" height="32">
      <path
        d="M16 30c-6 0-11-4.3-11-9.6 0-4.8 4-8.8 9.3-9.5C16.4 5.6 21.6 2 27.7 2c7.3 0 13.3 5.2 14 11.9 4.7.7 8.3 4.4 8.3 8.9 0 5-4.4 7.2-9.8 7.2z"
        fill="#fff"
        stroke="#8b9aa8"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

interface NodeSpec {
  id: string;
  icon: keyof typeof ICON;
  label: string;
  x: number;
  y: number;
  open?: WinKind;
  sub?: string;
}

const NODES: NodeSpec[] = [
  { id: 'internet', icon: 'cloud', label: 'Internet', x: 8, y: 26 },
  { id: 'printer', icon: 'printer', label: 'Printer', x: 32, y: 15 },
  { id: 'sw2', icon: 'switch', label: 'Switch', x: 46, y: 30 },
  { id: 'ws1', icon: 'workstation', label: 'Workstation 1', x: 68, y: 15, open: 'ws1' },
  { id: 'ws2', icon: 'workstation', label: 'Workstation 2', x: 87, y: 27, open: 'ws2' },
  { id: 'telco', icon: 'router', label: 'Telco Router', x: 11, y: 76 },
  { id: 'router', icon: 'router', label: 'Router', x: 31, y: 76, open: 'router' },
  { id: 'sw1', icon: 'switch', label: 'Switch', x: 51, y: 76 },
  { id: 'dns', icon: 'dns', label: 'DNS', x: 63, y: 62 },
  { id: 'file', icon: 'server', label: 'File Server', x: 80, y: 58 },
  { id: 'email', icon: 'server', label: 'Email Server', x: 80, y: 73 },
  { id: 'web', icon: 'server', label: 'Web Server', x: 80, y: 88 },
];

const CABLES = [
  'M8,32 L8,76 L11,76',
  'M11,76 L31,76',
  'M31,76 L31,58 L46,58 L46,34',
  'M31,76 L51,76',
  'M51,76 L63,66',
  'M51,76 L70,58 L74,58',
  'M51,76 L74,73',
  'M51,76 L70,88 L74,88',
  'M46,30 L36,20 L34,17',
  'M46,26 L46,20 L64,20 L64,17',
  'M46,32 L82,32 L82,27',
];

// ------------------------------------------------------------------ command

function parse(cmdRaw: string, host: Host, acl: AclRule[], mark: (p: Partial<Probes>) => void): string[] {
  const cmd = cmdRaw.trim();
  if (!cmd) return [];
  const [verb, ...rest] = cmd.split(/\s+/);
  const v = verb.toLowerCase();
  const arg = rest.join(' ').trim();

  if (v === 'help' || v === '?') {
    return [
      'Available commands in this simulation:',
      '  ipconfig            show the adapter address, mask and gateway',
      '  ping <host or ip>   send four ICMP echo requests',
      '  nslookup <name>     ask the DNS server to resolve a name',
      '  tracert <host>      show the hops toward a destination',
      '  arp -a              show the local address resolution cache',
      '  cls                 clear the screen',
      '',
    ];
  }

  if (v === 'cls' || v === 'clear') return ['\u0000cls'];

  if (v === 'ipconfig') {
    mark({ ipconfig: true });
    const out = [
      '',
      'Windows IP Configuration',
      '',
      `Ethernet adapter ${host.adapter}:`,
      '',
      '   Connection-specific DNS Suffix  . : corp.example',
      `   IPv4 Address. . . . . . . . . . . : ${host.ip}`,
      `   Subnet Mask . . . . . . . . . . . : ${host.mask}`,
      `   Default Gateway . . . . . . . . . : ${host.gateway}`,
      '',
    ];
    if (arg.toLowerCase() === '/all') {
      out.splice(6, 0, '   Physical Address. . . . . . . . . : 00-1B-44-11-3A-B7');
      out.splice(10, 0, `   DNS Servers . . . . . . . . . . . : ${DNS_SERVER}`);
    }
    return out;
  }

  if (v === 'arp') {
    return [
      '',
      'Interface: ' + host.ip + ' --- 0x4',
      '  Internet Address      Physical Address      Type',
      '  192.168.0.65          00-1b-44-90-04-01     dynamic',
      '  192.168.0.70          00-1b-44-11-3a-b7     dynamic',
      '  192.168.0.71          00-1b-44-11-3a-c2     dynamic',
      '  192.168.0.95          ff-ff-ff-ff-ff-ff     static',
      '',
    ];
  }

  if (v === 'nslookup') {
    if (!arg) return ['Usage: nslookup <name>', ''];
    const name = arg.toLowerCase();
    const dnsFlow = evaluate(acl, { src: host.ip, dst: DNS_SERVER, proto: 'UDP', port: 53 });
    if (!dnsFlow.allowed) {
      return ['', `Server:  UnKnown`, `Address:  ${DNS_SERVER}`, '', '*** Request to UnKnown timed-out', ''];
    }
    const hit = DNS_TABLE[name];
    if (!hit) return ['', 'Server:  dns.corp.example', `Address:  ${DNS_SERVER}`, '', `*** dns.corp.example can't find ${arg}: Non-existent domain`, ''];
    if (name === OUTSIDE_SITE) mark({ reachOut: true });
    return ['', 'Server:  dns.corp.example', `Address:  ${DNS_SERVER}`, '', 'Non-authoritative answer:', `Name:    ${name}`, `Address:  ${hit}`, ''];
  }

  if (v === 'ping') {
    if (!arg) return ['Usage: ping <host or ip>', ''];
    const target = arg.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const ip = isIp(target) ? target : DNS_TABLE[target.toLowerCase()];
    if (!ip) return ['', `Ping request could not find host ${target}. Please check the name and try again.`, ''];
    const verdict = evaluate(acl, { src: host.ip, dst: ip, proto: 'ICMP', port: null });
    const local = ip === host.gateway || ip.startsWith('192.168.0.6') || ip.startsWith('192.168.0.7');
    const head = ['', `Pinging ${target === ip ? ip : `${target} [${ip}]`} with 32 bytes of data:`];
    if (!verdict.allowed && !local) {
      return [...head, 'Request timed out.', 'Request timed out.', 'Request timed out.', 'Request timed out.', '', `Ping statistics for ${ip}:`, '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),', ''];
    }
    if (!isIp(target) && target.toLowerCase() === OUTSIDE_SITE) mark({ reachOut: true });
    if (isIp(target) && ip === DNS_TABLE[OUTSIDE_SITE]) mark({ reachOut: true });
    const ttl = local ? 128 : 54;
    const times = local ? [1, 1, 1, 2] : [21, 19, 22, 20];
    return [
      ...head,
      ...times.map((t) => `Reply from ${ip}: bytes=32 time=${t}ms TTL=${ttl}`),
      '',
      `Ping statistics for ${ip}:`,
      '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),',
      'Approximate round trip times in milli-seconds:',
      `    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${Math.round(times.reduce((a, b) => a + b, 0) / 4)}ms`,
      '',
    ];
  }

  if (v === 'tracert') {
    if (!arg) return ['Usage: tracert <host>', ''];
    const ip = isIp(arg) ? arg : DNS_TABLE[arg.toLowerCase()];
    if (!ip) return ['', `Unable to resolve target system name ${arg}.`, ''];
    const verdict = evaluate(acl, { src: host.ip, dst: ip, proto: 'ICMP', port: null });
    const out = ['', `Tracing route to ${arg} [${ip}]`, 'over a maximum of 30 hops:', '', '  1     1 ms     1 ms     1 ms  192.168.0.65'];
    if (!verdict.allowed) return [...out, '  2     *        *        *     Request timed out.', '', 'Trace incomplete.', ''];
    return [...out, '  2     8 ms     7 ms     8 ms  192.0.2.1', `  3    20 ms    19 ms    21 ms  ${ip}`, '', 'Trace complete.', ''];
  }

  return [`'${verb}' is not recognized as an internal or external command,`, 'operable program or batch file.', '', 'Type help to see what this simulation supports.', ''];
}

// --------------------------------------------------------------- components

function Terminal({ host, acl, mark }: { host: Host; acl: AclRule[]; mark: (p: Partial<Probes>) => void }) {
  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const run = () => {
    const cmd = input;
    setInput('');
    if (cmd.trim()) {
      setHistory((h) => [cmd, ...h]);
      setHIdx(-1);
    }
    const out = parse(cmd, host, acl, mark);
    if (out[0] === '\u0000cls') {
      setLines([]);
      return;
    }
    setLines((prev) => [...prev, { text: `C:\\Users\\admin>${cmd}`, kind: 'cmd' }, ...out.map((t) => ({ text: t, kind: 'out' as const }))]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run();
      return;
    }
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const next = Math.min(hIdx + 1, history.length - 1);
      setHIdx(next);
      setInput(history[next]);
    }
    if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault();
      const next = Math.max(hIdx - 1, -1);
      setHIdx(next);
      setInput(next === -1 ? '' : history[next]);
    }
  };

  return (
    <div className="csim-term">
      {lines.map((l, i) => (
        <div key={i} className={l.kind === 'cmd' ? 'csim-term-cmd' : 'csim-term-out'}>
          {l.text || '\u00a0'}
        </div>
      ))}
      <div className="csim-term-input">
        <span>C:\Users\admin&gt;</span>
        <input
          value={input}
          autoFocus
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          aria-label={`${host.name} command prompt`}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}

function Browser({ host, acl, mark }: { host: Host; acl: AclRule[]; mark: (p: Partial<Probes>) => void }) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<{ kind: 'blank' | 'ok' | 'fail'; host: string; reason: string }>({
    kind: 'blank',
    host: '',
    reason: '',
  });

  const go = () => {
    const clean = url.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
    if (!clean) return;
    const ip = DNS_TABLE[clean];
    if (!ip) {
      setState({ kind: 'fail', host: clean, reason: 'This site can\u2019t be reached. The server IP address could not be found.' });
      return;
    }
    const verdict = evaluate(acl, { src: host.ip, dst: ip, proto: 'TCP', port: 443 });
    if (!verdict.allowed) {
      setState({
        kind: 'fail',
        host: clean,
        reason: 'This site can\u2019t be reached. The connection was reset. ERR_CONNECTION_RESET',
      });
      return;
    }
    if (clean === OUTSIDE_SITE) mark({ browserOk: true });
    setState({ kind: 'ok', host: clean, reason: '' });
  };

  return (
    <div className="csim-browser">
      <div className="csim-browser-bar">
        <span className="csim-browser-nav" aria-hidden="true">
          &#8592;
        </span>
        <span className="csim-browser-nav" aria-hidden="true">
          &#8594;
        </span>
        <span className="csim-browser-nav" onClick={go} title="Reload">
          &#8635;
        </span>
        <input
          className="csim-browser-url"
          value={url}
          placeholder="Type a site address and press Enter"
          spellCheck={false}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          aria-label={`${host.name} browser address bar`}
        />
      </div>
      <div className="csim-browser-page">
        {state.kind === 'blank' && (
          <div className="csim-page-hint">
            <p>Try one of these:</p>
            <ul>
              <li>www.example.org (a site out on the internet)</li>
              <li>intranet.corp.example (the internal web server in the screened subnet)</li>
            </ul>
          </div>
        )}
        {state.kind === 'ok' && (
          <div className="csim-page-ok">
            <div className="csim-page-logo">{state.host}</div>
            <p>Page loaded successfully.</p>
            <div className="csim-page-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {state.kind === 'fail' && (
          <div className="csim-page-fail">
            <div className="csim-page-sad">:(</div>
            <h4>{state.host}</h4>
            <p>{state.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HostWindow({ host, acl, mark }: { host: Host; acl: AclRule[]; mark: (p: Partial<Probes>) => void }) {
  const [tab, setTab] = useState('cmd');
  return (
    <>
      <ExamTabs
        tabs={[
          { id: 'cmd', label: 'Command Prompt' },
          { id: 'web', label: 'Web Browser' },
        ]}
        active={tab}
        onPick={setTab}
      />
      {tab === 'cmd' ? <Terminal host={host} acl={acl} mark={mark} /> : <Browser host={host} acl={acl} mark={mark} />}
    </>
  );
}

function RouterWindow({ acl, onDelete, locked }: { acl: AclRule[]; onDelete: (id: number) => void; locked: boolean }) {
  const [tab, setTab] = useState('acl');
  return (
    <>
      <ExamTabs
        tabs={[
          { id: 'iface', label: 'Interfaces' },
          { id: 'acl', label: 'Access Control List' },
        ]}
        active={tab}
        onPick={setTab}
      />
      {tab === 'iface' ? (
        <pre className="csim-iface">{INTERFACES}</pre>
      ) : (
        <div className="csim-acl">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Port</th>
                <th>Access</th>
                <th aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {acl.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.src}</td>
                  <td>{r.dst}</td>
                  <td>{r.proto}</td>
                  <td>{r.port}</td>
                  <td className={r.access === 'Deny' ? 'csim-deny' : 'csim-accept'}>{r.access}</td>
                  <td>
                    {!locked && (
                      <button className="csim-x" onClick={() => onDelete(r.id)} aria-label={`Remove rule ${i + 1}`}>
                        &#10006;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {acl.length === 0 && <p className="csim-acl-empty">Every rule has been removed. The implicit deny now drops all traffic.</p>}
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------------- drill

export function ExamConsoleDrill({ onBack }: { onBack?: () => void } = {}) {
  const [acl, setAcl] = useState<AclRule[]>(BASE_ACL);
  const [open, setOpen] = useState<WinKind[]>([]);
  const [top, setTop] = useState<WinKind[]>([]);
  const [showQ, setShowQ] = useState(true);
  const [probes, setProbes] = useState<Probes>({ ipconfig: false, reachOut: false, browserOk: false });
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;

  const mark = (p: Partial<Probes>) => setProbes((prev) => ({ ...prev, ...p }));

  const openWin = (k: WinKind) => {
    setOpen((o) => (o.includes(k) ? o : [...o, k]));
    setTop((t) => [...t.filter((x) => x !== k), k]);
  };
  const closeWin = (k: WinKind) => setOpen((o) => o.filter((x) => x !== k));

  const removed = useMemo(() => BASE_ACL.filter((r) => !acl.some((a) => a.id === r.id)), [acl]);

  const reset = () => {
    setAcl(BASE_ACL);
    setOpen([]);
    setProbes({ ipconfig: false, reachOut: false, browserOk: false });
    setParts(null);
  };

  const submit = () => {
    const faultGone = removed.some((r) => r.id === FAULT_RULE_ID);
    const collateral = removed.filter((r) => r.id !== FAULT_RULE_ID);
    setParts([
      {
        id: 'fault',
        label: 'Removed the rule that was blocking web traffic out of the Executive Offices subnet',
        ok: faultGone,
        why: faultGone
          ? 'Rule 3 denied TCP and UDP 80 and 443 from 192.168.0.64/27 to anywhere. That is HTTP and HTTPS, which is exactly what a browser uses, so removing it restores browsing.'
          : 'Rule 3 denied TCP and UDP 80 and 443 from 192.168.0.64/27 to anywhere. Ping and DNS kept working because neither uses those ports, which is the clue that the fault was a port filter and not a broken link.',
      },
      {
        id: 'collateral',
        label: 'Left every other rule in place',
        ok: collateral.length === 0,
        why:
          collateral.length === 0
            ? 'You changed one thing. That is the whole point of the last two steps of the troubleshooting methodology: make a single change, then test it.'
            : `You also removed ${collateral.map((r) => `rule ${r.id}`).join(', ')}. Each of those was doing real security work, and removing extra rules on a live router is how a small outage turns into an incident.`,
      },
      {
        id: 'ipconfig',
        label: 'Checked the workstation IP configuration before touching the router',
        ok: probes.ipconfig,
        why: probes.ipconfig
          ? 'Both workstations had a valid address, mask and gateway on 192.168.0.64/27, which ruled out the client side and pointed upstream.'
          : 'Run ipconfig first. If the address had been an APIPA 169.254 address or the gateway had been outside the mask, the fix would have been on the workstation and the router would have been a dead end.',
      },
      {
        id: 'reach',
        label: 'Proved the path to the internet was up before blaming the link',
        ok: probes.reachOut,
        why: probes.reachOut
          ? 'Ping and nslookup to an outside host both succeeded. ICMP has no port number and DNS uses UDP 53, so neither one is caught by an 80 and 443 filter. Layer 3 was fine the whole time.'
          : 'Ping or nslookup an outside address. When ICMP and DNS both work but the browser does not, the transport layer is being filtered. That single test separates a routing problem from a port filter.',
      },
      {
        id: 'verify',
        label: 'Verified the fix by loading the site in the browser',
        ok: probes.browserOk,
        why: probes.browserOk
          ? 'You confirmed the actual reported symptom was gone rather than assuming the change worked.'
          : 'Always verify with the service the user complained about. A clean ping proves nothing here, because ping was already working before you changed anything.',
      },
    ]);
  };

  const zFor = (k: WinKind) => 40 + top.indexOf(k);
  const correct = parts?.filter((p) => p.ok).length ?? 0;

  return (
    <ExamShell
      title="Network Troubleshooting Simulation"
      lead="Read the question carefully, follow the instructions, and then click the submit button when you have finished. You will receive a numeric score once you have submitted a response."
      sectionLabel="Network Diagram for Company A"
      onSubmit={locked ? undefined : submit}
      onReset={reset}
      onShowQuestion={() => setShowQ((v) => !v)}
      questionOpen={showQ}
      onBack={onBack}
    >
      <div className="csim-work">
        {showQ && (
          <ExamQuestionPanel scenario={SCENARIO} instructions={INSTRUCTIONS} footNote={FOOT} onClose={() => setShowQ(false)} />
        )}

        <div className="csim-canvas">
          <div className="csim-zone csim-zone-a">
            <span className="csim-zone-name">Floor 2 - Executive Offices</span>
          </div>
          <div className="csim-zone csim-zone-b">
            <span className="csim-zone-name">Floor 1 - Telco Closet</span>
          </div>
          <div className="csim-pen csim-pen-telco">
            <span>Telco Cage</span>
          </div>
          <div className="csim-pen csim-pen-dmz">
            <span>DMZ</span>
          </div>

          <svg className="csim-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {CABLES.map((d) => (
              <path key={d} d={d} fill="none" stroke="#8ec9e8" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            ))}
          </svg>

          <span className="csim-iflabel" style={{ left: '24%', top: '70%' }}>
            eth1
          </span>
          <span className="csim-iflabel" style={{ left: '38%', top: '70%' }}>
            eth2
          </span>
          <span className="csim-iflabel" style={{ left: '31%', top: '62%' }}>
            eth3
          </span>

          {NODES.map((n) => (
            <div
              key={n.id}
              className={`csim-node${n.open ? ' clickable' : ''}${n.open && open.includes(n.open) ? ' on' : ''}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              onClick={() => n.open && openWin(n.open)}
              role={n.open ? 'button' : undefined}
              tabIndex={n.open ? 0 : undefined}
              onKeyDown={(e) => n.open && e.key === 'Enter' && openWin(n.open)}
            >
              {ICON[n.icon]}
              <span className="csim-node-label">{n.label}</span>
            </div>
          ))}
        </div>

        {open.includes('ws1') && (
          <ExamWindow name="Workstation 1" x={260} y={120} width={520} z={zFor('ws1')} onFocus={() => openWin('ws1')} onClose={() => closeWin('ws1')}>
            <HostWindow host={HOSTS.ws1} acl={acl} mark={mark} />
          </ExamWindow>
        )}
        {open.includes('ws2') && (
          <ExamWindow name="Workstation 2" x={320} y={180} width={520} z={zFor('ws2')} onFocus={() => openWin('ws2')} onClose={() => closeWin('ws2')}>
            <HostWindow host={HOSTS.ws2} acl={acl} mark={mark} />
          </ExamWindow>
        )}
        {open.includes('router') && (
          <ExamWindow name="Router" x={200} y={140} width={640} z={zFor('router')} onFocus={() => openWin('router')} onClose={() => closeWin('router')}>
            <RouterWindow acl={acl} locked={locked} onDelete={(id) => setAcl((a) => a.filter((r) => r.id !== id))} />
          </ExamWindow>
        )}
      </div>

      {locked && parts && (
        <div className="csim-results">
          <ExamScore correct={correct} total={parts.length} passLabel="Clean fix, verified" failLabel="Review the steps below" />
          <div className="csim-insight">
            <span className="csim-insight-tag">The takeaway</span>
            <p>
              Ping working while the browser fails is the whole question. ICMP carries no port number and DNS rides UDP 53, so
              a filter on TCP 80 and 443 leaves both of them untouched. When lower layers test clean and one application still
              fails, stop looking at cables and start reading the access control list.
            </p>
          </div>
          <div className="csim-parts">
            {parts.map((p) => (
              <div className={p.ok ? 'csim-part ok' : 'csim-part bad'} key={p.id}>
                <div className="csim-part-head">
                  <span className="csim-part-mark">{p.ok ? '\u2713' : '\u2717'}</span>
                  <span>{p.label}</span>
                </div>
                <p className="csim-part-why">{p.why}</p>
              </div>
            ))}
          </div>
          {removed.length > 0 && (
            <div className="csim-removed">
              <h4>What each rule you removed was doing</h4>
              {removed.map((r) => (
                <p key={r.id}>
                  <b>Rule {r.id}</b> ({r.src} to {r.dst}, {r.proto} {r.port}, {r.access}): {r.note}
                </p>
              ))}
            </div>
          )}
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
