import { useState } from 'react';

// VLAN port-assignment PBQ. Read what is plugged into each switchport, then tag
// the port with the right VLAN (or trunk it / shut it). Graded deterministically
// in the browser with a per-port breakdown, same shape as the other PBQs.

type VlanId = '10' | '20' | '30' | 'trunk' | 'unused';

interface Vlan {
  id: VlanId;
  label: string;
  hint: string;
  color: string;
}

interface PortDef {
  id: string;
  num: number;
  device: string;
  correct: VlanId;
  why: string;
}

interface Part {
  id: string;
  label: string;
  your: string;
  correct: string;
  ok: boolean;
  why: string;
}

const VLANS: Vlan[] = [
  { id: '10', label: 'VLAN 10 Sales', hint: 'Sales data', color: '#3b82f6' },
  { id: '20', label: 'VLAN 20 Voice', hint: 'IP phones', color: '#f59e0b' },
  { id: '30', label: 'VLAN 30 HR', hint: 'HR data', color: '#a855f7' },
  { id: 'trunk', label: 'Trunk (802.1Q)', hint: 'carries every VLAN', color: '#14b8a6' },
  { id: 'unused', label: 'Unused / shut', hint: 'disable the port', color: '#64748b' },
];

const PORTS: PortDef[] = [
  { id: 'p1', num: 1, device: 'Sales workstation', correct: '10', why: 'A sales PC carries normal data, so the access port belongs in the Sales VLAN 10.' },
  { id: 'p2', num: 2, device: 'Sales workstation', correct: '10', why: 'Another sales PC: access port in VLAN 10.' },
  { id: 'p3', num: 3, device: 'HR workstation', correct: '30', why: 'HR data is separated for privacy, so this access port is VLAN 30.' },
  { id: 'p4', num: 4, device: 'IP phone (handset only)', correct: '20', why: 'A standalone IP phone goes in the Voice VLAN 20 so voice traffic is segmented and can be prioritized.' },
  { id: 'p5', num: 5, device: 'HR workstation', correct: '30', why: 'HR access port: VLAN 30.' },
  { id: 'p6', num: 6, device: 'Sales printer', correct: '10', why: 'The printer lives with the sales users it serves, VLAN 10.' },
  { id: 'p7', num: 7, device: 'IP phone (handset only)', correct: '20', why: 'Voice VLAN 20.' },
  { id: 'p8', num: 8, device: 'Wireless access point', correct: 'trunk', why: 'An AP advertising multiple SSIDs needs every VLAN, so its uplink port is a trunk.' },
  { id: 'p9', num: 9, device: 'Empty wall jack', correct: 'unused', why: 'An unused jack should be administratively shut down (or put in a dead VLAN) so nobody can plug in and get on the network.' },
  { id: 'p10', num: 10, device: 'Sales workstation', correct: '10', why: 'Sales access port: VLAN 10.' },
  { id: 'p11', num: 11, device: 'HR workstation', correct: '30', why: 'HR access port: VLAN 30.' },
  { id: 'p12', num: 12, device: 'Uplink to core switch', correct: 'trunk', why: 'The link between switches must carry all VLANs, so it is a trunk.' },
];

function vlanOf(id: VlanId): Vlan {
  return VLANS.find((v) => v.id === id) as Vlan;
}

function grade(assigned: Record<string, VlanId>): Part[] {
  return PORTS.map((port) => {
    const your = assigned[port.id];
    return {
      id: port.id,
      label: `Port ${port.num}: ${port.device}`,
      your: your ? vlanOf(your).label : '(unassigned)',
      correct: vlanOf(port.correct).label,
      ok: your === port.correct,
      why: port.why,
    };
  });
}

const allAssigned = (assigned: Record<string, VlanId>): boolean =>
  PORTS.every((port) => assigned[port.id]);

export function VlanAssignDrill({ onBack }: { onBack?: () => void } = {}) {
  const [selected, setSelected] = useState<VlanId>('10');
  const [assigned, setAssigned] = useState<Record<string, VlanId>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;
  const correct = parts?.filter((p) => p.ok).length ?? 0;
  const perfect = locked && correct === PORTS.length;

  const reset = () => {
    setAssigned({});
    setParts(null);
    setSelected('10');
  };

  const assign = (port: PortDef) => {
    if (locked) return;
    setAssigned((cur) => ({ ...cur, [port.id]: selected }));
  };

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">VLAN assignment PBQ</span>
          <span className="qs-topic"> · switchport tagging</span>
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
        <h2 className="pbq-title">Floor 2 access switch: assign the VLANs</h2>
        <p className="pbq-scenario">
          Each port shows what is plugged into it. Tag every access port with the VLAN that matches
          its device, trunk the ports that carry multiple VLANs, and lock down anything unused.
        </p>

        <div className="vlan-legend">
          <span className="vlan-legend-label">VLANs</span>
          <div className="vlan-chips">
            {VLANS.map((v) => (
              <button
                key={v.id}
                className={selected === v.id ? 'vlan-chip active' : 'vlan-chip'}
                style={{ '--vlan': v.color } as React.CSSProperties}
                disabled={locked}
                onClick={() => setSelected(v.id)}
              >
                <span className="vlan-swatch" />
                <span className="vlan-chip-copy">
                  <b>{v.label}</b>
                  <small>{v.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="vlan-switch">
          <div className="vlan-switch-face">
            <span className="vlan-switch-name">SW-FLOOR2</span>
            <div className="vlan-ports">
              {PORTS.map((port) => {
                const v = assigned[port.id];
                const part = parts?.find((p) => p.id === port.id);
                const state = locked ? (part?.ok ? ' ok' : ' bad') : '';
                const color = v ? vlanOf(v).color : undefined;
                return (
                  <div className="vlan-portcol" key={port.id}>
                    <button
                      className={`vlan-port${v ? ' set' : ''}${state}`}
                      style={color ? ({ '--vlan': color } as React.CSSProperties) : undefined}
                      disabled={locked}
                      onClick={() => assign(port)}
                      title={port.device}
                    >
                      <span className="vlan-port-num">{port.num}</span>
                      <span className="vlan-port-tag">{v ? (v === 'trunk' ? 'TRK' : v === 'unused' ? 'x' : v) : ''}</span>
                    </button>
                    <span className="vlan-port-device">{port.device}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="vlan-switch-help">Pick a VLAN above, then click each port to tag it.</p>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(assigned))} disabled={!allAssigned(assigned)}>
              Submit &amp; grade →
            </button>
            {!allAssigned(assigned) && <span className="pbq-submit-hint">Tag every port to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{PORTS.length}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / PORTS.length) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'Clean VLAN plan' : 'Review the tagged ports'}</span>
            </div>

            <div className="pbq-insight">
              <span className="pbq-insight-tag">Insight</span>
              <p>
                The pattern the exam wants: a data device gets its department VLAN, an IP phone gets
                the Voice VLAN, anything carrying more than one VLAN (an AP, a switch-to-switch uplink)
                is a trunk, and an empty jack gets shut down. Access port = one VLAN; trunk = all VLANs.
              </p>
            </div>

            <div className="pbq-breakdown">
              {parts.map((part) => (
                <div className={part.ok ? 'pbq-part ok' : 'pbq-part bad'} key={part.id}>
                  <div className="pbq-part-head">
                    <span className="pbq-part-mark">{part.ok ? '✓' : '✗'}</span>
                    <span className="pbq-part-label">{part.label}</span>
                  </div>
                  {!part.ok && (
                    <div className="pbq-part-detail">
                      <span>
                        You: <b className="bad-text">{part.your}</b> · Correct: <b className="ok-text">{part.correct}</b>
                      </span>
                      <span className="pbq-why">{part.why}</span>
                    </div>
                  )}
                </div>
              ))}
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
