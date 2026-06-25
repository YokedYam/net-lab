import { useState } from 'react';

// Wireless channel-plan PBQ. Assign 2.4GHz channels to a row of APs whose
// coverage overlaps. Graded by RULE, not a fixed key: an AP is right if it uses
// a non-overlapping channel (1/6/11) AND shares no channel with any AP whose
// coverage overlaps it. That accepts every valid 1-6-11 reuse plan.

interface Ap {
  id: string;
  label: string;
}

interface Part {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

// Six APs down a corridor. Coverage reaches the AP on either side and the one
// past it, so a channel must differ from its neighbors within two positions.
const APS: Ap[] = [
  { id: 'ap1', label: 'AP-1' },
  { id: 'ap2', label: 'AP-2' },
  { id: 'ap3', label: 'AP-3' },
  { id: 'ap4', label: 'AP-4' },
  { id: 'ap5', label: 'AP-5' },
  { id: 'ap6', label: 'AP-6' },
];

const CHANNELS = ['1', '3', '6', '9', '11'];
const NON_OVERLAP = new Set(['1', '6', '11']);

const CHANNEL_COLOR: Record<string, string> = {
  '1': '#3b82f6',
  '6': '#f59e0b',
  '11': '#a855f7',
  '3': '#ef4444',
  '9': '#ef4444',
};

// neighbors = any AP within two positions (its coverage overlaps theirs)
const neighborsOf = (i: number): number[] =>
  APS.map((_, j) => j).filter((j) => j !== i && Math.abs(i - j) <= 2);

function grade(channels: Record<string, string>): Part[] {
  return APS.map((ap, i) => {
    const ch = channels[ap.id];
    const validBand = NON_OVERLAP.has(ch);
    const clashes = neighborsOf(i)
      .filter((j) => channels[APS[j].id] === ch)
      .map((j) => APS[j].label);
    const ok = validBand && clashes.length === 0;

    let detail: string;
    if (!validBand) {
      detail = `Channel ${ch} overlaps its neighbors. On 2.4GHz only 1, 6, and 11 do not overlap, so stick to those three.`;
    } else if (clashes.length > 0) {
      detail = `Co-channel interference: ${ap.label} is on ${ch} and so is ${clashes.join(', ')} within range. Overlapping cells must use different channels.`;
    } else {
      detail = `Channel ${ch} is non-overlapping and clear of every AP in range.`;
    }
    return { id: ap.id, label: `${ap.label} on channel ${ch || '(unset)'}`, ok, detail };
  });
}

const allSet = (channels: Record<string, string>): boolean => APS.every((ap) => channels[ap.id]);

export function WirelessChannelDrill({ onBack }: { onBack?: () => void } = {}) {
  const [channels, setChannels] = useState<Record<string, string>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;
  const correct = parts?.filter((p) => p.ok).length ?? 0;
  const perfect = locked && correct === APS.length;

  const reset = () => {
    setChannels({});
    setParts(null);
  };

  const partFor = (id: string) => parts?.find((p) => p.id === id) ?? null;

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Wireless channel PBQ</span>
          <span className="qs-topic"> · 2.4GHz channel plan</span>
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
        <h2 className="pbq-title">Plan the 2.4GHz channels</h2>
        <p className="pbq-scenario">
          Six access points line a corridor and their coverage overlaps. Give each AP a channel so no
          two APs within range share one. On 2.4GHz only channels 1, 6, and 11 do not overlap, so
          build your plan from those three.
        </p>

        <div className="wifi-legend">
          <span className="wifi-chip" style={{ '--c': CHANNEL_COLOR['1'] } as React.CSSProperties}>
            <i /> Ch 1
          </span>
          <span className="wifi-chip" style={{ '--c': CHANNEL_COLOR['6'] } as React.CSSProperties}>
            <i /> Ch 6
          </span>
          <span className="wifi-chip" style={{ '--c': CHANNEL_COLOR['11'] } as React.CSSProperties}>
            <i /> Ch 11
          </span>
          <span className="wifi-chip muted">
            <i style={{ background: '#ef4444' }} /> 3 / 9 overlap, avoid
          </span>
        </div>

        <div className="wifi-floor">
          <div className="wifi-aps">
            {APS.map((ap) => {
              const ch = channels[ap.id];
              const part = partFor(ap.id);
              const state = locked ? (part?.ok ? ' ok' : ' bad') : '';
              const color = ch ? CHANNEL_COLOR[ch] : '#94a3b8';
              return (
                <div className="wifi-ap" key={ap.id}>
                  <span className="wifi-coverage" style={{ background: color }} />
                  <span className={`wifi-node${state}`} style={{ color }}>
                    <svg className="topo-svg wap-svg" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="8" y="14" width="8" height="6" rx="1.5" />
                      <path d="M6.2 10.2a8.2 8.2 0 0 1 11.6 0" />
                      <path d="M8.8 12.7a4.6 4.6 0 0 1 6.4 0" />
                      <path d="M12 16v.01" />
                    </svg>
                  </span>
                  <span className="wifi-ap-label">{ap.label}</span>
                  <select
                    className="wifi-select"
                    value={ch ?? ''}
                    disabled={locked}
                    onChange={(e) => setChannels((c) => ({ ...c, [ap.id]: e.target.value }))}
                  >
                    <option value="">Ch…</option>
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        Ch {c}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(channels))} disabled={!allSet(channels)}>
              Submit &amp; grade →
            </button>
            {!allSet(channels) && <span className="pbq-submit-hint">Pick a channel for every AP to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{APS.length}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / APS.length) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'No interference' : 'Fix the overlaps'}</span>
            </div>

            <div className="pbq-insight">
              <span className="pbq-insight-tag">Insight</span>
              <p>
                2.4GHz only has three non-overlapping channels: 1, 6, and 11. Down a row of APs you
                repeat them, 1, 6, 11, 1, 6, 11, so no AP ever shares a channel with another inside its
                coverage. Picking 3 or 9 may feel like spacing them out, but those channels bleed into 1,
                6, and 11 and cause adjacent-channel interference.
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
                      <span className="pbq-why">{part.detail}</span>
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
