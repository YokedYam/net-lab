import type { CSSProperties } from 'react';
import type { DeviceType, Tool } from '../model';
import { DEVICE_COLOR, DEVICE_LABEL } from '../model';
import { DeviceGlyph, ToolGlyph } from '../icons';

const ACTIONS: { id: 'select' | 'cable' | 'ping' | 'delete'; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'cable', label: 'Cable' },
  { id: 'ping', label: 'Ping' },
  { id: 'delete', label: 'Delete' },
];

const DEVICES: DeviceType[] = ['laptop', 'pc', 'server', 'switch', 'router', 'firewall'];

export function Toolbar({ tool, onSelect }: { tool: Tool; onSelect: (t: Tool) => void }) {
  return (
    <nav className="toolbar">
      <div className="tb-section">Tools</div>
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          className={tool === a.id ? 'tool-btn active' : 'tool-btn'}
          onClick={() => onSelect(a.id)}
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
          onClick={() => onSelect(t)}
          style={{ '--accent': DEVICE_COLOR[t] } as CSSProperties}
        >
          <svg viewBox="0 0 24 24" className="tb-icon" style={{ color: DEVICE_COLOR[t] }}>
            <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <DeviceGlyph type={t} />
            </g>
          </svg>
          {DEVICE_LABEL[t]}
        </button>
      ))}
    </nav>
  );
}
