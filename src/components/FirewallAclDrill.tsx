import { useState } from 'react';

// Firewall ACL PBQ. A rule table with a stated security goal; the student sets
// each rule to permit or deny under least privilege. Graded per rule with the
// reasoning, the same engine shape as the other PBQs.

type Action = 'permit' | 'deny';

interface Rule {
  id: string;
  src: string;
  dst: string;
  svc: string;
  correct: Action;
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

const GOAL =
  'Let the public reach the DMZ web server over HTTPS and send mail to the mail server, let inside users browse out, and block everything else. Apply least privilege; the list is read top down and ends in an implicit deny.';

const RULES: Rule[] = [
  {
    id: 'r1',
    src: 'Internet (any)',
    dst: 'DMZ web server',
    svc: 'TCP 443 (HTTPS)',
    correct: 'permit',
    why: 'The public must reach the web app, so explicitly permit 443 to the web server.',
  },
  {
    id: 'r2',
    src: 'Internet (any)',
    dst: 'DMZ web server',
    svc: 'TCP 22 (SSH)',
    correct: 'deny',
    why: 'Exposing remote admin to the whole internet is a serious risk. Manage the server from inside or a jump box, never from the public side.',
  },
  {
    id: 'r3',
    src: 'Internet (any)',
    dst: 'DMZ mail server',
    svc: 'TCP 25 (SMTP)',
    correct: 'permit',
    why: 'Inbound email needs SMTP to the mail server, so permit 25 to it.',
  },
  {
    id: 'r4',
    src: 'Internet (any)',
    dst: 'Internal LAN',
    svc: 'any',
    correct: 'deny',
    why: 'The internet must never reach the trusted LAN directly. Deny it outright.',
  },
  {
    id: 'r5',
    src: 'Internal LAN',
    dst: 'Internet',
    svc: 'TCP 80 / 443 (web)',
    correct: 'permit',
    why: 'Internal users browsing out is normal business traffic, so permit outbound web.',
  },
  {
    id: 'r6',
    src: 'any',
    dst: 'any',
    svc: 'any',
    correct: 'deny',
    why: 'The cleanup rule. Firewalls match top down and finish with an implicit deny, so an explicit deny-any makes the least-privilege intent clear and logs the drops.',
  },
];

function grade(answers: Record<string, Action>): Part[] {
  return RULES.map((rule, i) => {
    const your = answers[rule.id];
    return {
      id: rule.id,
      label: `Rule ${i + 1}: ${rule.src} → ${rule.dst} (${rule.svc})`,
      your: your ? your.toUpperCase() : '(unset)',
      correct: rule.correct.toUpperCase(),
      ok: your === rule.correct,
      why: rule.why,
    };
  });
}

const allSet = (answers: Record<string, Action>): boolean => RULES.every((r) => answers[r.id]);

export function FirewallAclDrill({ onBack }: { onBack?: () => void } = {}) {
  const [answers, setAnswers] = useState<Record<string, Action>>({});
  const [parts, setParts] = useState<Part[] | null>(null);
  const locked = parts !== null;
  const correct = parts?.filter((p) => p.ok).length ?? 0;
  const perfect = locked && correct === RULES.length;

  const reset = () => {
    setAnswers({});
    setParts(null);
  };

  const partFor = (id: string) => parts?.find((p) => p.id === id) ?? null;

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Firewall ACL PBQ</span>
          <span className="qs-topic"> · permit or deny each rule</span>
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
        <h2 className="pbq-title">Set the firewall rules</h2>
        <p className="pbq-scenario">{GOAL}</p>

        <div className="acl-table">
          <div className="acl-row acl-head">
            <span>#</span>
            <span>Source</span>
            <span>Destination</span>
            <span>Service</span>
            <span>Action</span>
          </div>
          {RULES.map((rule, i) => {
            const part = partFor(rule.id);
            const state = locked ? (part?.ok ? ' ok' : ' bad') : '';
            return (
              <div className={`acl-row${state}`} key={rule.id}>
                <span className="acl-num">{i + 1}</span>
                <span>{rule.src}</span>
                <span>{rule.dst}</span>
                <span className="acl-svc">{rule.svc}</span>
                <select
                  className="acl-action"
                  value={answers[rule.id] ?? ''}
                  disabled={locked}
                  onChange={(e) => setAnswers((a) => ({ ...a, [rule.id]: e.target.value as Action }))}
                >
                  <option value="">Set…</option>
                  <option value="permit">PERMIT</option>
                  <option value="deny">DENY</option>
                </select>
              </div>
            );
          })}
        </div>

        {!locked && (
          <div className="pbq-submit">
            <button className="big-btn" onClick={() => setParts(grade(answers))} disabled={!allSet(answers)}>
              Submit &amp; grade →
            </button>
            {!allSet(answers) && <span className="pbq-submit-hint">Set permit or deny on every rule to submit.</span>}
          </div>
        )}

        {locked && parts && (
          <div className="topo-results">
            <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
              <span className="pbq-score-num">
                {correct}/{RULES.length}
              </span>
              <span className="pbq-score-pct">{Math.round((correct / RULES.length) * 100)}%</span>
              <span className="pbq-score-tag">{perfect ? 'Least privilege, locked down' : 'Review the rules'}</span>
            </div>

            <div className="pbq-insight">
              <span className="pbq-insight-tag">Insight</span>
              <p>
                Two ideas drive every firewall ACL. Order matters: rules match top down and the first
                match wins, so specific permits go above broad denies. And least privilege: permit only
                the exact services you need, deny the rest, and let the implicit deny catch anything you
                forgot. Inbound admin from the internet is never the answer.
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
