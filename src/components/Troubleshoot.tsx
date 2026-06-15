import { useEffect, useRef, useState } from 'react';
import {
  TSHOOT_STEPS,
  CLI_TOOLS,
  TRACE_HOPS,
  TRACE_VERDICT,
  ARP_ROWS,
  ARP_NOTE,
} from '../troubleshootData';
import type { CliTool, ArpState } from '../troubleshootData';

const ARP_LABEL: Record<ArpState, string> = {
  dynamic: 'dynamic',
  static: 'static',
  incomplete: 'incomplete',
};

// Longest round-trip in the scenario, used to scale the latency bars.
const MAX_RTT = Math.max(...TRACE_HOPS.map((h) => h.rtt ?? 0));

export function Troubleshoot({
  onPractice,
  onResource,
}: {
  onPractice: (pbqId: string) => void;
  onResource: (conceptId: string) => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [toolId, setToolId] = useState<string>(CLI_TOOLS[0].id);
  const [hopsShown, setHopsShown] = useState(TRACE_HOPS.length);
  const traceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TSHOOT_STEPS[stepIdx];
  const tool: CliTool = CLI_TOOLS.find((t) => t.id === toolId) ?? CLI_TOOLS[0];
  const lastStep = TSHOOT_STEPS.length - 1;

  // Reveal traceroute hops one at a time so the path "discovers" itself.
  useEffect(() => {
    if (hopsShown >= TRACE_HOPS.length) return;
    traceTimer.current = setTimeout(() => setHopsShown((n) => n + 1), 650);
    return () => {
      if (traceTimer.current) clearTimeout(traceTimer.current);
    };
  }, [hopsShown]);

  const runTrace = () => setHopsShown(0);

  const selectTool = (t: CliTool) => {
    setToolId(t.id);
    if (t.visual === 'trace') runTrace();
  };

  return (
    <div className="study ts">
      <div className="ts-intro">
        <h1>Troubleshooting: a method, not a guess</h1>
        <p className="study-lead">
          The biggest slice of the exam. Work the seven steps in order, then learn what each
          command-line tool actually proves. Two of them, traceroute and arp, run live below.
        </p>
      </div>

      <section className="ts-block">
        <h2 className="ts-h2">The seven steps, in order</h2>
        <div className="ts-steps" role="tablist" aria-label="troubleshooting steps">
          {TSHOOT_STEPS.map((s, idx) => (
            <button
              key={s.n}
              role="tab"
              aria-selected={idx === stepIdx}
              className={`ts-step ${idx === stepIdx ? 'active' : ''} ${idx < stepIdx ? 'done' : ''}`}
              onClick={() => setStepIdx(idx)}
            >
              <span className="ts-step-n">{s.n}</span>
              <span className="ts-step-name">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="ts-step-card" data-step={step.n}>
          <div className="ts-step-head">
            <span className="ts-step-badge">Step {step.n}</span>
            <h3>{step.name}</h3>
          </div>
          <p className="ts-step-action">{step.action}</p>
          <div className="ts-step-applied">
            <span className="ts-tag-applied">On the job</span>
            <p>{step.applied}</p>
          </div>
          <div className="ts-step-tip">
            <span className="ts-tag-tip">Exam tip</span>
            <p>{step.tip}</p>
          </div>
        </div>

        <div className="ts-step-controls">
          <button className="btn" onClick={() => setStepIdx((n) => Math.max(0, n - 1))} disabled={stepIdx === 0}>
            Back
          </button>
          <button
            className="big-btn"
            onClick={() => setStepIdx((n) => Math.min(lastStep, n + 1))}
            disabled={stepIdx >= lastStep}
          >
            Next step
          </button>
          <button className="btn" onClick={() => setStepIdx(0)}>
            Restart
          </button>
          <span className="ts-progress">
            {stepIdx + 1} / {TSHOOT_STEPS.length}
          </span>
        </div>
      </section>

      <section className="ts-block">
        <h2 className="ts-h2">What each tool proves</h2>
        <p className="ts-sub">
          The exam rarely asks what a command is. It asks which one answers the question in front of
          you. Pick a tool to see the command and a real line of output.
        </p>
        <div className="ts-tools">
          {CLI_TOOLS.map((t) => (
            <button
              key={t.id}
              className={`ts-tool ${t.id === toolId ? 'active' : ''}`}
              onClick={() => selectTool(t)}
            >
              <span className="ts-tool-name">{t.name}</span>
              <span className="ts-tool-proves">{t.proves}</span>
              {t.visual && <span className="ts-tool-live">live below</span>}
            </button>
          ))}
        </div>

        <div className="ts-term" data-tool={tool.id}>
          <div className="ts-term-bar">
            <span className="ts-dot r" />
            <span className="ts-dot y" />
            <span className="ts-dot g" />
            <span className="ts-term-title">{tool.name}</span>
            <span className="ts-term-layer">{tool.layer}</span>
          </div>
          <div className="ts-term-body">
            <p className="ts-term-cmd">
              <span className="ts-prompt">$</span> {tool.cmd}
            </p>
            <p className="ts-term-out">{tool.sample}</p>
            <p className="ts-term-proves">
              <span className="ts-term-q">Answers:</span> {tool.proves}
            </p>
          </div>
        </div>
      </section>

      <section className="ts-block">
        <h2 className="ts-h2">traceroute: find where the path breaks</h2>
        <div className="ts-trace">
          {TRACE_HOPS.map((h, idx) => {
            const shown = idx < hopsShown;
            const pct = h.rtt != null ? Math.max(8, (h.rtt / MAX_RTT) * 100) : 0;
            return (
              <div key={h.n} className={`ts-hop ${shown ? 'in' : 'pending'} ${h.rtt == null ? 'dead' : ''}`}>
                <span className="ts-hop-n">{h.n}</span>
                <span className="ts-hop-ip">{shown ? h.ip : '...'}</span>
                <span className="ts-hop-host">{shown ? h.host : ''}</span>
                <span className="ts-hop-bar-wrap">
                  {shown && h.rtt != null && (
                    <span className="ts-hop-bar" style={{ width: `${pct}%` }}>
                      {h.rtt}ms
                    </span>
                  )}
                  {shown && h.rtt == null && <span className="ts-hop-timeout">request timed out</span>}
                </span>
                <span className="ts-hop-note">{shown ? h.note : ''}</span>
              </div>
            );
          })}
          <div className="ts-trace-foot">
            <button className="btn" onClick={runTrace}>
              Run it again
            </button>
            <p className="ts-verdict">{TRACE_VERDICT}</p>
          </div>
        </div>
      </section>

      <section className="ts-block">
        <h2 className="ts-h2">arp -a: the IP to MAC table</h2>
        <div className="ts-arp">
          <div className="ts-arp-row ts-arp-head">
            <span>IP address</span>
            <span>MAC address</span>
            <span>state</span>
            <span>what it tells you</span>
          </div>
          {ARP_ROWS.map((r) => (
            <div key={r.ip} className={`ts-arp-row ${r.state}`}>
              <span className="ts-arp-ip">{r.ip}</span>
              <span className="ts-arp-mac">{r.mac}</span>
              <span className={`ts-arp-state ${r.state}`}>{ARP_LABEL[r.state]}</span>
              <span className="ts-arp-note">{r.note}</span>
            </div>
          ))}
        </div>
        <p className="ts-fine">{ARP_NOTE}</p>
      </section>

      <div className="ts-practice">
        <span className="ts-practice-label">Lock it in</span>
        <div className="ts-practice-btns">
          <button className="big-btn" onClick={() => onPractice('pbq-cli-tools')}>
            Practice: match the tool to the job
          </button>
          <button className="big-btn ghost" onClick={() => onPractice('pbq-troubleshoot')}>
            Order the seven steps
          </button>
          <button className="big-btn ghost" onClick={() => onPractice('pbq-tshoot-recall')}>
            Recall the facts from memory
          </button>
          <button className="btn" onClick={() => onResource('icmp')}>
            See ping move in the Lab
          </button>
        </div>
      </div>
    </div>
  );
}
