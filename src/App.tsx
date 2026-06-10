import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Addr,
  Device,
  DeviceType,
  Link,
  LogEntry,
  LogKind,
  NetInfo,
  PingPlan,
  PlanEvent,
  Segment,
  Tool,
} from './model';
import {
  DEVICE_COLOR,
  DEVICE_LABEL,
  computeNetworks,
  isHost,
  makeDevice,
  planPing,
  randMac,
  uid,
} from './model';
import { DeviceGlyph } from './icons';
import { Toolbar } from './components/Toolbar';
import { DetailsPanel } from './components/DetailsPanel';
import { EventLog } from './components/EventLog';
import { HelpModal } from './components/HelpModal';
import { PacketFlight } from './components/PacketFlight';

const NIC_LIMIT: Record<DeviceType, number> = {
  laptop: 1,
  pc: 1,
  server: 1,
  firewall: 2,
  switch: 8,
  router: 8,
};

const DEVICE_TOOLS: DeviceType[] = ['laptop', 'pc', 'server', 'switch', 'router', 'firewall'];
const isDeviceTool = (t: Tool): t is DeviceType => DEVICE_TOOLS.includes(t as DeviceType);

function demoState(): { devices: Device[]; links: Link[] } {
  const mk = (id: string, type: DeviceType, name: string, x: number, y: number): Device => ({
    id,
    type,
    name,
    mac: randMac(),
    x,
    y,
    blockIcmp: false,
  });
  const devices = [
    mk('d1', 'laptop', 'Laptop-1', 140, 170),
    mk('d2', 'laptop', 'Laptop-2', 140, 430),
    mk('d3', 'switch', 'Switch-1', 330, 300),
    mk('d4', 'router', 'Router-1', 530, 300),
    mk('d5', 'firewall', 'Firewall-1', 710, 300),
    mk('d6', 'server', 'Server-1', 880, 300),
  ];
  const mkl = (a: string, b: string): Link => ({ id: uid(), a, b });
  const links = [mkl('d1', 'd3'), mkl('d2', 'd3'), mkl('d3', 'd4'), mkl('d4', 'd5'), mkl('d5', 'd6')];
  return { devices, links };
}

const WELCOME: LogEntry[] = [
  { id: uid(), kind: 'system', text: 'Welcome to Net+ Visual Lab — a tiny Packet Tracer.' },
  {
    id: uid(),
    kind: 'info',
    text: 'Demo loaded: two networks joined by Router-1. Grab the Ping tool and click Laptop-1, then Server-1.',
  },
  { id: uid(), kind: 'info', text: 'Hit the Help button for guided exercises.' },
];

function ipLabel(d: Device, addrs: Addr[] | undefined): string {
  if (d.type === 'switch') return 'L2 · no IP';
  if (d.type === 'firewall') return d.blockIcmp ? 'ICMP blocked' : 'ICMP allowed';
  if (!addrs || addrs.length === 0) return 'no network';
  if (d.type === 'router' && addrs.length > 1) return `${addrs[0].ip} +${addrs.length - 1}`;
  return addrs[0].ip;
}

function SegmentBubble({ seg, devices }: { seg: Segment; devices: Device[] }) {
  const byId = new Map(devices.map((d) => [d.id, d]));
  const pts = seg.memberIds.map((id) => byId.get(id)).filter((d): d is Device => !!d);
  if (pts.length === 0) return null;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const pad = seg.kind === 'p2p' ? 48 : 78;
  const r = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)), 30) + pad;
  return (
    <g className="bubble">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={seg.color}
        fillOpacity={0.05}
        stroke={seg.color}
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeDasharray="10 8"
        style={{ filter: `drop-shadow(0 0 9px ${seg.color}55)` }}
      />
      <text x={cx} y={Math.max(cy - r - 10, 20)} textAnchor="middle" className="bubble-label" fill={seg.color}>
        {seg.subnet}
        {seg.kind === 'p2p' ? ' · router link' : ''}
      </text>
    </g>
  );
}

function DeviceNode({
  d,
  label,
  selected,
  pending,
  cursor,
  onDown,
  onMove,
  onUp,
}: {
  d: Device;
  label: string;
  selected: boolean;
  pending: boolean;
  cursor: string;
  onDown: (e: React.PointerEvent) => void;
  onMove: (e: React.PointerEvent) => void;
  onUp: () => void;
}) {
  const color = DEVICE_COLOR[d.type];
  return (
    <g
      className="device"
      transform={`translate(${d.x} ${d.y})`}
      style={{ cursor }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {(selected || pending) && <circle r={36} className={pending ? 'ring pending' : 'ring'} />}
      <rect
        x={-26}
        y={-26}
        width={52}
        height={52}
        rx={14}
        className="tile"
        style={{ stroke: color, filter: `drop-shadow(0 0 7px ${color}55)` }}
      />
      <g
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-16 -16) scale(1.3333)"
      >
        <DeviceGlyph type={d.type} />
      </g>
      <text y={44} className="dev-name">
        {d.name}
      </text>
      <text y={59} className="dev-ip">
        {label}
      </text>
    </g>
  );
}

export default function App() {
  const demo = useMemo(demoState, []);
  const [devices, setDevices] = useState<Device[]>(demo.devices);
  const [links, setLinks] = useState<Link[]>(demo.links);
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [log, setLog] = useState<LogEntry[]>(WELCOME);
  const [flight, setFlight] = useState<{ plan: PingPlan; points: { x: number; y: number }[]; runId: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const net: NetInfo = useMemo(() => computeNetworks(devices, links), [devices, links]);
  const byId = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  const pushLog = useCallback((text: string, kind: LogKind = 'info') => {
    setLog((l) => [...l.slice(-249), { id: uid(), text, kind }]);
  }, []);
  const pushEvents = useCallback((es: PlanEvent[]) => {
    setLog((l) => [...l.slice(-249), ...es.map((e) => ({ id: uid(), text: e.text, kind: e.kind }))]);
  }, []);
  const endFlight = useCallback(() => setFlight(null), []);

  const svgPoint = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const selectTool = (t: Tool) => {
    setTool(t);
    setPendingId(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTool('select');
        setPendingId(null);
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const degree = (id: string) => links.filter((l) => l.a === id || l.b === id).length;

  const tryConnect = (aId: string, bId: string) => {
    if (links.some((l) => (l.a === aId && l.b === bId) || (l.a === bId && l.b === aId))) {
      pushLog('Those two are already connected.', 'warn');
      return;
    }
    for (const id of [aId, bId]) {
      const d = byId.get(id)!;
      if (degree(id) >= NIC_LIMIT[d.type]) {
        if (isHost(d.type)) {
          pushLog(
            `${d.name} already has a cable — hosts have a single NIC. Add a Switch to connect more devices.`,
            'warn'
          );
        } else if (d.type === 'firewall') {
          pushLog(`${d.name} is an inline firewall — it only has 2 ports (in and out).`, 'warn');
        } else {
          pushLog(`${d.name} is out of ports.`, 'warn');
        }
        return;
      }
    }
    setLinks((ls) => [...ls, { id: uid(), a: aId, b: bId }]);
    pushLog(`Connected ${byId.get(aId)!.name} ↔ ${byId.get(bId)!.name}.`, 'system');
  };

  const removeDevice = (id: string) => {
    const d = byId.get(id);
    setDevices((ds) => ds.filter((x) => x.id !== id));
    setLinks((ls) => ls.filter((l) => l.a !== id && l.b !== id));
    if (selectedId === id) setSelectedId(null);
    if (pendingId === id) setPendingId(null);
    if (d) pushLog(`Removed ${d.name}.`, 'system');
  };

  const removeLink = (id: string) => {
    const l = links.find((x) => x.id === id);
    setLinks((ls) => ls.filter((x) => x.id !== id));
    if (l) pushLog(`Unplugged ${byId.get(l.a)?.name ?? '?'} ↔ ${byId.get(l.b)?.name ?? '?'}.`, 'system');
  };

  const startPing = (aId: string, bId: string) => {
    const res = planPing(aId, bId, devices, links, net);
    if (!res.ok) {
      pushEvents(res.msgs);
      return;
    }
    const points = res.plan.path.map((id) => {
      const d = byId.get(id)!;
      return { x: d.x, y: d.y };
    });
    setFlight({ plan: res.plan, points, runId: Date.now() });
  };

  const toggleIcmp = (id: string, blocked: boolean) => {
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, blockIcmp: blocked } : d)));
    const d = byId.get(id);
    pushLog(
      `${d?.name} now ${blocked ? 'BLOCKS ICMP — pings through it will be dropped' : 'allows ICMP — pings can pass'}.`,
      blocked ? 'warn' : 'system'
    );
  };

  const onBgDown = (e: React.PointerEvent) => {
    const p = svgPoint(e);
    if (isDeviceTool(tool)) {
      const d = makeDevice(tool, p.x, p.y, devices);
      setDevices((ds) => [...ds, d]);
      setSelectedId(d.id);
      pushLog(`Added ${d.name} (MAC ${d.mac}).`, 'system');
    } else {
      setSelectedId(null);
      setPendingId(null);
    }
  };

  const onDeviceDown = (e: React.PointerEvent, d: Device) => {
    e.stopPropagation();
    if (tool === 'select') {
      setSelectedId(d.id);
      const p = svgPoint(e);
      dragRef.current = { id: d.id, dx: d.x - p.x, dy: d.y - p.y };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } else if (tool === 'cable') {
      if (!pendingId) setPendingId(d.id);
      else if (pendingId !== d.id) {
        tryConnect(pendingId, d.id);
        setPendingId(null);
      }
    } else if (tool === 'ping') {
      if (!pendingId) setPendingId(d.id);
      else if (pendingId !== d.id) {
        startPing(pendingId, d.id);
        setPendingId(null);
      }
    } else if (tool === 'delete') {
      removeDevice(d.id);
    } else {
      setSelectedId(d.id);
    }
  };

  const onDeviceMove = (e: React.PointerEvent, d: Device) => {
    if (dragRef.current?.id !== d.id) return;
    const p = svgPoint(e);
    const { dx, dy } = dragRef.current;
    setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, x: p.x + dx, y: p.y + dy } : x)));
  };

  const onDeviceUp = () => {
    dragRef.current = null;
  };

  const onSvgMove = (e: React.PointerEvent) => {
    if (pendingId && (tool === 'cable' || tool === 'ping')) setCursorPos(svgPoint(e));
  };

  const loadDemo = () => {
    const fresh = demoState();
    setDevices(fresh.devices);
    setLinks(fresh.links);
    setSelectedId(null);
    setPendingId(null);
    setFlight(null);
    pushLog('Demo network loaded: 192.168.1.0/24 (laptops) and 192.168.2.0/24 (server) joined by Router-1.', 'system');
  };

  const clearAll = () => {
    setDevices([]);
    setLinks([]);
    setSelectedId(null);
    setPendingId(null);
    setFlight(null);
    pushLog('Canvas cleared — build your own network. Start with two laptops and a switch.', 'system');
  };

  const hint = useMemo(() => {
    if (tool === 'select') return 'Select — click a device to inspect · drag to move it';
    if (tool === 'cable')
      return pendingId ? 'Cable — now click the second device' : 'Cable — click the first device to connect';
    if (tool === 'ping')
      return pendingId ? 'Ping — now click the destination' : 'Ping — click the source device';
    if (tool === 'delete') return 'Delete — click a device or a cable';
    return `Place — click anywhere on the canvas to drop a ${DEVICE_LABEL[tool as DeviceType]} (Esc when done)`;
  }, [tool, pendingId]);

  const deviceCursor =
    tool === 'select' ? 'grab' : tool === 'cable' || tool === 'ping' ? 'crosshair' : 'pointer';
  const canvasCursor = isDeviceTool(tool) ? 'crosshair' : 'default';

  const selectedDevice = selectedId ? (byId.get(selectedId) ?? null) : null;
  const pendingDevice = pendingId ? byId.get(pendingId) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">Net+ Visual Lab</div>
            <div className="brand-sub">a tiny Packet Tracer — click, cable, ping</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="counts">
            {devices.length} devices · {links.length} cables · {net.segments.length} networks
          </span>
          <button className="btn" onClick={loadDemo}>
            Demo
          </button>
          <button className="btn" onClick={clearAll}>
            Clear
          </button>
          <button className="btn accent" onClick={() => setShowHelp(true)}>
            Help
          </button>
        </div>
      </header>
      <div className="main">
        <Toolbar tool={tool} onSelect={selectTool} />
        <div className="canvas-wrap" style={{ cursor: canvasCursor }}>
          <svg ref={svgRef} className="scene" onPointerMove={onSvgMove}>
            <rect className="bg" width="100%" height="100%" fill="transparent" onPointerDown={onBgDown} />
            {net.segments.map((seg) => (
              <SegmentBubble key={seg.id} seg={seg} devices={devices} />
            ))}
            {links.map((l) => {
              const a = byId.get(l.a);
              const b = byId.get(l.b);
              if (!a || !b) return null;
              return (
                <g
                  key={l.id}
                  className={tool === 'delete' ? 'link deletable' : 'link'}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (tool === 'delete') removeLink(l.id);
                  }}
                >
                  <line className="link-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                  <line className="link-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                </g>
              );
            })}
            {pendingDevice && cursorPos && (tool === 'cable' || tool === 'ping') && (
              <line
                className="preview-line"
                x1={pendingDevice.x}
                y1={pendingDevice.y}
                x2={cursorPos.x}
                y2={cursorPos.y}
              />
            )}
            {devices.map((d) => (
              <DeviceNode
                key={d.id}
                d={d}
                label={ipLabel(d, net.addrs.get(d.id))}
                selected={selectedId === d.id}
                pending={pendingId === d.id}
                cursor={deviceCursor}
                onDown={(e) => onDeviceDown(e, d)}
                onMove={(e) => onDeviceMove(e, d)}
                onUp={onDeviceUp}
              />
            ))}
            {flight && (
              <PacketFlight
                key={flight.runId}
                plan={flight.plan}
                points={flight.points}
                onLog={pushEvents}
                onDone={endFlight}
              />
            )}
          </svg>
          <div className="hint">{hint}</div>
        </div>
        <aside className="side">
          <DetailsPanel device={selectedDevice} net={net} onToggleIcmp={toggleIcmp} />
          <EventLog log={log} onClear={() => setLog([])} />
        </aside>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
