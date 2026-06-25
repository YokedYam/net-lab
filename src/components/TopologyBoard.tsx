import { useState, type ReactNode } from 'react';
import { DeviceGlyph, ToolGlyph } from '../icons';
import type { DeviceType } from '../model';

// Reusable engine for "place the devices on the diagram" PBQs. Everything that
// changes between scenarios (devices, zones, slots, endpoints, cables, terminal
// output) is data; this component just renders and grades it. Slots, endpoints,
// zones, and cables all live in one 0-100 percentage coordinate system so they
// line up no matter how wide the board renders.

export type Glyph = DeviceType | 'wap';
export type EndpointKind = 'internet' | 'printer' | 'pc' | 'laptop' | 'camera';

export interface DeviceOption {
  id: string;
  label: string;
  short: string;
  detail: string;
  glyph: Glyph;
}

export interface ZoneDef {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tint?: string;
  dashed?: boolean;
  circle?: boolean; // internet-style pill with an icon
  icon?: EndpointKind;
  labelRight?: boolean;
}

export interface SlotDef {
  id: string;
  label: string;
  zone: string;
  x: number;
  y: number;
  correct: string; // device id
  why: string;
}

export interface EndpointDef {
  id: string;
  kind: EndpointKind;
  label: string;
  x: number;
  y: number;
  output: string;
}

export interface OutputDef {
  tab: string;
  title: string;
  body: string[];
}

export interface TopologyScenario {
  statusTag: string; // shown in the status bar
  mapLabel: string; // aria-label for the diagram
  title: string;
  brief: string;
  devices: DeviceOption[];
  zones: ZoneDef[];
  slots: SlotDef[];
  endpoints: EndpointDef[];
  lines: string[];
  outputs: Record<string, OutputDef>;
}

interface Part {
  id: string;
  label: string;
  your: string;
  correct: string;
  ok: boolean;
  why: string;
}

function SvgFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`topo-svg ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function DeviceIcon({ glyph }: { glyph: Glyph }) {
  if (glyph === 'wap') {
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
      <DeviceGlyph type={glyph} />
    </SvgFrame>
  );
}

function EndpointIcon({ kind }: { kind: EndpointKind }) {
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

export function TopologyBoard({ scenario, onBack }: { scenario: TopologyScenario; onBack?: () => void }) {
  const deviceById = (id: string) => scenario.devices.find((d) => d.id === id);
  const deviceLabel = (id: string) => deviceById(id)?.label ?? id;
  const deviceShort = (id: string) => deviceById(id)?.short ?? id;
  const deviceGlyph = (id: string): Glyph => deviceById(id)?.glyph ?? 'switch';

  const outputIds = Object.keys(scenario.outputs);

  const [selected, setSelected] = useState<string>(scenario.devices[0]?.id ?? '');
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const [outputId, setOutputId] = useState<string>(outputIds[0] ?? '');
  const locked = parts !== null;
  const correct = parts?.filter((part) => part.ok).length ?? 0;
  const perfect = locked && correct === scenario.slots.length;

  const reset = () => {
    setPlaced({});
    setParts(null);
    setSelected(scenario.devices[0]?.id ?? '');
  };

  const place = (slot: SlotDef) => {
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

  const grade = (): Part[] =>
    scenario.slots.map((slot) => {
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

  const allPlaced = scenario.slots.every((slot) => placed[slot.id]);

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Visual topology PBQ</span>
          <span className="qs-topic"> · {scenario.statusTag}</span>
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
        <h2 className="pbq-title">{scenario.title}</h2>
        <p className="pbq-scenario">{scenario.brief}</p>

        <div className="visual-topo-shell">
          <aside className="topo-palette" aria-label="Device palette">
            <span className="topo-panel-label">Devices</span>
            {!locked && (
              <div className="topo-selected-status">
                Placing: <b>{deviceLabel(selected)}</b>
              </div>
            )}
            {scenario.devices.map((device) => (
              <button
                key={device.id}
                className={selected === device.id ? 'topo-device active' : 'topo-device'}
                disabled={locked}
                onClick={() => setSelected(device.id)}
              >
                <span className="topo-device-icon">
                  <DeviceIcon glyph={device.glyph} />
                </span>
                <span className="topo-device-copy">
                  <b>{device.label}</b>
                  <small>{device.detail}</small>
                </span>
              </button>
            ))}
            <div className="topo-mini-help">Pick a device, then click an empty slot on the diagram.</div>
          </aside>

          <div className="office-map" aria-label={scenario.mapLabel}>
            {scenario.zones.map((z) => (
              <div
                key={z.id}
                className={`map-zone${z.circle ? ' is-circle' : ''}${z.labelRight ? ' label-right' : ''}`}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                  background: z.tint,
                  borderStyle: z.dashed ? 'dashed' : undefined,
                }}
              >
                {z.circle && z.icon && <EndpointIcon kind={z.icon} />}
                <span>{z.label}</span>
              </div>
            ))}

            <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {scenario.lines.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>

            {scenario.endpoints.map((ep) => (
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

            {scenario.slots.map((slot) => {
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
                        <DeviceIcon glyph={deviceGlyph(device)} />
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
              {outputIds.map((id) => (
                <button key={id} className={outputId === id ? 'active' : ''} onClick={() => setOutputId(id)}>
                  {scenario.outputs[id].tab}
                </button>
              ))}
            </div>
            <div className="terminal-window">
              <b>{scenario.outputs[outputId]?.title}</b>
              {scenario.outputs[outputId]?.body.map((line, i) => (
                <span key={`${line}-${i}`}>{line || ' '}</span>
              ))}
            </div>
          </aside>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade())} disabled={!allPlaced}>
              Submit &amp; grade →
            </button>
            {!allPlaced && <span className="pbq-submit-hint">Fill every empty slot to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{scenario.slots.length}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / scenario.slots.length) * 100)}%</span>
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
