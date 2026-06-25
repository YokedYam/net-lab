import { useMemo, useState } from 'react';
import { CIDR_TABLE, subnetFacts, sameIp } from '../study';

interface Scenario {
  id: string;
  label: string;
  hosts: number;
  hostIp: string;
}

interface Answer {
  cidr: string;
  mask: string;
  usable: string;
  wasted: string;
  network: string;
  broadcast: string;
}

interface Grade {
  cidr: boolean;
  mask: boolean;
  usable: boolean;
  wasted: boolean;
  network: boolean;
  broadcast: boolean;
}

const EMPTY: Answer = { cidr: '', mask: '', usable: '', wasted: '', network: '', broadcast: '' };
const ROUND_SIZE = 12;

const SCENARIOS: Scenario[] = [
  { id: 'small-branch', label: 'Small branch office with 18 employee devices', hosts: 18, hostIp: '192.168.14.47' },
  { id: 'training-room', label: 'Training room with 28 student laptops', hosts: 28, hostIp: '10.29.32.12' },
  { id: 'call-center', label: 'Call center floor with 50 workstations', hosts: 50, hostIp: '172.16.8.99' },
  { id: 'wireless-office', label: 'Wireless-only office with 80 client devices', hosts: 80, hostIp: '192.168.40.180' },
  { id: 'warehouse', label: 'Warehouse scanners, printers, and APs needing 115 addresses', hosts: 115, hostIp: '10.18.7.210' },
  { id: 'guest-wifi', label: 'Guest Wi-Fi VLAN expecting 96 leases', hosts: 96, hostIp: '172.20.12.90' },
  { id: 'server-rack', label: 'Server rack needing 12 usable addresses', hosts: 12, hostIp: '192.168.90.174' },
  { id: 'point-link', label: 'Point-to-point router link needing 2 addresses', hosts: 2, hostIp: '10.10.10.13' },
  { id: 'camera-vlan', label: 'Camera VLAN with 58 cameras', hosts: 58, hostIp: '172.22.44.72' },
  { id: 'lab-vlan', label: 'Lab VLAN with 33 hosts', hosts: 33, hostIp: '192.168.55.131' },
  { id: 'printers', label: 'Printer subnet with 6 devices', hosts: 6, hostIp: '10.4.5.198' },
  { id: 'iot', label: 'IoT segment with 120 devices', hosts: 120, hostIp: '172.17.30.65' },
  { id: 'conference', label: 'Conference room devices needing 14 usable addresses', hosts: 14, hostIp: '192.168.75.222' },
  { id: 'dev-team', label: 'Developer team subnet with 62 computers', hosts: 62, hostIp: '10.50.8.33' },
  { id: 'support', label: 'Support desk subnet with 29 hosts', hosts: 29, hostIp: '172.19.60.151' },
  { id: 'large-floor', label: 'Office floor with 126 wired clients', hosts: 126, hostIp: '192.168.100.200' },
  { id: 'cloud-subnet', label: 'Cloud app subnet needing 54 private addresses', hosts: 54, hostIp: '10.70.4.44' },
  { id: 'mgmt-vlan', label: 'Management VLAN with 25 switches and APs', hosts: 25, hostIp: '172.18.88.29' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanCidr(value: string): number | null {
  const n = Number(value.trim().replace('/', ''));
  return Number.isInteger(n) ? n : null;
}

function cleanNum(value: string): number | null {
  const n = Number(value.trim().replace(/[, ]/g, ''));
  return Number.isInteger(n) ? n : null;
}

function bestFit(hosts: number) {
  const candidates = CIDR_TABLE.filter((row) => row.cidr >= 25 && row.hosts >= hosts);
  return candidates[candidates.length - 1];
}

function gradeAnswer(answer: Answer, scenario: Scenario): Grade {
  const fit = bestFit(scenario.hosts);
  const facts = subnetFacts(scenario.hostIp, fit.cidr);
  const cidr = cleanCidr(answer.cidr);
  const usable = cleanNum(answer.usable);
  const wasted = cleanNum(answer.wasted);
  return {
    cidr: cidr === fit.cidr,
    mask: answer.mask.trim() === fit.mask,
    usable: usable === fit.hosts,
    wasted: wasted === fit.hosts - scenario.hosts,
    network: sameIp(answer.network, facts.network),
    broadcast: sameIp(answer.broadcast, facts.broadcast),
  };
}

function allCorrect(grade: Grade | null): boolean {
  return !!grade && Object.values(grade).every(Boolean);
}

function allFilled(answer: Answer): boolean {
  return Object.values(answer).every((v) => v.trim() !== '');
}

function fieldClass(ok: boolean | undefined): string {
  if (ok === undefined) return 'subnet-field';
  return ok ? 'subnet-field ok' : 'subnet-field bad';
}

export function CidrSizingDrill({ onBack, onGuide }: { onBack?: () => void; onGuide?: () => void } = {}) {
  const [order, setOrder] = useState<Scenario[]>(() => shuffle(SCENARIOS).slice(0, ROUND_SIZE));
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<Answer>(EMPTY);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [missed, setMissed] = useState<Scenario[]>([]);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState(false);

  const scenario = order[pos];
  const fit = useMemo(() => (scenario ? bestFit(scenario.hosts) : null), [scenario]);
  const facts = useMemo(() => (scenario && fit ? subnetFacts(scenario.hostIp, fit.cidr) : null), [fit, scenario]);
  const locked = grade !== null;

  const reset = () => {
    setOrder(shuffle(SCENARIOS).slice(0, ROUND_SIZE));
    setPos(0);
    setAnswer(EMPTY);
    setGrade(null);
    setMissed([]);
    setReview(false);
    setDone(false);
  };

  const submit = () => {
    if (!scenario) return;
    const next = gradeAnswer(answer, scenario);
    setGrade(next);
    if (!allCorrect(next) && !missed.some((item) => item.id === scenario.id)) {
      setMissed((prev) => [...prev, scenario]);
    }
  };

  const next = () => {
    if (pos + 1 < order.length) {
      setPos((p) => p + 1);
      setAnswer(EMPTY);
      setGrade(null);
      return;
    }

    if (!review && missed.length > 0) {
      setOrder(shuffle(missed));
      setPos(0);
      setAnswer(EMPTY);
      setGrade(null);
      setReview(true);
      return;
    }

    setDone(true);
  };

  if (done || !scenario || !fit || !facts) {
    const clean = ROUND_SIZE - missed.length;
    return (
      <div className="study">
        <div className="drill-done">
          <h2>CIDR session complete</h2>
          <div className="drill-done-stats">
            <div className="drill-done-stat">
              <span className="drill-done-val">{clean}/{ROUND_SIZE}</span>
              <span className="drill-done-label">first attempt</span>
            </div>
            <div className="drill-done-stat">
              <span className="drill-done-val">{missed.length}</span>
              <span className="drill-done-label">needed review</span>
            </div>
          </div>
          <p>
            The goal is instant sizing: pick the smallest subnet that fits, then prove it with host
            count and waste.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="big-btn" onClick={reset}>
              Start over
            </button>
            {onBack && (
              <button className="big-btn ghost" onClick={onBack}>
                Back to PBQs
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const update =
    (field: keyof Answer) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnswer((current) => ({ ...current, [field]: e.target.value }));
    };

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Subnet sizing drill</span>
          <span className="qs-topic"> · {review ? `Review: ${order.length - pos} left` : `${pos}/${ROUND_SIZE} completed`}</span>
        </div>
        <div className="qs-right">
          {onBack && (
            <button className="btn small" onClick={onBack}>
              Back to PBQs
            </button>
          )}
        </div>
      </div>

      <div className="pbq-card cidr-drill-card">
        <h2 className="pbq-title">Choose the most efficient CIDR</h2>
        <p className="pbq-scenario">
          A network admin needs a subnet for this requirement. Pick the smallest prefix that gives
          enough usable host addresses without wasting extra space.
        </p>

        <div className="cidr-scenario">
          <span className="cidr-scenario-label">Requirement</span>
          <strong>{scenario.label}</strong>
          <span>{scenario.hosts} usable host addresses needed</span>
          <span>Example host IP to place inside that subnet: {scenario.hostIp}</span>
        </div>

        <div className="subnet-fields">
          <label className={fieldClass(grade?.cidr)}>
            <span>CIDR prefix</span>
            <input
              value={answer.cidr}
              disabled={locked}
              placeholder="/25"
              spellCheck={false}
              autoComplete="off"
              onChange={update('cidr')}
            />
          </label>
          <label className={fieldClass(grade?.mask)}>
            <span>Subnet mask</span>
            <input
              value={answer.mask}
              disabled={locked}
              placeholder="255.255.255.128"
              spellCheck={false}
              autoComplete="off"
              onChange={update('mask')}
            />
          </label>
          <label className={fieldClass(grade?.usable)}>
            <span>Usable hosts</span>
            <input
              value={answer.usable}
              disabled={locked}
              placeholder="126"
              spellCheck={false}
              autoComplete="off"
              onChange={update('usable')}
            />
          </label>
          <label className={fieldClass(grade?.wasted)}>
            <span>Wasted addresses</span>
            <input
              value={answer.wasted}
              disabled={locked}
              placeholder="46"
              spellCheck={false}
              autoComplete="off"
              onChange={update('wasted')}
            />
          </label>
          <label className={fieldClass(grade?.network)}>
            <span>Network address</span>
            <input
              value={answer.network}
              disabled={locked}
              placeholder="10.29.32.0"
              spellCheck={false}
              autoComplete="off"
              onChange={update('network')}
            />
          </label>
          <label className={fieldClass(grade?.broadcast)}>
            <span>Broadcast address</span>
            <input
              value={answer.broadcast}
              disabled={locked}
              placeholder="10.29.32.31"
              spellCheck={false}
              autoComplete="off"
              onChange={update('broadcast')}
            />
          </label>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={submit} disabled={!allFilled(answer)}>
              Submit &amp; grade →
            </button>
            {!allFilled(answer) && <span className="pbq-submit-hint">Answer every field to submit.</span>}
          </div>
        )}

        {locked && (
          <div className="drill-reveal">
            <span className="drill-reveal-label">{allCorrect(grade) ? 'Correct' : 'Review this'}</span>
            <div className="drill-reveal-rows">
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">CIDR</span>
                <span className="drill-reveal-val">/{fit.cidr}</span>
              </div>
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">Mask</span>
                <span className="drill-reveal-val">{fit.mask}</span>
              </div>
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">Usable</span>
                <span className="drill-reveal-val">{fit.hosts}</span>
              </div>
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">Waste</span>
                <span className="drill-reveal-val">{fit.hosts - scenario.hosts}</span>
              </div>
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">Network</span>
                <span className="drill-reveal-val">{facts.network}</span>
              </div>
              <div className="drill-reveal-row">
                <span className="drill-reveal-key">Broadcast</span>
                <span className="drill-reveal-val">{facts.broadcast}</span>
              </div>
            </div>
            <p className="drill-desc-hint">
              Work backward from hosts, then use the increment to find the block. Broadcast is the
              next block minus 1.
            </p>
            {!allCorrect(grade) && onGuide && (
              <div className="subnet-review-prompt">
                <span>Want to review the shortcut?</span>
                <button className="big-btn ghost" onClick={onGuide}>
                  Open subnetting guide
                </button>
              </div>
            )}
          </div>
        )}

        {locked && (
          <div className="pbq-result-actions">
            <button className="big-btn" onClick={next}>
              {pos + 1 >= order.length && review ? 'Finish' : pos + 1 >= order.length ? 'Review misses' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
