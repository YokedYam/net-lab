import { useMemo, useState } from 'react';
import { CIDR_TABLE, sameIp } from '../study';

interface Need {
  id: string;
  name: string;
  hosts: number;
}

interface Scenario {
  id: string;
  title: string;
  base: string;
  intro: string;
  needs: Need[];
}

interface RowAnswer {
  cidr: string;
  network: string;
  first: string;
  last: string;
  broadcast: string;
}

interface PlanRow extends Need {
  cidr: number;
  mask: string;
  usable: number;
  network: string;
  first: string;
  last: string;
  broadcast: string;
}

interface Part {
  key: string;
  label: string;
  your: string;
  correct: string;
  ok: boolean;
}

const EMPTY_ROW: RowAnswer = { cidr: '', network: '', first: '', last: '', broadcast: '' };

const SCENARIOS: Scenario[] = [
  {
    id: 'branch-office',
    title: 'Branch office subnet plan',
    base: '192.168.10.0/24',
    intro: 'A branch office is being split into separate networks. Allocate from largest to smallest so the subnets do not overlap.',
    needs: [
      { id: 'staff', name: 'Staff Wi-Fi', hosts: 80 },
      { id: 'cameras', name: 'Security cameras', hosts: 40 },
      { id: 'phones', name: 'VoIP phones', hosts: 20 },
      { id: 'printers', name: 'Printers', hosts: 10 },
      { id: 'network', name: 'Network gear', hosts: 6 },
    ],
  },
  {
    id: 'clinic',
    title: 'Clinic subnet plan',
    base: '10.44.20.0/24',
    intro: 'A clinic wants separate segments for clinical devices, guests, staff, and infrastructure.',
    needs: [
      { id: 'clinical', name: 'Clinical devices', hosts: 96 },
      { id: 'guest', name: 'Guest Wi-Fi', hosts: 50 },
      { id: 'staff', name: 'Staff laptops', hosts: 25 },
      { id: 'printers', name: 'Printers', hosts: 12 },
      { id: 'infra', name: 'Infrastructure', hosts: 6 },
    ],
  },
  {
    id: 'warehouse',
    title: 'Warehouse subnet plan',
    base: '172.16.60.0/24',
    intro: 'A warehouse needs separate networks for scanners, cameras, office clients, and small support segments.',
    needs: [
      { id: 'scanners', name: 'Handheld scanners', hosts: 120 },
      { id: 'cameras', name: 'Cameras', hosts: 54 },
      { id: 'office', name: 'Office clients', hosts: 28 },
      { id: 'aps', name: 'Access points', hosts: 14 },
      { id: 'p2p', name: 'Router link', hosts: 2 },
    ],
  },
];

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + (Number(oct) & 255), 0) >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function cleanCidr(value: string): number | null {
  const n = Number(value.trim().replace('/', ''));
  return Number.isInteger(n) ? n : null;
}

function bestFit(hosts: number) {
  const candidates = CIDR_TABLE.filter((row) => row.cidr >= 25 && row.hosts >= hosts);
  return candidates[candidates.length - 1];
}

function buildPlan(scenario: Scenario): PlanRow[] {
  let cursor = ipToInt(scenario.base.split('/')[0]);
  return scenario.needs.map((need) => {
    const fit = bestFit(need.hosts);
    const size = 2 ** (32 - fit.cidr);
    const network = cursor;
    const broadcast = cursor + size - 1;
    cursor += size;
    return {
      ...need,
      cidr: fit.cidr,
      mask: fit.mask,
      usable: fit.hosts,
      network: intToIp(network),
      first: intToIp(network + 1),
      last: intToIp(broadcast - 1),
      broadcast: intToIp(broadcast),
    };
  });
}

function emptyAnswers(plan: PlanRow[]): Record<string, RowAnswer> {
  return Object.fromEntries(plan.map((row) => [row.id, { ...EMPTY_ROW }]));
}

function isFilled(answers: Record<string, RowAnswer>): boolean {
  return Object.values(answers).every((row) => Object.values(row).every((value) => value.trim()));
}

function grade(plan: PlanRow[], answers: Record<string, RowAnswer>): Part[] {
  return plan.flatMap((row) => {
    const ans = answers[row.id] ?? EMPTY_ROW;
    const cidr = cleanCidr(ans.cidr);
    return [
      {
        key: `${row.id}-cidr`,
        label: `${row.name}: CIDR`,
        your: ans.cidr || '(blank)',
        correct: `/${row.cidr}`,
        ok: cidr === row.cidr,
      },
      {
        key: `${row.id}-network`,
        label: `${row.name}: network`,
        your: ans.network || '(blank)',
        correct: row.network,
        ok: sameIp(ans.network, row.network),
      },
      {
        key: `${row.id}-first`,
        label: `${row.name}: first usable`,
        your: ans.first || '(blank)',
        correct: row.first,
        ok: sameIp(ans.first, row.first),
      },
      {
        key: `${row.id}-last`,
        label: `${row.name}: last usable`,
        your: ans.last || '(blank)',
        correct: row.last,
        ok: sameIp(ans.last, row.last),
      },
      {
        key: `${row.id}-broadcast`,
        label: `${row.name}: broadcast`,
        your: ans.broadcast || '(blank)',
        correct: row.broadcast,
        ok: sameIp(ans.broadcast, row.broadcast),
      },
    ];
  });
}

export function SubnetDesignDrill({ onBack, onGuide }: { onBack?: () => void; onGuide?: () => void } = {}) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = SCENARIOS[scenarioIndex];
  const plan = useMemo(() => buildPlan(scenario), [scenario]);
  const [answers, setAnswers] = useState<Record<string, RowAnswer>>(() => emptyAnswers(plan));
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;
  const correct = parts?.filter((part) => part.ok).length ?? 0;
  const total = parts?.length ?? plan.length * 5;
  const perfect = locked && correct === total;

  const resetAnswers = (nextPlan = plan) => {
    setAnswers(emptyAnswers(nextPlan));
    setParts(null);
  };

  const setField = (id: string, field: keyof RowAnswer, value: string) => {
    setAnswers((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? EMPTY_ROW),
        [field]: value,
      },
    }));
  };

  const nextScenario = () => {
    const nextIndex = (scenarioIndex + 1) % SCENARIOS.length;
    const nextScenarioValue = SCENARIOS[nextIndex];
    const nextPlan = buildPlan(nextScenarioValue);
    setScenarioIndex(nextIndex);
    resetAnswers(nextPlan);
  };

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Subnet design PBQ</span>
          <span className="qs-topic"> · allocate a /24</span>
        </div>
        <div className="qs-right">
          {onBack && (
            <button className="btn small" onClick={onBack}>
              Back to PBQs
            </button>
          )}
        </div>
      </div>

      <div className="pbq-card subnet-design-card">
        <h2 className="pbq-title">{scenario.title}</h2>
        <p className="pbq-scenario">{scenario.intro}</p>

        <div className="subnet-design-given">
          <span>
            Available block: <b>{scenario.base}</b>
          </span>
          <span>Use the smallest subnet that fits each requirement.</span>
        </div>

        <div className="subnet-design-table-wrap">
          <table className="subnet-design-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Hosts</th>
                <th>CIDR</th>
                <th>Network</th>
                <th>First usable</th>
                <th>Last usable</th>
                <th>Broadcast</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((row) => {
                const ans = answers[row.id] ?? EMPTY_ROW;
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      {locked && <span className="subnet-design-mask">{row.mask}</span>}
                    </td>
                    <td>{row.hosts}</td>
                    <td>
                      <input value={ans.cidr} disabled={locked} placeholder="/25" onChange={(e) => setField(row.id, 'cidr', e.target.value)} />
                    </td>
                    <td>
                      <input value={ans.network} disabled={locked} placeholder="a.b.c.d" onChange={(e) => setField(row.id, 'network', e.target.value)} />
                    </td>
                    <td>
                      <input value={ans.first} disabled={locked} placeholder="a.b.c.d" onChange={(e) => setField(row.id, 'first', e.target.value)} />
                    </td>
                    <td>
                      <input value={ans.last} disabled={locked} placeholder="a.b.c.d" onChange={(e) => setField(row.id, 'last', e.target.value)} />
                    </td>
                    <td>
                      <input value={ans.broadcast} disabled={locked} placeholder="a.b.c.d" onChange={(e) => setField(row.id, 'broadcast', e.target.value)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(plan, answers))} disabled={!isFilled(answers)}>
              Submit &amp; grade →
            </button>
            {!isFilled(answers) && <span className="pbq-submit-hint">Fill every cell to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="subnet-design-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{total}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / total) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'Clean plan' : 'Review the misses'}</span>
            </div>

            {!perfect && (
              <div className="subnet-review-prompt">
                <span>Want to review the subnet shortcut before trying again?</span>
                {onGuide && (
                  <button className="big-btn ghost" onClick={onGuide}>
                    Open subnetting guide
                  </button>
                )}
              </div>
            )}

            <div className="pbq-breakdown">
              {parts
                .filter((part) => !part.ok)
                .map((part) => (
                  <div className="pbq-part bad" key={part.key}>
                    <div className="pbq-part-head">
                      <span className="pbq-part-mark">✗</span>
                      <span className="pbq-part-label">{part.label}</span>
                    </div>
                    <div className="pbq-part-detail">
                      <span>
                        You: <b className="bad-text">{part.your}</b> · Correct: <b className="ok-text">{part.correct}</b>
                      </span>
                    </div>
                  </div>
                ))}
              {perfect && <div className="guide-tip">Every segment fits, stays inside the /24, and avoids overlap.</div>}
            </div>

            <div className="pbq-result-actions">
              <button className="big-btn" onClick={() => resetAnswers()}>
                Try again
              </button>
              <button className="big-btn ghost" onClick={nextScenario}>
                New office scenario
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
