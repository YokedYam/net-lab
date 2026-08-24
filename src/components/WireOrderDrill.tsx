import { useMemo, useState } from 'react';
import { ExamShell, ExamQuestionPanel, ExamScore } from './ExamChrome';

// T568A and T568B wiring PBQ. Drag or click two wires to swap them until both
// ends of the cable match the standard named under the connector. Getting one
// end on A and the other on B is what makes it a crossover.

type WireId = 'wg' | 'g' | 'wo' | 'o' | 'wbl' | 'bl' | 'wbr' | 'br';

interface Wire {
  id: WireId;
  name: string;
  color: string;
  striped: boolean;
}

const WIRES: Record<WireId, Wire> = {
  wg: { id: 'wg', name: 'White / Green', color: '#2f9e44', striped: true },
  g: { id: 'g', name: 'Green', color: '#2f9e44', striped: false },
  wo: { id: 'wo', name: 'White / Orange', color: '#f08c1e', striped: true },
  o: { id: 'o', name: 'Orange', color: '#f08c1e', striped: false },
  wbl: { id: 'wbl', name: 'White / Blue', color: '#2b6cb0', striped: true },
  bl: { id: 'bl', name: 'Blue', color: '#2b6cb0', striped: false },
  wbr: { id: 'wbr', name: 'White / Brown', color: '#7a5230', striped: true },
  br: { id: 'br', name: 'Brown', color: '#7a5230', striped: false },
};

const T568A: WireId[] = ['wg', 'g', 'wo', 'bl', 'wbl', 'o', 'wbr', 'br'];
const T568B: WireId[] = ['wo', 'o', 'wg', 'bl', 'wbl', 'g', 'wbr', 'br'];

type EndId = 'a' | 'b';

interface EndSpec {
  id: EndId;
  label: string;
  answer: WireId[];
}

const ENDS: EndSpec[] = [
  { id: 'a', label: 'EIA/TIA 568A', answer: T568A },
  { id: 'b', label: 'EIA/TIA 568B', answer: T568B },
];

const SCENARIO = [
  'A technician needs a crossover cable to link two switches that do not support automatic medium dependent interface crossover.',
  'Both ends have been punched down in the wrong order, so the cable does not pass traffic.',
];

const INSTRUCTIONS = [
  'Reorder the wires so each connector matches the standard printed underneath it.',
  'Click one wire and then click another to swap them, or drag a wire onto the pin you want it in.',
  'A crossover cable is wired to T568A on one end and T568B on the other. That is what puts the transmit pair of one device onto the receive pair of the other.',
  'When both ends are arranged, click Submit to check your score.',
];

const FOOT = 'The two standards only differ on pins 1, 2, 3 and 6. The blue pair and the brown pair never move.';

// A deterministic-enough scramble so a fresh attempt never opens solved.
function scramble(answer: WireId[]): WireId[] {
  const out = [...answer];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // A scramble that lands on the answer would be a strange thing to hand someone.
  if (out.every((w, i) => w === answer[i])) {
    [out[0], out[5]] = [out[5], out[0]];
  }
  return out;
}

function WireStrip({ wire }: { wire: Wire }) {
  const style = wire.striped
    ? {
        background: `repeating-linear-gradient(-38deg, #ffffff 0 7px, ${wire.color} 7px 13px)`,
      }
    : { background: wire.color };
  return <span className="wire-strip" style={style} />;
}

interface Pick {
  end: EndId;
  index: number;
}

export function WireOrderDrill({ onBack }: { onBack?: () => void } = {}) {
  const [order, setOrder] = useState<Record<EndId, WireId[]>>(() => ({
    a: scramble(T568A),
    b: scramble(T568B),
  }));
  const [pick, setPick] = useState<Pick | null>(null);
  const [showQ, setShowQ] = useState(true);
  const [checked, setChecked] = useState(false);

  const swap = (end: EndId, i: number, j: number) => {
    if (i === j) return;
    setOrder((o) => {
      const next = [...o[end]];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...o, [end]: next };
    });
  };

  const onPinClick = (end: EndId, index: number) => {
    if (checked) return;
    if (!pick) {
      setPick({ end, index });
      return;
    }
    if (pick.end !== end) {
      setPick({ end, index });
      return;
    }
    swap(end, pick.index, index);
    setPick(null);
  };

  const reset = () => {
    setOrder({ a: scramble(T568A), b: scramble(T568B) });
    setPick(null);
    setChecked(false);
  };

  const results = useMemo(
    () =>
      ENDS.map((e) => ({
        end: e,
        hits: order[e.id].map((w, i) => w === e.answer[i]),
      })),
    [order]
  );

  const correctPins = results.reduce((n, r) => n + r.hits.filter(Boolean).length, 0);
  const endOk = (id: EndId) => results.find((r) => r.end.id === id)!.hits.every(Boolean);

  return (
    <ExamShell
      title="Cable Wiring Simulation"
      lead="Read the question carefully, follow the instructions, and then click the submit button when you have finished. You will receive a numeric score once you have submitted a response."
      sectionLabel="Crossover Cable Termination"
      onSubmit={checked ? undefined : () => setChecked(true)}
      submitLabel="Check score"
      onReset={reset}
      onShowQuestion={() => setShowQ((v) => !v)}
      questionOpen={showQ}
      onBack={onBack}
    >
      <div className="csim-work wire-work">
        {showQ && <ExamQuestionPanel scenario={SCENARIO} instructions={INSTRUCTIONS} footNote={FOOT} onClose={() => setShowQ(false)} />}

        <div className="wire-main">
          <p className="wire-task">
            Reorder the wires by dragging them into the EIA/TIA 568 arrangement specified so that communication through the
            crossover cable can occur.
          </p>

          <div className="wire-pair">
            {ENDS.map((e) => {
              const res = results.find((r) => r.end.id === e.id)!;
              return (
                <div className="wire-jack" key={e.id}>
                  <div className="wire-pins">
                    {order[e.id].map((wid, i) => {
                      const selected = pick?.end === e.id && pick.index === i;
                      const state = checked ? (res.hits[i] ? ' ok' : ' bad') : '';
                      return (
                        <div
                          key={`${e.id}-${i}`}
                          className={`wire-pin${selected ? ' sel' : ''}${state}`}
                          draggable={!checked}
                          onClick={() => onPinClick(e.id, i)}
                          onDragStart={() => setPick({ end: e.id, index: i })}
                          onDragOver={(ev) => ev.preventDefault()}
                          onDrop={(ev) => {
                            ev.preventDefault();
                            if (pick && pick.end === e.id) swap(e.id, pick.index, i);
                            setPick(null);
                          }}
                          role="button"
                          tabIndex={checked ? -1 : 0}
                          onKeyDown={(ev) => ev.key === 'Enter' && onPinClick(e.id, i)}
                          aria-label={`${e.label} pin ${i + 1}: ${WIRES[wid].name}`}
                        >
                          <span className="wire-pin-num">{i + 1}</span>
                          <WireStrip wire={WIRES[wid]} />
                          <span className="wire-pin-name">{WIRES[wid].name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="wire-jack-label">{e.label}</div>
                  {checked && (
                    <div className={endOk(e.id) ? 'wire-badge ok' : 'wire-badge bad'}>{endOk(e.id) ? '✓' : '✗'}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="wire-cable">
            <svg viewBox="0 0 420 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M40 4 C40 44, 180 44, 180 30" fill="none" stroke="#9aa5ae" strokeWidth="7" strokeLinecap="round" />
              <path d="M380 4 C380 44, 240 44, 240 30" fill="none" stroke="#9aa5ae" strokeWidth="7" strokeLinecap="round" />
            </svg>
            <span className="wire-cable-tag">Crossover Cable</span>
          </div>
        </div>
      </div>

      {checked && (
        <div className="csim-results">
          <ExamScore correct={correctPins} total={16} passLabel="Both ends terminated correctly" failLabel="Check the pins marked in red" />
          <div className="csim-insight">
            <span className="csim-insight-tag">The takeaway</span>
            <p>
              Learn one standard and you get the other for free. T568B is white orange, orange, white green, blue, white blue,
              green, white brown, brown. T568A is the same list with the orange pair and the green pair traded. Pins 4, 5, 7
              and 8 are identical in both, so only four wires ever move. Same standard on both ends is a straight through
              patch cable; A on one end and B on the other is a crossover.
            </p>
          </div>
          <div className="csim-parts">
            {ENDS.map((e) => {
              const res = results.find((r) => r.end.id === e.id)!;
              const wrong = res.hits.map((ok, i) => ({ ok, i })).filter((h) => !h.ok);
              return (
                <div className={wrong.length === 0 ? 'csim-part ok' : 'csim-part bad'} key={e.id}>
                  <div className="csim-part-head">
                    <span className="csim-part-mark">{wrong.length === 0 ? '✓' : '✗'}</span>
                    <span>
                      {e.label} end: {8 - wrong.length} of 8 pins correct
                    </span>
                  </div>
                  {wrong.length > 0 && (
                    <div className="csim-part-diff">
                      {wrong.map((h) => (
                        <span key={h.i}>
                          Pin {h.i + 1}: you placed <b className="bad-text">{WIRES[order[e.id][h.i]].name}</b>, the standard
                          calls for <b className="ok-text">{WIRES[e.answer[h.i]].name}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
