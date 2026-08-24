import { CHANGE_LABELS, changelog, CURRENT_VERSION } from '../changelog';
import type { Change, ChangeType } from '../changelog';

const ORDER: ChangeType[] = ['added', 'changed', 'fixed', 'infra'];

function groupByType(changes: Change[]) {
  return ORDER.map((type) => ({
    type,
    items: changes.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WhatsNew({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal whatsnew" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>What is new</h2>
          <button className="btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <p className="wn-intro">
          Release history for Net+ Visual Lab, newest first. You are studying on{' '}
          <b>{CURRENT_VERSION.display}</b>.
        </p>

        {changelog.map((release) => (
          <section className="wn-release" key={release.version}>
            <div className="wn-relhead">
              <span
                className={
                  release.version === CURRENT_VERSION.version ? 'wn-ver current' : 'wn-ver'
                }
              >
                v{release.version}
              </span>
              {release.label && <span className="wn-label">{release.label}</span>}
              <span className="wn-date">{formatDate(release.date)}</span>
              {release.version === CURRENT_VERSION.version && (
                <span className="wn-current-tag">you are here</span>
              )}
            </div>
            <h3 className="wn-title">{release.title}</h3>
            {groupByType(release.changes).map((group) => (
              <div className="wn-group" key={group.type}>
                <div className={`wn-tag wn-${group.type}`}>{CHANGE_LABELS[group.type]}</div>
                <ul className="wn-list">
                  {group.items.map((c, i) => (
                    <li key={i}>{c.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
