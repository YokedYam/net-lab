import { useState, type ReactNode } from 'react';
import { DeviceGlyph, ToolGlyph } from '../icons';
import type { DeviceType } from '../model';

type DeviceId = 'firewall' | 'router' | 'l3switch' | 'poeswitch' | 'wap' | 'server';
type OutputId = 'exec1' | 'sales1' | 'camera' | 'printer';

interface DeviceOption {
  id: DeviceId;
  label: string;
  short: string;
  detail: string;
}

interface Slot {
  id: string;
  label: string;
  zone: string;
  x: number;
  y: number;
  correct: DeviceId;
  why: string;
}

interface Scenario {
  title: string;
  brief: string;
  slots: Slot[];
}

interface Part {
  id: string;
  label: string;
  your: string;
  correct: string;
  ok: boolean;
  why: string;
}

const DEVICES: DeviceOption[] = [
  { id: 'firewall', label: 'Firewall', short: 'FW', detail: 'filters edge traffic' },
  { id: 'router', label: 'Router', short: 'RTR', detail: 'WAN handoff option' },
  { id: 'l3switch', label: 'Layer 3 switch', short: 'L3', detail: 'routes VLANs' },
  { id: 'poeswitch', label: 'PoE switch', short: 'SW', detail: 'powers APs and cameras' },
  { id: 'wap', label: 'Wireless access point', short: 'AP', detail: 'wireless coverage' },
  { id: 'server', label: 'Server', short: 'SRV', detail: 'internal services' },
];

const OUTPUTS: Record<OutputId, { tab: string; title: string; body: string[] }> = {
  exec1: {
    tab: 'Executive-PC',
    title: 'Executive-PC ipconfig',
    body: [
      'IPv4 Address . . . . . . . . . . : 192.168.10.68',
      'Subnet Mask . . . . . . . . . . : 255.255.255.224',
      'Default Gateway . . . . . . . . : 192.168.10.65',
      '',
      'Hint: /27 block. Gateway .65 means this host belongs in 192.168.10.64/27.',
    ],
  },
  sales1: {
    tab: 'Sales-Laptop',
    title: 'Sales-Laptop ipconfig',
    body: [
      'IPv4 Address . . . . . . . . . . : 192.168.20.44',
      'Subnet Mask . . . . . . . . . . : 255.255.255.192',
      'Default Gateway . . . . . . . . : 192.168.20.1',
      '',
      'Hint: building B users need a routed path back to building A.',
    ],
  },
  camera: {
    tab: 'Camera',
    title: 'Cable test: camera closet uplink',
    body: [
      'Result: PASS',
      'Length: 48 m',
      'Pairs: OK',
      'PoE requested: 15.4 W',
      '',
      'Hint: cameras and WAPs can be fed by PoE switches.',
    ],
  },
  printer: {
    tab: 'Printer',
    title: 'Printer status',
    body: [
      'Model: LaserJet Pro M404n',
      'IP: 192.168.10.70 (DHCP)',
      'Subnet Mask: 255.255.255.224',
      'Gateway: 192.168.10.65',
      'Queue: 0 jobs',
      '',
      'Hint: same /27 subnet as Executive-PC.',
      'Connected via: Floor 2 access switch port Fa0/4',
    ],
  },
};

// All positions below are percentages of the office-map box, so slots,
// endpoints, and connection lines share one coordinate system.
const SCENARIO: Scenario = {
  title: 'Company A office network diagram',
  brief:
    'Fill the empty device slots. The internet should hit security first, building A should route VLANs, building B needs its own access layer, and wireless users need WAP coverage.',
  slots: [
    {
      id: 'edge',
      label: 'Edge security',
      zone: 'Telco cage',
      x: 14,
      y: 58,
      correct: 'firewall',
      why: 'The firewall belongs between the ISP handoff and the inside network so policy is enforced before traffic reaches either building.',
    },
    {
      id: 'core',
      label: 'Core gateway',
      zone: 'Building A MDF',
      x: 30,
      y: 58,
      correct: 'l3switch',
      why: 'A Layer 3 switch is a strong fit for internal VLAN routing and fast switching between office segments.',
    },
    {
      id: 'exec-access',
      label: 'Floor 2 access',
      zone: 'Executive offices',
      x: 46,
      y: 27,
      correct: 'poeswitch',
      why: 'The floor access switch connects workstations, printer, and the WAP uplink.',
    },
    {
      id: 'exec-ap',
      label: 'Executive WAP',
      zone: 'Executive offices',
      x: 80,
      y: 24,
      correct: 'wap',
      why: 'A WAP belongs in the office area where wireless clients need coverage.',
    },
    {
      id: 'server-room',
      label: 'Private services',
      zone: 'Server room',
      x: 47,
      y: 73,
      correct: 'server',
      why: 'Internal services belong inside the trusted network, behind the firewall.',
    },
    {
      id: 'building-b-access',
      label: 'Building B access',
      zone: 'Building B IDF',
      x: 71,
      y: 66,
      correct: 'poeswitch',
      why: 'Building B needs an access switch to connect local users and access points back to the routed core.',
    },
    {
      id: 'building-b-ap',
      label: 'Building B WAP',
      zone: 'Building B offices',
      x: 89,
      y: 63,
      correct: 'wap',
      why: 'A second WAP gives the remote building wireless coverage instead of forcing clients to reach building A.',
    },
  ],
};

// Fixed endpoints (not graded). Positioned in the same office-map coordinate
// system as the slots so nothing overlaps and the lines line up.
interface Endpoint {
  id: string;
  kind: 'printer' | 'pc' | 'laptop' | 'camera';
  label: string;
  x: number;
  y: number;
  output: OutputId;
}

const ENDPOINTS: Endpoint[] = [
  { id: 'printer', kind: 'printer', label: 'Printer', x: 62, y: 19, output: 'printer' },
  { id: 'exec-pc', kind: 'pc', label: 'Executive-PC', x: 63, y: 38, output: 'exec1' },
  { id: 'sales', kind: 'laptop', label: 'Sales laptop', x: 71, y: 85, output: 'sales1' },
  { id: 'camera', kind: 'camera', label: 'Camera', x: 89, y: 85, output: 'camera' },
];

// Connection lines, drawn in the same 0-100 space (preserveAspectRatio="none"
// makes 1 unit = 1%). Each line runs between two node centers; nodes render on
// top, so the line tucks neatly under each box.
const LINES: string[] = [
  // The spine zones (Telco cage, Building A MDF, Server room) carry a label in
  // their top-left, so every trunk cable routes to dodge that strip: the WAN
  // drops down the left margin, the Floor 2 uplink exits the MDF on its right
  // below the label, and the two right-hand branches stay below the labels.
  'M9 20 C5 27 4 33 4 43 L4 55 C4 57 5 58 8 58', // internet -> edge (down the left margin)
  'M14 58 L30 58', // edge -> core
  'M30 58 C34 57 37 56 38 54 C42 44 44 33 46 27', // core -> floor 2 access (exit MDF right, then up)
  'M30 58 C34 66 40 72 47 73', // core -> private services (under the Server room label)
  'M30 58 C36 63 45 65 53 65 C60 65 66 65 71 66', // core -> building B access (below the labels)
  'M46 27 C52 23 56 21 62 19', // floor 2 -> printer
  'M46 27 C52 31 57 35 63 38', // floor 2 -> executive PC
  'M46 27 C58 24 70 23 80 24', // floor 2 -> executive WAP
  'M71 66 L71 85', // building B -> sales laptop
  'M71 66 C78 65 84 64 89 63', // building B -> building B WAP
  'M71 66 C76 74 83 81 89 85', // building B -> camera
];

function deviceLabel(id: DeviceId): string {
  return DEVICES.find((device) => device.id === id)?.label ?? id;
}

function deviceShort(id: DeviceId): string {
  return DEVICES.find((device) => device.id === id)?.short ?? id;
}

const DEVICE_GLYPHS: Partial<Record<DeviceId, DeviceType>> = {
  firewall: 'firewall',
  router: 'router',
  l3switch: 'switch',
  poeswitch: 'switch',
  server: 'server',
};

function SvgFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`topo-svg ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function DeviceIcon({ id }: { id: DeviceId }) {
  if (id === 'wap') {
    return (
      <SvgFrame className="wap-svg">
        <rect x="8" y="14" width="8" height="6" rx="1.5" />
        <path d="M6.2 10.2a8.2 8.2 0 0 1 11.6 0" />
        <path d="M8.8 12.7a4.6 4.6 0 0 1 6.4 0" />
        <path d="M12 16v.01" />
      </SvgFrame>
    );
  }

  return (
    <SvgFrame>
      <DeviceGlyph type={DEVICE_GLYPHS[id] ?? 'switch'} />
    </SvgFrame>
  );
}

function EndpointIcon({ kind }: { kind: 'internet' | 'printer' | 'pc' | 'laptop' | 'camera' }) {
  if (kind === 'internet') {
    return (
      <SvgFrame className="cloud-svg">
        <path d="M7.2 17.5h9.3a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.3-1.8A4.9 4.9 0 0 0 7.2 17.5z" />
      </SvgFrame>
    );
  }

  if (kind === 'printer') {
    return (
      <SvgFrame>
        <path d="M7 8V4.5h10V8" />
        <rect x="5" y="8" width="14" height="8" rx="1.5" />
        <path d="M8 14h8v5H8zM8 6h8M17 11h.01" />
      </SvgFrame>
    );
  }

  if (kind === 'camera') {
    return (
      <SvgFrame>
        <rect x="4" y="8" width="11" height="8" rx="1.5" />
        <path d="m15 11 5-2.5v7L15 13" />
        <path d="M7.5 18.5h5" />
      </SvgFrame>
    );
  }

  return (
    <SvgFrame>
      <DeviceGlyph type={kind} />
    </SvgFrame>
  );
}

function grade(placed: Record<string, DeviceId>): Part[] {
  return SCENARIO.slots.map((slot) => {
    const your = placed[slot.id];
    return {
      id: slot.id,
      label: `${slot.zone}: ${slot.label}`,
      your: your ? deviceLabel(your) : '(empty)',
      correct: deviceLabel(slot.correct),
      ok: your === slot.correct,
      why: slot.why,
    };
  });
}

function allPlaced(placed: Record<string, DeviceId>): boolean {
  return SCENARIO.slots.every((slot) => placed[slot.id]);
}

export function TopologyPlacementDrill({ onBack }: { onBack?: () => void } = {}) {
  const [selected, setSelected] = useState<DeviceId>('firewall');
  const [placed, setPlaced] = useState<Record<string, DeviceId>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const [outputId, setOutputId] = useState<OutputId>('exec1');
  const locked = parts !== null;
  const correct = parts?.filter((part) => part.ok).length ?? 0;
  const perfect = locked && correct === SCENARIO.slots.length;

  const reset = () => {
    setPlaced({});
    setParts(null);
    setSelected('firewall');
  };

  const place = (slot: Slot) => {
    if (locked) return;
    setPlaced((current) => ({ ...current, [slot.id]: selected }));
  };

  const clearSlot = (slotId: string) => {
    if (locked) return;
    setPlaced((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  };

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Visual topology PBQ</span>
          <span className="qs-topic"> · office device placement</span>
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

      <div className="pbq-card visual-topo-card">
        <h2 className="pbq-title">{SCENARIO.title}</h2>
        <p className="pbq-scenario">{SCENARIO.brief}</p>

        <div className="visual-topo-shell">
          <aside className="topo-palette" aria-label="Device palette">
            <span className="topo-panel-label">Devices</span>
            {!locked && (
              <div className="topo-selected-status">
                Placing: <b>{deviceLabel(selected)}</b>
              </div>
            )}
            {DEVICES.map((device) => (
              <button
                key={device.id}
                className={selected === device.id ? 'topo-device active' : 'topo-device'}
                disabled={locked}
                onClick={() => setSelected(device.id)}
              >
                <span className="topo-device-icon">
                  <DeviceIcon id={device.id} />
                </span>
                <span className="topo-device-copy">
                  <b>{device.label}</b>
                  <small>{device.detail}</small>
                </span>
              </button>
            ))}
            <div className="topo-mini-help">Pick a device, then click an empty slot on the diagram.</div>
          </aside>

          <div className="office-map" aria-label="Company A office diagram">
            <div className="map-zone internet-zone">
              <EndpointIcon kind="internet" />
              <span>Internet</span>
            </div>
            <div className="map-zone telco-zone">
              <span>Telco cage</span>
            </div>
            <div className="map-zone mdf-zone">
              <span>Building A MDF</span>
            </div>
            <div className="map-zone exec-zone">
              <span>Floor 2: Executive offices</span>
            </div>
            <div className="map-zone server-zone">
              <span>Server room</span>
            </div>
            <div className="map-zone building-b-zone">
              <span>Building B offices</span>
            </div>

            <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {LINES.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>

            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                className={`map-endpoint ${ep.kind}`}
                style={{ left: `${ep.x}%`, top: `${ep.y}%` }}
                onClick={() => setOutputId(ep.output)}
              >
                <EndpointIcon kind={ep.kind} />
                <span>{ep.label}</span>
              </button>
            ))}

            {SCENARIO.slots.map((slot) => {
              const device = placed[slot.id];
              const part = parts?.find((item) => item.id === slot.id);
              const state = locked ? (part?.ok ? ' ok' : ' bad') : '';
              return (
                <div
                  key={slot.id}
                  className={`map-slot${device ? ' filled' : ''}${state}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  role="button"
                  tabIndex={locked ? -1 : 0}
                  onClick={() => place(slot)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      place(slot);
                    }
                  }}
                >
                  {device ? (
                    <>
                      <span className="map-device-art">
                        <DeviceIcon id={device} />
                      </span>
                      <span className="map-device-name">
                        <b>{deviceShort(device)}</b>
                        <small>{deviceLabel(device)}</small>
                      </span>
                      {!locked && (
                        <button
                          type="button"
                          className="map-clear"
                          aria-label={`Clear ${slot.label}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            clearSlot(slot.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <ToolGlyph kind="delete" />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="map-empty-mark">?</span>
                      <span>{slot.label}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="topo-terminal">
            <span className="topo-panel-label">Command output</span>
            <div className="terminal-tabs">
              {Object.entries(OUTPUTS).map(([id, output]) => (
                <button key={id} className={outputId === id ? 'active' : ''} onClick={() => setOutputId(id as OutputId)}>
                  {output.tab}
                </button>
              ))}
            </div>
            <div className="terminal-window">
              <b>{OUTPUTS[outputId].title}</b>
              {OUTPUTS[outputId].body.map((line, i) => (
                <span key={`${line}-${i}`}>{line || ' '}</span>
              ))}
            </div>
          </aside>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(placed))} disabled={!allPlaced(placed)}>
              Submit &amp; grade →
            </button>
            {!allPlaced(placed) && <span className="pbq-submit-hint">Fill every empty slot to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{SCENARIO.slots.length}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / SCENARIO.slots.length) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'Clean layout' : 'Review the placements'}</span>
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
