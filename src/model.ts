export type DeviceType = 'laptop' | 'pc' | 'server' | 'switch' | 'router' | 'firewall';

export type Tool = 'select' | 'cable' | 'ping' | 'delete' | DeviceType;

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  mac: string;
  x: number;
  y: number;
  blockIcmp: boolean;
}

export interface Link {
  id: string;
  a: string;
  b: string;
}

export type LogKind = 'info' | 'success' | 'error' | 'warn' | 'system';

export interface LogEntry {
  id: string;
  text: string;
  kind: LogKind;
}

export interface PlanEvent {
  text: string;
  kind: LogKind;
}

export const DEVICE_LABEL: Record<DeviceType, string> = {
  laptop: 'Laptop',
  pc: 'PC',
  server: 'Server',
  switch: 'Switch',
  router: 'Router',
  firewall: 'Firewall',
};

export const DEVICE_COLOR: Record<DeviceType, string> = {
  laptop: '#2dd4bf',
  pc: '#60a5fa',
  server: '#f87171',
  switch: '#cbd5e1',
  router: '#a78bfa',
  firewall: '#fb923c',
};

export const BUBBLE_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#eab308', '#f97316', '#ec4899'];

export const isHost = (t: DeviceType): boolean => t === 'laptop' || t === 'pc' || t === 'server';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function randMac(): string {
  const h = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return [h(), h(), h(), h(), h(), h()].join(':');
}

export function nextName(type: DeviceType, devices: Device[]): string {
  const names = new Set(devices.map((d) => d.name));
  let n = 1;
  while (names.has(`${DEVICE_LABEL[type]}-${n}`)) n++;
  return `${DEVICE_LABEL[type]}-${n}`;
}

export function makeDevice(type: DeviceType, x: number, y: number, devices: Device[]): Device {
  return { id: uid(), type, name: nextName(type, devices), mac: randMac(), x, y, blockIcmp: false };
}

export interface Segment {
  id: string;
  kind: 'lan' | 'p2p';
  subnet: string;
  base: string;
  color: string;
  memberIds: string[];
  gatewayId?: string;
  gatewayIp?: string;
}

export interface Addr {
  segId: string;
  ip: string;
}

export interface NetInfo {
  segments: Segment[];
  addrs: Map<string, Addr[]>;
  segsOf: Map<string, Set<string>>;
}

// L2 segments: connected components of the graph with routers acting as
// boundaries. Firewalls are transparent (bridge mode), so they merge segments
// like a switch does. Each LAN segment gets a /24; router-to-router cables get
// their own /30 transit subnet.
export function computeNetworks(devices: Device[], links: Link[]): NetInfo {
  const byId = new Map(devices.map((d) => [d.id, d]));
  const order = new Map(devices.map((d, i) => [d.id, i]));

  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    parent.set(find(a), find(b));
  };

  for (const d of devices) if (d.type !== 'router') parent.set(d.id, d.id);

  const linked = new Set<string>();
  for (const l of links) {
    linked.add(l.a);
    linked.add(l.b);
  }

  for (const l of links) {
    const ta = byId.get(l.a)?.type;
    const tb = byId.get(l.b)?.type;
    if (ta && tb && ta !== 'router' && tb !== 'router') union(l.a, l.b);
  }

  const comps = new Map<string, Set<string>>();
  for (const d of devices) {
    if (d.type === 'router' || !linked.has(d.id)) continue;
    const r = find(d.id);
    if (!comps.has(r)) comps.set(r, new Set());
    comps.get(r)!.add(d.id);
  }

  for (const l of links) {
    const da = byId.get(l.a);
    const db = byId.get(l.b);
    if (!da || !db) continue;
    if (da.type === 'router' && db.type !== 'router') comps.get(find(db.id))?.add(da.id);
    else if (db.type === 'router' && da.type !== 'router') comps.get(find(da.id))?.add(db.id);
  }

  const minOrder = (s: Set<string>) => Math.min(...[...s].map((id) => order.get(id) ?? 0));
  const lanList = [...comps.values()].sort((a, b) => minOrder(a) - minOrder(b));

  const p2pLinks = links.filter(
    (l) => byId.get(l.a)?.type === 'router' && byId.get(l.b)?.type === 'router'
  );

  const segments: Segment[] = [];
  const addrs = new Map<string, Addr[]>();
  const segsOf = new Map<string, Set<string>>();
  const addAddr = (devId: string, segId: string, ip: string) => {
    if (!addrs.has(devId)) addrs.set(devId, []);
    addrs.get(devId)!.push({ segId, ip });
  };
  const addMember = (devId: string, segId: string) => {
    if (!segsOf.has(devId)) segsOf.set(devId, new Set());
    segsOf.get(devId)!.add(segId);
  };

  lanList.forEach((members, i) => {
    const base = `192.168.${i + 1}`;
    const segId = `lan-${i}`;
    const list = [...members].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    const routers = list.filter((id) => byId.get(id)?.type === 'router');
    const hosts = list.filter((id) => isHost(byId.get(id)!.type));
    segments.push({
      id: segId,
      kind: 'lan',
      subnet: `${base}.0/24`,
      base,
      color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      memberIds: list,
      gatewayId: routers[0],
      gatewayIp: routers.length ? `${base}.1` : undefined,
    });
    routers.forEach((id, k) => addAddr(id, segId, `${base}.${k + 1}`));
    hosts.forEach((id, k) => addAddr(id, segId, `${base}.${k + 10}`));
    list.forEach((id) => addMember(id, segId));
  });

  p2pLinks.forEach((l, k) => {
    const base = `10.0.${k + 1}`;
    const segId = `p2p-${k}`;
    segments.push({
      id: segId,
      kind: 'p2p',
      subnet: `${base}.0/30`,
      base,
      color: BUBBLE_COLORS[(lanList.length + k) % BUBBLE_COLORS.length],
      memberIds: [l.a, l.b],
    });
    addAddr(l.a, segId, `${base}.1`);
    addAddr(l.b, segId, `${base}.2`);
    addMember(l.a, segId);
    addMember(l.b, segId);
  });

  return { segments, addrs, segsOf };
}

export function findPath(srcId: string, dstId: string, links: Link[]): string[] | null {
  if (srcId === dstId) return [srcId];
  const adj = new Map<string, string[]>();
  for (const l of links) {
    if (!adj.has(l.a)) adj.set(l.a, []);
    if (!adj.has(l.b)) adj.set(l.b, []);
    adj.get(l.a)!.push(l.b);
    adj.get(l.b)!.push(l.a);
  }
  const prev = new Map<string, string>();
  const seen = new Set([srcId]);
  const queue = [srcId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === dstId) break;
    for (const nb of adj.get(cur) ?? []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  if (!seen.has(dstId)) return null;
  const path: string[] = [dstId];
  while (path[0] !== srcId) path.unshift(prev.get(path[0])!);
  return path;
}

export interface PingPlan {
  path: string[];
  stopIndex: number;
  outcome: 'success' | 'blocked';
  eventsAt: Map<number, PlanEvent[]>;
  finale: PlanEvent[];
}

export type PingResult = { ok: true; plan: PingPlan } | { ok: false; msgs: PlanEvent[] };

export function planPing(
  srcId: string,
  dstId: string,
  devices: Device[],
  links: Link[],
  net: NetInfo
): PingResult {
  const byId = new Map(devices.map((d) => [d.id, d]));
  const src = byId.get(srcId);
  const dst = byId.get(dstId);
  if (!src || !dst) return { ok: false, msgs: [{ text: 'Device not found.', kind: 'error' }] };

  const fail = (text: string, kind: LogKind = 'warn'): PingResult => ({ ok: false, msgs: [{ text, kind }] });

  for (const d of [src, dst]) {
    if (d.type === 'switch' || d.type === 'firewall') {
      return fail(
        `${d.name} is a Layer 2 device — it has no IP address to ping. Try a laptop, PC, server, or router.`
      );
    }
  }

  const srcAddrs = net.addrs.get(srcId) ?? [];
  const dstAddrs = net.addrs.get(dstId) ?? [];
  if (srcAddrs.length === 0)
    return fail(`${src.name} has no IP — it isn't connected to any network yet. Cable it to a switch or router first.`);
  if (dstAddrs.length === 0)
    return fail(`${dst.name} has no IP — it isn't connected to any network yet. Cable it to a switch or router first.`);

  const path = findPath(srcId, dstId, links);
  if (!path)
    return fail(`Destination unreachable — there is no path from ${src.name} to ${dst.name}. Are they cabled together (through a router)?`, 'error');

  const srcSegs = net.segsOf.get(srcId) ?? new Set<string>();
  const dstSegs = net.segsOf.get(dstId) ?? new Set<string>();
  const sameSubnet = [...srcSegs].some((s) => dstSegs.has(s));
  const dstIp = dstAddrs[0].ip;
  const segById = new Map(net.segments.map((s) => [s.id, s]));
  const srcSeg = segById.get([...srcSegs][0]);
  const segOfPair = (x: string, y: string): Segment | undefined =>
    net.segments.find((s) => s.memberIds.includes(x) && s.memberIds.includes(y));

  const eventsAt = new Map<number, PlanEvent[]>();
  const put = (i: number, text: string, kind: LogKind = 'info') => {
    if (!eventsAt.has(i)) eventsAt.set(i, []);
    eventsAt.get(i)!.push({ text, kind });
  };

  put(0, `${src.name} → ping ${dstIp} (${dst.name})`, 'system');
  if (sameSubnet) {
    put(0, `${src.name}: ${dst.name} is on my subnet (${srcSeg?.subnet}) — ARP for its MAC, then send the frame directly.`);
  } else if (src.type === 'router') {
    put(0, `${src.name}: ${dstIp} isn't directly connected — consulting my routing table.`);
  } else {
    put(0, `${src.name}: ${dstIp} is on a different subnet — sending the packet to my default gateway (${srcSeg?.gatewayIp}).`);
  }

  let stopIndex = path.length - 1;
  let outcome: 'success' | 'blocked' = 'success';

  for (let i = 1; i < path.length - 1; i++) {
    const d = byId.get(path[i])!;
    const next = byId.get(path[i + 1])!;
    if (d.type === 'switch') {
      put(i, `${d.name}: Layer 2 switch — MAC table lookup, forwarding the frame toward ${next.name}.`);
    } else if (d.type === 'firewall') {
      if (d.blockIcmp) {
        put(i, `${d.name}: inspecting packet… ICMP is BLOCKED by rule — packet dropped.`, 'error');
        stopIndex = i;
        outcome = 'blocked';
        break;
      }
      put(i, `${d.name}: inspecting packet… ICMP allowed — passing it through.`);
    } else if (d.type === 'router') {
      const outSeg = segOfPair(d.id, next.id);
      put(i, `${d.name}: routing the packet onto ${outSeg?.subnet ?? 'the next network'} (TTL −1, new frame, same IP packet).`);
    } else {
      put(i, `${d.name}: passing the packet along.`);
    }
  }

  const finale: PlanEvent[] = [];
  if (outcome === 'blocked') {
    const fw = byId.get(path[stopIndex])!;
    finale.push({
      text: `Request timed out — ${fw.name} dropped your ping. (Select it and un-check "Block ICMP" to fix this.)`,
      kind: 'error',
    });
  } else {
    put(path.length - 1, `${dst.name}: echo request received — sending an echo reply back.`, 'success');
    finale.push({ text: `${src.name}: reply from ${dstIp} — ping successful ✓`, kind: 'success' });
  }

  return { ok: true, plan: { path, stopIndex, outcome, eventsAt, finale } };
}
