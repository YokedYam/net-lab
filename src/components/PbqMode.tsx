import { useMemo, useState } from 'react';
import { PBQS } from '../pbqData';
import type { Pbq, MatchPbq, CategorizePbq, SubnetPbq, OrderPbq } from '../pbqData';
import { DOMAINS, domainName, subnetFacts, sameIp, sameNum } from '../study';
import type { SubnetField } from '../study';
import { conceptById } from '../concepts';

interface Part {
  label: string;
  your: string;
  correct: string;
  ok: boolean;
  why?: string;
}
interface Grade {
  total: number;
  correct: number;
  parts: Part[];
  insight: string;
}

const KIND_LABEL: Record<Pbq['kind'], string> = {
  match: 'Matching',
  categorize: 'Drag-sort',
  subnet: 'Subnet calc',
  order: 'Sequencing',
};

const SUBNET_LABEL: Record<SubnetField, string> = {
  mask: 'Subnet mask',
  network: 'Network address',
  broadcast: 'Broadcast address',
  firstHost: 'First usable host',
  lastHost: 'Last usable host',
  hostCount: 'Usable hosts',
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PbqMode({ onResource }: { onResource: (conceptId: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pbq = PBQS.find((p) => p.id === activeId) ?? null;

  if (!pbq) {
    return (
      <div className="study study-pbq">
        <div className="study-intro wide">
          <h1>Performance-Based Questions</h1>
          <p className="study-lead">
            The hands-on part of the exam. Match ports, sort devices by layer, subnet a network, or
            order the troubleshooting steps — then get graded with a breakdown of exactly what to
            review.
          </p>
          <div className="pbq-grid">
            {PBQS.map((p) => {
              const accent = DOMAINS.find((d) => d.id === p.domain)?.color ?? '#3b82f6';
              return (
                <button key={p.id} className="pbq-tile" onClick={() => setActiveId(p.id)} style={{ '--accent': accent } as React.CSSProperties}>
                  <span className="pbq-kind">{KIND_LABEL[p.kind]}</span>
                  <span className="pbq-tile-title">{p.title}</span>
                  <span className="pbq-tile-domain" style={{ color: accent }}>
                    {p.domain} {domainName(p.domain)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <PbqRunner key={pbq.id} pbq={pbq} onBack={() => setActiveId(null)} onResource={onResource} />;
}

function PbqRunner({ pbq, onBack, onResource }: { pbq: Pbq; onBack: () => void; onResource: (c: string) => void }) {
  const [grade, setGrade] = useState<Grade | null>(null);
  const accent = DOMAINS.find((d) => d.id === pbq.domain)?.color ?? '#3b82f6';

  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain" style={{ color: accent }}>
            {KIND_LABEL[pbq.kind]} · {pbq.domain} {domainName(pbq.domain)}
          </span>
        </div>
        <div className="qs-right">
          <button className="btn small" onClick={onBack}>
            ← All PBQs
          </button>
        </div>
      </div>

      <div className="pbq-card">
        <h2 className="pbq-title">{pbq.title}</h2>
        <p className="pbq-scenario">{pbq.scenario}</p>
        <p className="pbq-instruction">{pbq.instruction}</p>

        {pbq.kind === 'match' && <MatchBody pbq={pbq} grade={grade} setGrade={setGrade} />}
        {pbq.kind === 'categorize' && <CategorizeBody pbq={pbq} grade={grade} setGrade={setGrade} />}
        {pbq.kind === 'subnet' && <SubnetBody pbq={pbq} grade={grade} setGrade={setGrade} />}
        {pbq.kind === 'order' && <OrderBody pbq={pbq} grade={grade} setGrade={setGrade} />}
      </div>

      {grade && <Results grade={grade} pbq={pbq} onResource={onResource} onRetry={() => setGrade(null)} />}
    </div>
  );
}

// ---------- Match ----------
function MatchBody({ pbq, grade, setGrade }: { pbq: MatchPbq; grade: Grade | null; setGrade: (g: Grade) => void }) {
  const [ans, setAns] = useState<Record<string, string>>({});
  const locked = grade !== null;

  const submit = () => {
    const parts: Part[] = pbq.prompts.map((p) => {
      const your = ans[p.id] ?? '';
      return { label: p.text, your: your || '—', correct: p.correct, ok: your === p.correct, why: p.why };
    });
    const correct = parts.filter((p) => p.ok).length;
    setGrade({ total: parts.length, correct, parts, insight: matchInsight(pbq, parts) });
  };

  return (
    <>
      <div className="match-rows">
        {pbq.prompts.map((p) => {
          const v = ans[p.id] ?? '';
          const state = locked ? (v === p.correct ? ' ok' : ' bad') : '';
          return (
            <div className={`match-row${state}`} key={p.id}>
              <span className="match-prompt">{p.text}</span>
              <select
                className="match-select"
                value={v}
                disabled={locked}
                onChange={(e) => setAns((a) => ({ ...a, [p.id]: e.target.value }))}
              >
                <option value="">— choose —</option>
                {pbq.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {!locked && <SubmitBar onSubmit={submit} disabled={Object.keys(ans).length < pbq.prompts.length} />}
    </>
  );
}

// ---------- Categorize ----------
function CategorizeBody({ pbq, grade, setGrade }: { pbq: CategorizePbq; grade: Grade | null; setGrade: (g: Grade) => void }) {
  const [ans, setAns] = useState<Record<string, string>>({});
  const locked = grade !== null;

  const submit = () => {
    const parts: Part[] = pbq.items.map((it) => {
      const your = ans[it.id] ?? '';
      return { label: it.text, your: your || '—', correct: it.bucket, ok: your === it.bucket, why: it.why };
    });
    const correct = parts.filter((p) => p.ok).length;
    setGrade({ total: parts.length, correct, parts, insight: categorizeInsight(pbq, parts) });
  };

  return (
    <>
      <div className="cat-rows">
        {pbq.items.map((it) => {
          const v = ans[it.id] ?? '';
          const state = locked ? (v === it.bucket ? ' ok' : ' bad') : '';
          return (
            <div className={`cat-row${state}`} key={it.id}>
              <span className="cat-item">{it.text}</span>
              <div className="seg">
                {pbq.buckets.map((b) => (
                  <button
                    key={b}
                    className={v === b ? 'seg-btn active' : 'seg-btn'}
                    disabled={locked}
                    onClick={() => setAns((a) => ({ ...a, [it.id]: b }))}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!locked && <SubmitBar onSubmit={submit} disabled={Object.keys(ans).length < pbq.items.length} />}
    </>
  );
}

// ---------- Subnet ----------
function SubnetBody({ pbq, grade, setGrade }: { pbq: SubnetPbq; grade: Grade | null; setGrade: (g: Grade) => void }) {
  const [ans, setAns] = useState<Record<string, string>>({});
  const locked = grade !== null;
  const facts = useMemo(() => subnetFacts(pbq.ip, pbq.cidr), [pbq.ip, pbq.cidr]);

  const correctFor = (f: SubnetField): string =>
    f === 'hostCount' ? String(facts.hostCount) : (facts[f] as string);

  const isOk = (f: SubnetField, v: string): boolean =>
    f === 'hostCount' ? sameNum(v, facts.hostCount) : sameIp(v, facts[f] as string);

  const submit = () => {
    const parts: Part[] = pbq.fields.map((f) => {
      const your = ans[f] ?? '';
      return { label: SUBNET_LABEL[f], your: your || '—', correct: correctFor(f), ok: isOk(f, your) };
    });
    const correct = parts.filter((p) => p.ok).length;
    setGrade({ total: parts.length, correct, parts, insight: subnetInsight(pbq, parts) });
  };

  return (
    <>
      <div className="subnet-given">
        <span>
          Host: <b>{pbq.ip}</b>
        </span>
        <span>
          CIDR: <b>/{pbq.cidr}</b>
        </span>
        <span className="subnet-hint">block size in the interesting octet = {256 - parseInt(facts.mask.split('.').slice(-1)[0], 10) || 256}</span>
      </div>
      <div className="subnet-fields">
        {pbq.fields.map((f) => {
          const v = ans[f] ?? '';
          const state = locked ? (isOk(f, v) ? ' ok' : ' bad') : '';
          return (
            <label className={`subnet-field${state}`} key={f}>
              <span>{SUBNET_LABEL[f]}</span>
              <input
                type="text"
                value={v}
                disabled={locked}
                placeholder={f === 'hostCount' ? 'number' : 'a.b.c.d'}
                onChange={(e) => setAns((a) => ({ ...a, [f]: e.target.value }))}
              />
            </label>
          );
        })}
      </div>
      {!locked && <SubmitBar onSubmit={submit} disabled={Object.keys(ans).length < pbq.fields.length} />}
    </>
  );
}

// ---------- Order ----------
function OrderBody({ pbq, grade, setGrade }: { pbq: OrderPbq; grade: Grade | null; setGrade: (g: Grade) => void }) {
  const [order, setOrder] = useState<string[]>(() => {
    let s = shuffle(pbq.items.map((i) => i.id));
    // avoid handing back the already-correct order
    if (s.join() === pbq.items.map((i) => i.id).join()) s = shuffle(s);
    return s;
  });
  const locked = grade !== null;
  const textOf = (id: string) => pbq.items.find((i) => i.id === id)?.text ?? '';

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    setOrder((o) => {
      const n = o.slice();
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };

  const submit = () => {
    const parts: Part[] = order.map((id, i) => {
      const correctId = pbq.items[i].id;
      return {
        label: `Position ${i + 1}: ${textOf(id)}`,
        your: textOf(id),
        correct: textOf(correctId),
        ok: id === correctId,
      };
    });
    const correct = parts.filter((p) => p.ok).length;
    setGrade({ total: parts.length, correct, parts, insight: orderInsight(pbq, correct) });
  };

  return (
    <>
      <ol className="order-list">
        {order.map((id, i) => {
          const state = locked ? (pbq.items[i].id === id ? ' ok' : ' bad') : '';
          return (
            <li className={`order-item${state}`} key={id}>
              <span className="order-num">{i + 1}</span>
              <span className="order-text">{textOf(id)}</span>
              {!locked && (
                <span className="order-moves">
                  <button className="btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button className="btn small" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Move down">
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!locked && <SubmitBar onSubmit={submit} disabled={false} />}
    </>
  );
}

function SubmitBar({ onSubmit, disabled }: { onSubmit: () => void; disabled: boolean }) {
  return (
    <div className="pbq-submit">
      <button className="big-btn" onClick={onSubmit} disabled={disabled}>
        Submit &amp; grade →
      </button>
      {disabled && <span className="pbq-submit-hint">Answer every part to submit.</span>}
    </div>
  );
}

function Results({ grade, pbq, onResource, onRetry }: { grade: Grade; pbq: Pbq; onResource: (c: string) => void; onRetry: () => void }) {
  const pct = Math.round((grade.correct / grade.total) * 100);
  const perfect = grade.correct === grade.total;
  const resources = (pbq.resources ?? []).map((id) => conceptById(id)).filter((c): c is NonNullable<typeof c> => !!c);
  return (
    <div className="pbq-results">
      <div className={perfect ? 'pbq-score perfect' : 'pbq-score'}>
        <span className="pbq-score-num">
          {grade.correct}/{grade.total}
        </span>
        <span className="pbq-score-pct">{pct}%</span>
        <span className="pbq-score-tag">{perfect ? 'Perfect — exam-ready on this one' : 'Graded'}</span>
      </div>

      <div className="pbq-insight">
        <span className="pbq-insight-tag">Insight</span>
        <p>{grade.insight}</p>
      </div>

      <div className="pbq-breakdown">
        {grade.parts.map((p, i) => (
          <div className={p.ok ? 'pbq-part ok' : 'pbq-part bad'} key={i}>
            <div className="pbq-part-head">
              <span className="pbq-part-mark">{p.ok ? '✓' : '✗'}</span>
              <span className="pbq-part-label">{p.label}</span>
            </div>
            {!p.ok && (
              <div className="pbq-part-detail">
                <span>
                  You: <b className="bad-text">{p.your}</b> · Correct: <b className="ok-text">{p.correct}</b>
                </span>
                {p.why && <span className="pbq-why">{p.why}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {resources.length > 0 && (
        <div className="pbq-resources">
          <span className="pbq-res-label">Brush up with a demo</span>
          <div className="chip-row">
            {resources.map((c) => (
              <button key={c.id} className="big-btn ghost" onClick={() => onResource(c.id)}>
                {c.title} →
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pbq-result-actions">
        <button className="big-btn" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

// ---------- generated insights (deterministic, from the submission) ----------

function missedLabels(parts: Part[]): string[] {
  return parts.filter((p) => !p.ok).map((p) => p.label);
}

function matchInsight(pbq: MatchPbq, parts: Part[]): string {
  const miss = missedLabels(parts);
  if (miss.length === 0)
    return pbq.id === 'pbq-ports'
      ? 'Clean sweep on the port numbers — that memorization pays off all over the exam.'
      : 'Every item mapped to the right layer. You clearly know which gear lives where.';
  const head = `You matched ${parts.length - miss.length} of ${parts.length}. Misses: ${miss.join(', ')}.`;
  if (pbq.id === 'pbq-ports')
    return `${head} Port numbers are pure recall — hammer the Flashcards "Ports" set until they're automatic.`;
  return `${head} Anchor each item to its layer: switch + MAC = Layer 2, router + IP = Layer 3, ports = Layer 4.`;
}

function categorizeInsight(pbq: CategorizePbq, parts: Part[]): string {
  const miss = missedLabels(parts);
  if (miss.length === 0) return 'Sorted every item correctly — nice. You can tell these apart under pressure.';
  const head = `You placed ${parts.length - miss.length} of ${parts.length} correctly. Re-check: ${miss.join(', ')}.`;
  if (pbq.id === 'pbq-tcpudp') return `${head} The test: "is a late packet useless?" If yes → UDP (voice, video, DNS, DHCP); if every byte matters → TCP.`;
  if (pbq.id === 'pbq-devlayer') return `${head} Hubs/repeaters move bits (L1), switches/bridges move frames by MAC (L2), routers move packets by IP (L3).`;
  if (pbq.id === 'pbq-pubpriv') return `${head} Private blocks are 10/8, 172.16–172.31, and 192.168/16 — watch the 172 trap: it ends at 172.31.`;
  return head;
}

function subnetInsight(pbq: SubnetPbq, parts: Part[]): string {
  const miss = missedLabels(parts);
  if (miss.length === 0) return `Spot on for ${pbq.ip} /${pbq.cidr}. Your subnet math is solid.`;
  const tips: string[] = [];
  if (miss.includes('Network address')) tips.push('network = IP AND mask (round the interesting octet down to a multiple of the block size)');
  if (miss.includes('Broadcast address')) tips.push('broadcast = network + block size − 1 in the interesting octet');
  if (miss.includes('Usable hosts')) tips.push('usable hosts = 2^(host bits) − 2');
  if (miss.includes('Subnet mask')) tips.push('the mask comes straight from the CIDR (count the 1-bits)');
  if (miss.includes('First usable host')) tips.push('first host = network + 1');
  if (miss.includes('Last usable host')) tips.push('last host = broadcast − 1');
  return `You got ${parts.length - miss.length} of ${parts.length}. Review: ${miss.join(', ')}. Remember: ${tips.join('; ')}.`;
}

function orderInsight(pbq: OrderPbq, correct: number): string {
  const total = pbq.items.length;
  if (correct === total)
    return pbq.id === 'pbq-troubleshoot'
      ? 'Perfect order. It always starts with Identify the problem and ends with Document — verify functionality before you document.'
      : 'Perfect — DORA: Discover, Offer, Request, Acknowledge.';
  if (pbq.id === 'pbq-troubleshoot')
    return `${correct} of ${total} in place. Lock in the bookends: step 1 is always Identify the problem, step 7 is always Document. Test your theory before you act, and verify before you close.`;
  return `${correct} of ${total} in place. Remember DORA: Discover → Offer → Request → Acknowledge.`;
}
