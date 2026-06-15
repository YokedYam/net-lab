import { useEffect, useMemo, useRef, useState } from 'react';
import {
  OSI_LAYERS,
  TCPIP_GROUPS,
  OSI_JOURNEY,
  OSI_MNEMONICS,
  CHIP_LABEL,
} from '../osiData';
import type { Chip, ChipKind, OsiLayer } from '../osiData';

const CHIP_KINDS: ChipKind[] = ['mac', 'ip', 'port', 'data', 'fcs'];

const tcpipGroupFor = (n: number) =>
  TCPIP_GROUPS.find((g) => g.spans.includes(n))?.name ?? '';

function ChipRow({ chips, bits }: { chips: Chip[]; bits: boolean }) {
  if (bits) {
    return (
      <div className="osi-bits" aria-label="raw bits on the wire">
        01000110 10110010 00101101 11100100
      </div>
    );
  }
  return (
    <div className="osi-packet">
      {chips.map((c, i) => (
        <span key={`${c.kind}-${i}`} className={`osi-chip ${c.kind}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

export function OsiModel({
  onPractice,
  onResource,
}: {
  onPractice: (pbqId: string) => void;
  onResource: (conceptId: string) => void;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const last = OSI_JOURNEY.length - 1;
  const step = OSI_JOURNEY[i];

  // Auto-advance pacing: give the eye 1 to 3 seconds, scaled to how much there
  // is to read on this step so long notes are not rushed and short ones do not drag.
  const delayMs = (note: string) => Math.min(3000, Math.max(1000, 600 + note.length * 13));

  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setI((n) => Math.min(last, n + 1)), delayMs(step.note));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, i, last, step.note]);

  const phaseLabel =
    step.side === 'send'
      ? 'Encapsulating - heading down'
      : step.side === 'wire'
        ? 'On the wire - just bits'
        : 'De-encapsulating - heading up';

  const replay = () => {
    setI(0);
    setPlaying(true);
  };
  const togglePlay = () => {
    if (i >= last) {
      replay();
      return;
    }
    setPlaying((p) => !p);
  };
  const stepFwd = () => {
    setPlaying(false);
    setI((n) => Math.min(last, n + 1));
  };
  const stepBack = () => {
    setPlaying(false);
    setI((n) => Math.max(0, n - 1));
  };

  // Click a layer on either tower to scrub the animation to that layer.
  const jumpTo = (side: 'send' | 'recv', n: number) => {
    const idx = OSI_JOURNEY.findIndex((s) => s.side === side && s.layer === n);
    if (idx >= 0) {
      setPlaying(false);
      setI(idx);
    }
  };

  const activeSide = step.side;
  const activeLayer = step.layer;

  const isActive = (side: 'send' | 'recv', n: number) => {
    if (activeSide === 'wire') return n === 1; // both Physical rows glow on the wire
    return activeSide === side && activeLayer === n;
  };

  const renderRow = (side: 'send' | 'recv', l: OsiLayer) => {
    const active = isActive(side, l.n);
    return (
      <button
        type="button"
        className={`osi-row ${active ? 'active' : ''}`}
        data-layer={l.n}
        data-side={side}
        onClick={() => jumpTo(side, l.n)}
      >
        <span className="osi-num">{l.n}</span>
        <span className="osi-meta">
          <span className="osi-name">{l.name}</span>
          <span className="osi-job">{active ? l.job : l.examples}</span>
        </span>
        <span className={`osi-tag g${tcpipGroupFor(l.n).toLowerCase()}`}>{l.pdu}</span>
      </button>
    );
  };

  const groups = useMemo(() => TCPIP_GROUPS, []);

  return (
    <div className="study osi">
      <div className="osi-intro">
        <h1>OSI and TCP/IP: watch a packet get wrapped</h1>
        <p className="study-lead">
          One message, two trips. On the way down each layer wraps the data with its own header
          (that is encapsulation). It crosses the wire as bits, then climbs the other side while
          each layer peels its header back off. Step through it or hit play.
        </p>
      </div>

      <div className="osi-stage">
        <div className="osi-caption" data-step={i} data-side={step.side} data-layer={step.layer}>
          <span className="osi-phase">{phaseLabel}</span>
          <span className="osi-pdu">PDU: {step.pdu}</span>
          <p className="osi-note">{step.note}</p>
        </div>

        <div className="osi-packet-bar" data-side={step.side}>
          <span className="osi-dir">
            {step.side === 'send' ? '\u25BC wrapping' : step.side === 'wire' ? '\u25C6 on the wire' : '\u25B2 unwrapping'}
          </span>
          <ChipRow chips={step.chips} bits={step.bits} />
          <span className="osi-pdu-now">{step.bits ? 'Bits' : step.pdu}</span>
        </div>

        <div className="osi-grid">
          <div className="osi-tower-head">Sender</div>
          <div className="osi-grid-spacer" />
          <div className="osi-tower-head">Receiver</div>
          {OSI_LAYERS.map((l: OsiLayer) => (
            <div className="osi-grid-row" key={l.n}>
              <div className="osi-cell send">{renderRow('send', l)}</div>
              <div className="osi-cell mid">
                {l.n === 1 && (
                  <div className="osi-link">
                    <div className={`osi-link-line ${activeSide === 'wire' ? 'hot' : ''}`} />
                    <div className="osi-link-label">the wire</div>
                  </div>
                )}
              </div>
              <div className="osi-cell recv">{renderRow('recv', l)}</div>
            </div>
          ))}
        </div>

        <div className="osi-controls">
          <button className="btn" onClick={stepBack} disabled={i === 0}>
            Back
          </button>
          <button className="big-btn" onClick={togglePlay}>
            {playing ? 'Pause' : i >= last ? 'Replay' : 'Play'}
          </button>
          <button className="btn" onClick={stepFwd} disabled={i >= last}>
            Step
          </button>
          <button className="btn" onClick={replay}>
            Restart
          </button>
          <span className="osi-progress">
            {i + 1} / {OSI_JOURNEY.length}
          </span>
        </div>
      </div>

      <div className="osi-extras">
        <div className="osi-card">
          <h3>The packet pieces</h3>
          <div className="osi-legend">
            {CHIP_KINDS.map((k) => (
              <span key={k} className="osi-legend-item">
                <span className={`osi-chip ${k}`}>{k.toUpperCase()}</span>
                {CHIP_LABEL[k]}
              </span>
            ))}
          </div>
          <p className="osi-fine">
            Headers stack from the outside in. Data Link also adds a trailer (the FCS) to check
            for errors, so it is the only layer that wraps both ends.
          </p>
        </div>

        <div className="osi-card">
          <h3>TCP/IP model: same idea, four layers</h3>
          <div className="osi-tcpip">
            {groups.map((g) => (
              <div key={g.name} className="osi-tcpip-row">
                <span className="osi-tcpip-name">{g.name}</span>
                <span className="osi-tcpip-span">OSI {g.spans.join(', ')}</span>
                <span className="osi-tcpip-note">{g.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="osi-card">
          <h3>Remember the order</h3>
          <div className="osi-mnem">
            {OSI_MNEMONICS.map((m) => (
              <div key={m.phrase} className="osi-mnem-row">
                <span className="osi-mnem-order">{m.order}</span>
                <span className="osi-mnem-phrase">{m.phrase}</span>
                <span className="osi-mnem-hint">{m.hint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="osi-practice">
        <span className="osi-practice-label">Lock it in</span>
        <div className="osi-practice-btns">
          <button className="big-btn" onClick={() => onPractice('pbq-osi')}>
            Practice: map items to layers
          </button>
          <button className="big-btn ghost" onClick={() => onPractice('pbq-osi-teachback')}>
            Teach it back in your words
          </button>
          <button className="btn" onClick={() => onResource('ip')}>
            See it move in the Lab
          </button>
        </div>
      </div>
    </div>
  );
}
