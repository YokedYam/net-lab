import { ACRONYMS } from '../acronymData';
import type { AcronymDef } from '../acronymData';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function hasTerm(text: string, term: string): boolean {
  const escaped = escapeRe(term);
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, 'i').test(text);
}

export function acronymsInText(parts: string[]): AcronymDef[] {
  const text = parts.join(' ');
  return ACRONYMS.filter((a) => [a.term, ...(a.aliases ?? [])].some((term) => hasTerm(text, term)));
}

export function AcronymHelp({ items }: { items: AcronymDef[] }) {
  if (items.length === 0) return null;

  return (
    <div className="acro-help" aria-label="Acronym help">
      <span className="acro-label">Acronym help</span>
      <div className="acro-list">
        {items.map((a) => (
          <button key={a.term} className="acro-btn" type="button" aria-label={`${a.term}: ${a.full}. ${a.short}`}>
            <span className="acro-term">{a.term}</span>
            <span className="acro-pop" role="tooltip">
              <strong>{a.full}</strong>
              <span>{a.short}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
