import type { DeviceType } from './model';

export function DeviceGlyph({ type }: { type: DeviceType }) {
  switch (type) {
    case 'laptop':
      return (
        <g>
          <rect x="4" y="5" width="16" height="10" rx="1.5" />
          <path d="M2.5 18.5h19l-2-3.5h-15Z" />
        </g>
      );
    case 'pc':
      return (
        <g>
          <rect x="3.5" y="4" width="17" height="11" rx="1.5" />
          <path d="M12 15v4M8.5 19h7" />
        </g>
      );
    case 'server':
      return (
        <g>
          <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
          <path d="M4.5 9h15M4.5 14.5h15M8 6.3h.01M8 11.8h.01M8 17.3h.01" />
        </g>
      );
    case 'switch':
      return (
        <g>
          <rect x="2.5" y="7.5" width="19" height="9" rx="2" />
          <path d="M6 10.6h8.5m-1.8-1.8 1.8 1.8-1.8 1.8" />
          <path d="M18 13.4h-8.5m1.8-1.8-1.8 1.8 1.8 1.8" />
        </g>
      );
    case 'router':
      return (
        <g>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 6.5v11M6.5 12h11" />
          <path d="M10.2 8.3 12 6.5l1.8 1.8M10.2 15.7 12 17.5l1.8-1.8M8.3 10.2 6.5 12l1.8 1.8M15.7 10.2 17.5 12l-1.8 1.8" />
        </g>
      );
    case 'firewall':
      return (
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      );
  }
}

export function ToolGlyph({ kind }: { kind: 'select' | 'cable' | 'ping' | 'delete' }) {
  switch (kind) {
    case 'select':
      return <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />;
    case 'cable':
      return (
        <g>
          <circle cx="5.5" cy="18.5" r="2" />
          <circle cx="18.5" cy="5.5" r="2" />
          <path d="M7 17 17 7" />
        </g>
      );
    case 'ping':
      return (
        <g>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </g>
      );
    case 'delete':
      return (
        <g>
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6M14 11v6" />
        </g>
      );
  }
}
