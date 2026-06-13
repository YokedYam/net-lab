import type { CSSProperties } from 'react';
import type { DeviceType, Tool } from '../model';
import { DEVICE_COLOR, DEVICE_LABEL } from '../model';
import { DeviceGlyph, ToolGlyph } from '../icons';
import { CONCEPTS } from '../concepts';

const ACTIONS: { id: 'select' | 'cable' | 'ping' | 'delete'; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'cable', label: 'Cable' },
  { id: 'ping', label: 'Ping' },
  { id: 'delete', label: 'Delete' },
];

const DEVICES: DeviceType[] = ['laptop', 'pc', 'server', 'switch', 'router', 'firewall'];

export type SidebarTab = 'build' | 'learn';

export function Toolbar({
  tab,
  onTab,
  tool,
  onSelectTool,
  activeConcept,
  onConcept,
}: {
  tab: SidebarTab;
  onTab: (t: SidebarTab) => void;
  tool: Tool;
  onSelectTool: (t: Tool) => void;
  activeConcept: string | null;
  onConcept: (id: string) => void;
}) {
  return (
    <nav className={tab === 'learn' ? 'toolbar learn' : 'toolbar'}>
      <div className="tabs">
        <button className={tab === 'build' ? 'tab active' : 'tab'} onClick={() => onTab('build')}>
          Build
        </button>
        <button className={tab === 'learn' ? 'tab active' : 'tab'} onClick={() => onTab('learn')}>
          Learn
        </button>
      </div>

      {tab === 'build' ? (
        <>
          <div className="tb-section">Tools</div>
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              className={tool === a.id ? 'tool-btn active' : 'tool-btn'}
              onClick={() => onSelectTool(a.id)}
              data-coach={`tool-${a.id}`}
            >
              <svg viewBox="0 0 24 24" className="tb-icon">
                <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <ToolGlyph kind={a.id} />
                </g>
              </svg>
              {a.label}
            </button>
          ))}
          <div className="tb-section">Devices</div>
          {DEVICES.map((t) => (
            <button
              key={t}
              className={tool === t ? 'tool-btn active' : 'tool-btn'}
              onClick={() => onSelectTool(t)}
              style={{ '--accent': DEVICE_COLOR[t] } as CSSProperties}
              data-coach={`device-${t}`}
            >
              <svg viewBox="0 0 24 24" className="tb-icon" style={{ color: DEVICE_COLOR[t] }}>
                <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <DeviceGlyph type={t} />
                </g>
              </svg>
              {DEVICE_LABEL[t]}
            </button>
          ))}
        </>
      ) : (
        <>
          <div className="tb-section">The concept chain</div>
          <p className="tb-blurb">
            21 concepts, in order: each one solves the problem the last one created. Click to watch
            the demo.
          </p>
          {CONCEPTS.map((c, i) => (
            <button
              key={c.id}
              className={activeConcept === c.id ? 'concept-btn active' : 'concept-btn'}
              onClick={() => onConcept(c.id)}
            >
              <span className="cnum">{String(i + 1).padStart(2, '0')}</span>
              {c.title}
            </button>
          ))}
        </>
      )}
    </nav>
  );
}
