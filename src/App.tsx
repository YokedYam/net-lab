import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Device,
  DeviceConfig,
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
  effectiveAddr,
  findPath,
  ipToInt,
  isHost,
  makeDevice,
  planPing,
  randMac,
  uid,
} from './model';
import { conceptById } from './concepts';
import type { Concept, DemoNote } from './concepts';
import { DeviceGlyph } from './icons';
import { Toolbar } from './components/Toolbar';
import type { SidebarTab } from './components/Toolbar';
import { DetailsPanel } from './components/DetailsPanel';
import { EventLog } from './components/EventLog';
import { HelpModal } from './components/HelpModal';
import { PacketFlight } from './components/PacketFlight';
import { DemoFlight } from './components/DemoFlight';
import { DemoAnnotations } from './components/DemoAnnotations';
import { QuizMode } from './components/QuizMode';
import { Flashcards } from './components/Flashcards';
import { PbqMode } from './components/PbqMode';
import { OsiModel } from './components/OsiModel';
import { Troubleshoot } from './components/Troubleshoot';
import { MatchGame } from './components/MatchGame';
import { SessionTimer } from './components/SessionTimer';
import { GuidedHome, GuidedOverlay, markDone } from './components/Guided';
import { MobileBanner, DesktopOnlyNotice } from './components/MobileNotice';
import { useIsMobile } from './useIsMobile';
import type { MissionApi, MissionCtx } from './missions';
import { missionById } from './missions';

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

type Section = 'lab' | 'guided' | 'osi' | 'tshoot' | 'quiz' | 'flashcards' | 'match' | 'pbq';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'lab', label: 'Visual Lab' },
  { id: 'guided', label: 'Guided' },
  { id: 'osi', label: 'OSI Model' },
  { id: 'tshoot', label: 'Troubleshoot' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'match', label: 'Match' },
  { id: 'pbq', label: 'PBQs' },
];

interface Point {
  x: number;
  y: number;
}

interface Camera {
  x: number;
  y: number;
  k: number;
}

interface DemoState {
  conceptId: string;
  step: number;
  playing: boolean;
  runId: number;
}

interface ActiveDemoFlight {
  id: string;
  points: Point[];
  color?: string;
  label?: string;
  fail?: boolean;
  delay?: number;
}

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
  { id: uid(), kind: 'system', text: 'Welcome to Net+ Visual Lab (a tiny Packet Tracer).' },
  {
    id: uid(),
    kind: 'info',
    text: 'Build mode: grab the Ping tool and click Laptop-1, then Server-1. Learn mode: 21 guided concept demos.',
  },
  { id: uid(), kind: 'info', text: 'Scroll to zoom, drag the background to pan. Help has the full tour.' },
];

function ipLabel(d: Device, net: NetInfo): string {
  if (d.type === 'switch') return 'L2 · no IP';
  if (d.type === 'firewall') return d.blockIcmp ? 'ICMP blocked' : 'ICMP allowed';
  // A hand-configured host shows what you typed, not the auto address.
  if (isHost(d.type) && d.ipMode === 'static') {
    const eff = effectiveAddr(d, net);
    if (!eff || eff.invalid || !eff.ip) return 'static · set IP';
    return eff.ip;
  }
  const addrs = net.addrs.get(d.id);
  if (!addrs || addrs.length === 0) return 'no network';
  if (d.type === 'router' && addrs.length > 1) return `${addrs[0].ip} +${addrs.length - 1}`;
  return addrs[0].ip;
}

function conceptDevices(c: Concept): { devices: Device[]; links: Link[] } {
  return {
    devices: c.topology.devices.map((d) => ({
      id: d.id,
      type: d.type,
      name: d.name,
      mac: randMac(),
      x: d.x,
      y: d.y,
      blockIcmp: d.blockIcmp ?? false,
    })),
    links: c.topology.links.map(([a, b]) => ({ id: uid(), a, b })),
  };
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
      <text x={cx} y={cy - r - 10} textAnchor="middle" className="bubble-label" fill={seg.color}>
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
  highlighted,
  cursor,
  onDown,
  onMove,
  onUp,
}: {
  d: Device;
  label: string;
  selected: boolean;
  pending: boolean;
  highlighted: boolean;
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
      {highlighted && <circle r={40} className="ring hl" />}
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
  const isMobile = useIsMobile();
  const initial = useMemo(demoState, []);
  const [devices, setDevices] = useState<Device[]>(initial.devices);
  const [links, setLinks] = useState<Link[]>(initial.links);
  const [tab, setTab] = useState<SidebarTab>('build');
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [log, setLog] = useState<LogEntry[]>(WELCOME);
  const [flight, setFlight] = useState<{ plan: PingPlan; points: Point[]; runId: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, k: 1 });
  const [task, setTask] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [demoFlights, setDemoFlights] = useState<ActiveDemoFlight[] | null>(null);
  const [demoHighlight, setDemoHighlight] = useState<Set<string> | null>(null);
  const [demoNotes, setDemoNotes] = useState<DemoNote[] | null>(null);
  const [section, setSection] = useState<Section>('lab');
  const [navOpen, setNavOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('netlab.nav.open') !== '0';
    } catch {
      return true;
    }
  });
  const toggleNav = useCallback(() => {
    setNavOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem('netlab.nav.open', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const [mission, setMission] = useState<{ id: string; step: number } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [lastPingOk, setLastPingOk] = useState(false);
  const [pbqReq, setPbqReq] = useState<{ id: string; n: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const sandboxRef = useRef<{ devices: Device[]; links: Link[] } | null>(null);
  const flightsLeft = useRef(0);
  const playingRef = useRef(true);
  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  const linksRef = useRef(links);
  linksRef.current = links;

  const net: NetInfo = useMemo(() => computeNetworks(devices, links), [devices, links]);
  const byId = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);
  const concept = demo ? (conceptById(demo.conceptId) ?? null) : null;
  playingRef.current = demo?.playing ?? false;

  const pushLog = useCallback((text: string, kind: LogKind = 'info') => {
    setLog((l) => [...l.slice(-249), { id: uid(), text, kind }]);
  }, []);
  const pushEvents = useCallback((es: PlanEvent[]) => {
    setLog((l) => [...l.slice(-249), ...es.map((e) => ({ id: uid(), text: e.text, kind: e.kind }))]);
  }, []);
  const endFlight = useCallback(() => setFlight(null), []);

  const svgPoint = (e: { clientX: number; clientY: number }): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - cam.x) / cam.k, y: (e.clientY - r.top - cam.y) / cam.k };
  };

  // ---------- camera ----------

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      setCam((c) => {
        const k = Math.min(2.5, Math.max(0.3, c.k * Math.exp(-e.deltaY * 0.0014)));
        return { k, x: mx - ((mx - c.x) * k) / c.k, y: my - ((my - c.y) * k) / c.k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [section]);

  const zoomBy = (f: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const mx = el.clientWidth / 2;
    const my = el.clientHeight / 2;
    setCam((c) => {
      const k = Math.min(2.5, Math.max(0.3, c.k * f));
      return { k, x: mx - ((mx - c.x) * k) / c.k, y: my - ((my - c.y) * k) / c.k };
    });
  };

  // ---------- sandbox actions ----------

  const selectTool = (t: Tool) => {
    setTool(t);
    setPendingId(null);
  };

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
            `${d.name} already has a cable. Hosts have a single NIC. Add a Switch to connect more devices.`,
            'warn'
          );
        } else if (d.type === 'firewall') {
          pushLog(`${d.name} is an inline firewall. It only has 2 ports (in and out).`, 'warn');
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
    setPingCount((c) => c + 1);
    if (!res.ok) {
      setLastPingOk(false);
      pushEvents(res.msgs);
      return;
    }
    setLastPingOk(res.plan.outcome === 'success');
    const points = res.plan.path.map((id) => {
      const d = byId.get(id)!;
      return { x: d.x, y: d.y };
    });
    setFlight({ plan: res.plan, points, runId: Date.now() });
  };

  const configureDevice = (id: string, patch: DeviceConfig) => {
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    const d = byId.get(id);
    if (!d) return;
    if (patch.ipMode === 'static') {
      pushLog(`${d.name}: switched to static addressing. Type an IP, mask, and gateway by hand.`, 'system');
    } else if (patch.ipMode === 'auto') {
      pushLog(`${d.name}: back to automatic (DHCP-style) addressing.`, 'system');
    } else if (d.ipMode === 'static' && (patch.staticIp !== undefined || patch.staticMask !== undefined || patch.staticGateway !== undefined)) {
      const next = { ...d, ...patch };
      if (next.staticIp && ipToInt(next.staticIp) !== null) {
        const maskTxt = next.staticMask?.trim() || 'no mask';
        const gwTxt = next.staticGateway?.trim() ? ` gw ${next.staticGateway.trim()}` : '';
        pushLog(`${d.name} ipconfig → ${next.staticIp} mask ${maskTxt}${gwTxt}`, 'info');
      }
    }
  };

  const toggleIcmp = (id: string, blocked: boolean) => {
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, blockIcmp: blocked } : d)));
    const d = byId.get(id);
    pushLog(
      `${d?.name} now ${blocked ? 'BLOCKS ICMP. Pings through it will be dropped' : 'allows ICMP. Pings can pass'}.`,
      blocked ? 'warn' : 'system'
    );
  };

  // ---------- demo mode ----------

  const clearDemoUi = () => {
    setDemo(null);
    setCaption(null);
    setDemoFlights(null);
    setDemoHighlight(null);
    setDemoNotes(null);
    history.replaceState(null, '', location.pathname);
  };

  const enterDemo = (conceptId: string) => {
    const c = conceptById(conceptId);
    if (!c) return;
    if (!demo) sandboxRef.current = { devices: devicesRef.current, links: linksRef.current };
    const fresh = conceptDevices(c);
    setDevices(fresh.devices);
    setLinks(fresh.links);
    setTool('select');
    setPendingId(null);
    setSelectedId(null);
    setFlight(null);
    setTask(null);
    setTab('learn');
    setDemoFlights(null);
    setDemoHighlight(null);
    setDemoNotes(null);
    setCam({ x: 0, y: 0, k: 1 });
    setDemo({ conceptId, step: 0, playing: true, runId: Date.now() });
    pushLog(`▶ Demo · ${c.title}: ${c.problem}`, 'system');
    history.replaceState(null, '', `?c=${conceptId}`);
  };

  const exitDemo = () => {
    clearDemoUi();
    if (sandboxRef.current) {
      setDevices(sandboxRef.current.devices);
      setLinks(sandboxRef.current.links);
      sandboxRef.current = null;
    }
    setSelectedId(null);
  };

  // Jump from a quiz/flashcard/PBQ straight into the matching Learn demo.
  const goToResource = (conceptId: string) => {
    setTab('learn');
    enterDemo(conceptId);
    setSection('lab');
  };

  const handsOn = () => {
    if (!concept) return;
    const c = concept;
    clearDemoUi();
    sandboxRef.current = null;
    const fresh = conceptDevices(c);
    setDevices(fresh.devices);
    setLinks(fresh.links);
    setSelectedId(null);
    setTab('build');
    setTool('ping');
    setTask(c.tryIt);
    pushLog(`🧪 Hands-on · ${c.title}. Your turn: ${c.tryIt}`, 'system');
  };

  const advance = useCallback(() => {
    setDemo((d) => (d ? { ...d, step: d.step + 1 } : d));
  }, []);

  // Demo step executor: runs the current step, auto-advancing while playing.
  useEffect(() => {
    if (!demo) return;
    const c = conceptById(demo.conceptId);
    if (!c) return;
    const step = c.steps[demo.step];
    if (!step) {
      setCaption('Demo complete. Replay it, pick the next concept, or try it yourself in the sandbox.');
      setDemo((d) => (d && d.playing ? { ...d, playing: false } : d));
      return;
    }
    let timeout: number | undefined;
    const auto = (text: string) => {
      timeout = window.setTimeout(() => {
        if (playingRef.current) advance();
      }, Math.max(2800, 55 * text.length));
    };
    setDemoHighlight(null);
    setDemoNotes(('notes' in step && step.notes ? step.notes : null) as DemoNote[] | null);

    if (step.kind === 'say') {
      setCaption(step.text);
      pushLog(step.text, 'info');
      auto(step.text);
    } else if (step.kind === 'highlight') {
      setDemoHighlight(new Set(step.ids));
      setCaption(step.say);
      pushLog(step.say, 'info');
      auto(step.say);
    } else if (step.kind === 'note') {
      const say = step.say ?? step.notes.map((n) => n.text).join(' ');
      setCaption(say);
      pushLog(say, 'info');
      auto(say);
    } else if (step.kind === 'set') {
      setDevices((ds) => ds.map((d) => (d.id === step.id ? { ...d, blockIcmp: step.blockIcmp } : d)));
      setCaption(step.say);
      pushLog(step.say, 'warn');
      auto(step.say);
    } else {
      const list = step.kind === 'flight' ? [step] : step.flights;
      const say = step.say;
      if (say) {
        setCaption(say);
        pushLog(say, 'info');
      }
      const pos = new Map(devicesRef.current.map((d) => [d.id, { x: d.x, y: d.y }]));
      const fls: ActiveDemoFlight[] = [];
      list.forEach((f, i) => {
        let path = findPath(f.from, f.to, linksRef.current);
        if (!path) return;
        let fail = false;
        if (step.kind === 'flight' && step.stopAt) {
          const idx = path.indexOf(step.stopAt);
          if (idx >= 0) {
            path = path.slice(0, idx + 1);
            fail = true;
          }
        }
        fls.push({
          id: `${demo.runId}-${demo.step}-${i}`,
          points: path.map((id) => pos.get(id)!),
          color: f.color,
          label: f.label,
          fail,
          delay: i * 0.55,
        });
      });
      if (fls.length === 0) {
        auto(say ?? '');
      } else {
        flightsLeft.current = fls.length;
        setDemoFlights(fls);
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo?.runId, demo?.step]);

  const onDemoFlightDone = useCallback(() => {
    flightsLeft.current -= 1;
    if (flightsLeft.current <= 0) {
      setDemoFlights(null);
      window.setTimeout(() => {
        if (playingRef.current) advance();
      }, 500);
    }
  }, [advance]);

  // Deep link: ?c=<conceptId> jumps straight into that demo.
  useEffect(() => {
    const c = new URLSearchParams(location.search).get('c');
    if (c && conceptById(c)) enterDemo(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (demo) {
          exitDemo();
        } else {
          setTool('select');
          setPendingId(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHelp, demo]);

  // ---------- canvas pointer handling ----------

  const onBgDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    panRef.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
  };

  const onBgMove = (e: React.PointerEvent) => {
    const p = panRef.current;
    if (p) {
      const dx = e.clientX - p.sx;
      const dy = e.clientY - p.sy;
      if (p.moved || Math.hypot(dx, dy) > 5) {
        p.moved = true;
        setCam((c) => ({ ...c, x: p.cx + dx, y: p.cy + dy }));
      }
      return;
    }
    if (pendingId && (tool === 'cable' || tool === 'ping')) setCursorPos(svgPoint(e));
  };

  const onBgUp = (e: React.PointerEvent) => {
    const p = panRef.current;
    panRef.current = null;
    if (!p || p.moved) return;
    if (demo) {
      setSelectedId(null);
      return;
    }
    const pt = svgPoint(e);
    if (isDeviceTool(tool)) {
      const d = makeDevice(tool, pt.x, pt.y, devices);
      setDevices((ds) => [...ds, d]);
      setSelectedId(d.id);
      pushLog(`Added ${d.name} (MAC ${d.mac}).`, 'system');
    } else {
      setSelectedId(null);
      setPendingId(null);
    }
  };

  const onSvgMove = (e: React.PointerEvent) => {
    if (!panRef.current && pendingId && (tool === 'cable' || tool === 'ping')) setCursorPos(svgPoint(e));
  };

  const onDeviceDown = (e: React.PointerEvent, d: Device) => {
    e.stopPropagation();
    if (demo || tool === 'select') {
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

  // ---------- topbar actions ----------

  const loadDemo = () => {
    clearDemoUi();
    sandboxRef.current = null;
    const fresh = demoState();
    setDevices(fresh.devices);
    setLinks(fresh.links);
    setSelectedId(null);
    setPendingId(null);
    setFlight(null);
    setTask(null);
    setTab('build');
    pushLog('Starter network loaded: two LANs joined by Router-1.', 'system');
  };

  const clearAll = () => {
    clearDemoUi();
    sandboxRef.current = null;
    setDevices([]);
    setLinks([]);
    setSelectedId(null);
    setPendingId(null);
    setFlight(null);
    setTask(null);
    setTab('build');
    pushLog('Canvas cleared. Build your own network. Start with two laptops and a switch.', 'system');
  };

  const onTab = (t: SidebarTab) => {
    if (t === 'build' && demo) exitDemo();
    setTab(t);
  };

  // ---------- guided missions ----------

  const missionApi: MissionApi = {
    reset: (ds = [], ls = []) => {
      clearDemoUi();
      sandboxRef.current = null;
      setDevices(ds);
      setLinks(ls);
      setSelectedId(null);
      setPendingId(null);
      setFlight(null);
      setTask(null);
      setTab('build');
    },
    setTool: (t) => setTool(t),
    setTab: (t) => setTab(t),
    select: (id) => setSelectedId(id),
    flight: (specs) => {
      const ds = devicesRef.current;
      const ls = linksRef.current;
      const pos = new Map(ds.map((d) => [d.id, { x: d.x, y: d.y }]));
      const fls: ActiveDemoFlight[] = [];
      specs.forEach((s, i) => {
        const a = ds.find((d) => d.name === s.from);
        const b = ds.find((d) => d.name === s.to);
        if (!a || !b) return;
        const path = findPath(a.id, b.id, ls);
        if (!path) return;
        fls.push({
          id: `mflight-${Date.now()}-${i}`,
          points: path.map((id) => pos.get(id)!),
          color: s.color,
          label: s.label,
          delay: s.delay ?? 0,
        });
      });
      if (fls.length === 0) return;
      flightsLeft.current = fls.length;
      setDemoFlights(fls);
    },
  };

  const missionCtx: MissionCtx = { devices, links, net, selectedId, tool, tab, pingCount, lastPingOk };

  const startMission = (id: string) => {
    setMission({ id, step: 0 });
    setSection('lab');
  };
  const exitMission = () => {
    setMission(null);
    setSection('guided');
  };
  // Deep-link from a guided mission straight into the PBQ that drills it.
  const openPbq = (id: string) => {
    setPbqReq((r) => ({ id, n: (r?.n ?? 0) + 1 }));
    setMission(null);
    setSection('pbq');
  };
  const nextStep = () => {
    if (!mission) return;
    const mis = missionById(mission.id);
    if (!mis) return;
    if (mission.step + 1 >= mis.steps.length) {
      markDone(mission.id);
      setMission(null);
      setSection('guided');
      return;
    }
    setMission({ id: mission.id, step: mission.step + 1 });
  };
  const backStep = () => {
    if (mission && mission.step > 0) setMission({ id: mission.id, step: mission.step - 1 });
  };

  const hint = useMemo(() => {
    if (tool === 'select') return 'Select: click to inspect · drag devices · drag background to pan · scroll to zoom';
    if (tool === 'cable')
      return pendingId ? 'Cable: now click the second device' : 'Cable: click the first device to connect';
    if (tool === 'ping')
      return pendingId ? 'Ping: now click the destination' : 'Ping: click the source device';
    if (tool === 'delete') return 'Delete: click a device or a cable';
    return `Place: click anywhere on the canvas to drop a ${DEVICE_LABEL[tool as DeviceType]} (Esc when done)`;
  }, [tool, pendingId]);

  const deviceCursor =
    demo || tool === 'select' ? 'grab' : tool === 'cable' || tool === 'ping' ? 'crosshair' : 'pointer';
  const canvasCursor = !demo && isDeviceTool(tool) ? 'crosshair' : 'default';

  const selectedDevice = selectedId ? (byId.get(selectedId) ?? null) : null;
  const pendingDevice = pendingId ? byId.get(pendingId) : undefined;
  const conceptIndex = concept ? conceptById(concept.id) : null;
  const stepCount = concept ? concept.steps.length : 0;
  const stepNow = demo ? Math.min(demo.step + 1, stepCount) : 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">Net+ Visual Lab</div>
            <div className="brand-sub">learn networking by seeing it move</div>
            <a
              className="brand-by"
              href="https://johnnynguyen.cloud"
              target="_blank"
              rel="noopener noreferrer"
              title="Built by Johnny Nguyen - see more at johnnynguyen.cloud"
            >
              built by Johnny Nguyen ↗
            </a>
          </div>
          {section === 'lab' && (
            <span className="counts" title="What is on the canvas right now">
              <strong>{devices.length}</strong> devices
              <span className="counts-sep">·</span>
              {links.length} cables
              <span className="counts-sep">·</span>
              {net.segments.length} networks
            </span>
          )}
        </div>
        {navOpen && (
          <nav className="sectionnav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={section === s.id ? 'snav active' : 'snav'}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        )}
        <div className="topbar-right">
          <button
            className="btn nav-toggle"
            onClick={toggleNav}
            aria-pressed={navOpen}
            title={navOpen ? 'Hide the section tabs' : 'Show the section tabs'}
          >
            <span aria-hidden>{navOpen ? '\u2715' : '\u2630'}</span>
            {navOpen ? 'Hide tabs' : SECTIONS.find((s) => s.id === section)?.label ?? 'Menu'}
          </button>
          {section === 'lab' && (
            <div className="lab-actions">
              <button className="btn" onClick={loadDemo}>
                Starter
              </button>
              <button className="btn" onClick={clearAll}>
                Clear
              </button>
            </div>
          )}
          <SessionTimer />
          <button className="btn accent" onClick={() => setShowHelp(true)}>
            Help
          </button>
        </div>
      </header>
      {isMobile && <MobileBanner />}
      {isMobile && (section === 'lab' || section === 'guided') ? (
        <DesktopOnlyNotice section={section} />
      ) : section === 'guided' && !mission ? (
        <GuidedHome onStart={startMission} />
      ) : section === 'osi' ? (
        <OsiModel onPractice={openPbq} onResource={goToResource} />
      ) : section === 'tshoot' ? (
        <Troubleshoot onPractice={openPbq} onResource={goToResource} />
      ) : section === 'quiz' ? (
        <QuizMode onResource={goToResource} />
      ) : section === 'flashcards' ? (
        <Flashcards onResource={goToResource} />
      ) : section === 'match' ? (
        <MatchGame />
      ) : section === 'pbq' ? (
        <PbqMode onResource={goToResource} openRequest={pbqReq} />
      ) : (
        <div className="main">
        <Toolbar
          tab={tab}
          onTab={onTab}
          tool={tool}
          onSelectTool={selectTool}
          activeConcept={demo?.conceptId ?? null}
          onConcept={enterDemo}
        />
        <div
          ref={wrapRef}
          className="canvas-wrap"
          style={{
            cursor: canvasCursor,
            backgroundPosition: `${cam.x}px ${cam.y}px`,
            backgroundSize: `${26 * cam.k}px ${26 * cam.k}px`,
          }}
        >
          <svg ref={svgRef} className="scene" onPointerMove={onSvgMove}>
            <rect
              className="bg"
              width="100%"
              height="100%"
              fill="transparent"
              onPointerDown={onBgDown}
              onPointerMove={onBgMove}
              onPointerUp={onBgUp}
            />
            <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
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
                    className={!demo && tool === 'delete' ? 'link deletable' : 'link'}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (!demo && tool === 'delete') removeLink(l.id);
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
                  label={ipLabel(d, net)}
                  selected={selectedId === d.id}
                  pending={pendingId === d.id}
                  highlighted={demoHighlight?.has(d.id) ?? false}
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
              {demoFlights?.map((f) => (
                <DemoFlight
                  key={f.id}
                  points={f.points}
                  color={f.color}
                  label={f.label}
                  fail={f.fail}
                  delay={f.delay}
                  onDone={onDemoFlightDone}
                />
              ))}
              {demoNotes && (
                <DemoAnnotations
                  notes={demoNotes}
                  pos={new Map(devices.map((d) => [d.id, { x: d.x, y: d.y }]))}
                />
              )}
            </g>
          </svg>

          <div className="zoom-controls">
            <button className="btn" onClick={() => zoomBy(1.25)} title="Zoom in">
              +
            </button>
            <button className="btn" onClick={() => zoomBy(0.8)} title="Zoom out">
              −
            </button>
            <button className="btn" onClick={() => setCam({ x: 0, y: 0, k: 1 })} title="Reset view">
              ⤢
            </button>
          </div>

          {task && !demo && (
            <div className="task-banner">
              <span className="task-tag">Try it</span>
              <span>{task}</span>
              <button className="task-close" onClick={() => setTask(null)} aria-label="Dismiss task">
                ✕
              </button>
            </div>
          )}

          {demo && concept && conceptIndex ? (
            <div className="caption-card">
              <div className="caption-head">
                <span className="caption-title">
                  Demo · {concept.title}
                </span>
                <span className="caption-progress">
                  step {stepNow}/{stepCount}
                </span>
              </div>
              <p className="caption-text">{caption ?? concept.problem}</p>
              <div className="caption-controls">
                <button className="btn small" onClick={() => enterDemo(concept.id)} title="Replay">
                  ⟲ Replay
                </button>
                <button
                  className="btn small"
                  onClick={() =>
                    setDemo((d) => {
                      if (!d) return d;
                      if (!d.playing && d.step >= stepCount) return d;
                      if (!d.playing) {
                        window.setTimeout(advance, 250);
                        return { ...d, playing: true };
                      }
                      return { ...d, playing: false };
                    })
                  }
                >
                  {demo.playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button className="btn small" onClick={advance} disabled={demo.step >= stepCount}>
                  Next ▸
                </button>
                <button className="btn small accent" onClick={handsOn}>
                  🧪 Try it yourself
                </button>
                <button className="btn small" onClick={exitDemo}>
                  ✕ Exit
                </button>
              </div>
            </div>
          ) : (
            <div className="hint">{hint}</div>
          )}
        </div>
        <aside className="side">
          <DetailsPanel device={selectedDevice} net={net} onToggleIcmp={toggleIcmp} onConfig={configureDevice} />
          <EventLog log={log} onClear={() => setLog([])} />
        </aside>
      </div>
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {mission &&
        (() => {
          const mis = missionById(mission.id);
          if (!mis) return null;
          return (
            <GuidedOverlay
              mission={mis}
              stepIndex={mission.step}
              ctx={missionCtx}
              api={missionApi}
              onNext={nextStep}
              onBack={backStep}
              onExit={exitMission}
              onPractice={openPbq}
            />
          );
        })()}
    </div>
  );
}
