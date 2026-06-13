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
  // Manual addressing. Hosts default to 'auto' (the app assigns an IP per LAN,
  // "DHCP did it for me"). Switch to 'static' to configure by hand and watch a
  // wrong mask or missing gateway break the ping live.
  ipMode?: 'auto' | 'static';
  staticIp?: string;
  staticMask?: string; // dotted ("255.255.255.0"), CIDR ("24"), or "/24"
  staticGateway?: string;
}

export type DeviceConfig = Partial<Pick<Device, 'ipMode' | 'staticIp' | 'staticMask' | 'staticGateway'>>;

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
  return { id: uid(), type, name: nextName(type, devices), mac: randMac(), x, y, blockIcmp: false, ipMode: 'auto' };
}

// ---------- IPv4 helpers (manual addressing) ----------

export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const o = parseInt(p, 10);
    if (o > 255) return null;
    n = (n << 8) + o;
  }
  return n >>> 0;
}

export function cidrToMask(cidr: number): string {
  const m = cidr <= 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  return [(m >>> 24) & 255, (m >>> 16) & 255, (m >>> 8) & 255, m & 255].join('.');
}

// Accepts "255.255.255.0", "24", or "/24". Returns CIDR or null if invalid.
export function parseMask(mask: string): number | null {
  const t = mask.trim().replace(/^\//, '');
  if (/^\d{1,2}$/.test(t)) {
    const c = parseInt(t, 10);
    return c >= 0 && c <= 32 ? c : null;
  }
  const int = ipToInt(t);
  if (int === null) return null;
  // A valid mask is contiguous 1s then 0s.
  const inv = (~int >>> 0) + 1;
  if ((inv & (inv - 1)) !== 0 && int !== 0xffffffff) return null;
  let cidr = 0;
  let v = int;
  while (v & 0x80000000) {
    cidr++;
    v = (v << 1) >>> 0;
  }
  return cidr;
}

export interface EffAddr {
  ip: string;
  cidr: number;
  mask: string;
  gateway?: string;
  source: 'auto' | 'static';
  invalid?: 'ip' | 'mask';
}

// The address a device actually uses right now: hand-configured if static,
// otherwise the auto-assigned one from computeNetworks.
export function effectiveAddr(d: Device, net: NetInfo): EffAddr | null {
  if (d.ipMode === 'static') {
    if (!d.staticIp || ipToInt(d.staticIp) === null) {
      return { ip: d.staticIp ?? '', cidr: 24, mask: cidrToMask(24), gateway: d.staticGateway, source: 'static', invalid: 'ip' };
    }
    const cidr = d.staticMask ? parseMask(d.staticMask) : 24;
    if (cidr === null) {
      return { ip: d.staticIp, cidr: 24, mask: cidrToMask(24), gateway: d.staticGateway, source: 'static', invalid: 'mask' };
    }
    return { ip: d.staticIp, cidr, mask: cidrToMask(cidr), gateway: d.staticGateway?.trim() || undefined, source: 'static' };
  }
  const addrs = net.addrs.get(d.id);
  if (!addrs || addrs.length === 0) return null;
  const seg = net.segments.find((s) => s.id === addrs[0].segId);
  const cidr = seg?.kind === 'p2p' ? 30 : 24;
  return { ip: addrs[0].ip, cidr, mask: cidrToMask(cidr), gateway: seg?.gatewayIp, source: 'auto' };
}

// Same broadcast domain per a host's own mask: how a host decides "local vs
// route to the gateway". Uses the source's mask on purpose — that's the bug
// when someone fat-fingers a /16 onto a /24 network.
export function sameSubnet(a: EffAddr, b: EffAddr, useMask: 'a' | 'b' = 'a'): boolean {
  const ai = ipToInt(a.ip);
  const bi = ipToInt(b.ip);
  if (ai === null || bi === null) return false;
  const cidr = useMask === 'a' ? a.cidr : b.cidr;
  const m = cidr <= 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  return ((ai & m) >>> 0) === ((bi & m) >>> 0);
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
        `${d.name} is a Layer 2 device. It has no IP address to ping. Try a laptop, PC, server, or router.`
      );
    }
  }

  const srcEff = effectiveAddr(src, net);
  const dstEff = effectiveAddr(dst, net);

  if (src.ipMode === 'static' && srcEff?.invalid === 'ip')
    return fail(`${src.name} has a static IP set but "${src.staticIp}" isn't a valid IPv4 address. Fix it in the details panel.`, 'error');
  if (src.ipMode === 'static' && srcEff?.invalid === 'mask')
    return fail(`${src.name}'s subnet mask "${src.staticMask}" isn't valid. Use a dotted mask like 255.255.255.0 or a CIDR like 24.`, 'error');
  if (!srcEff)
    return fail(`${src.name} has no IP: it isn't connected to any network yet. Cable it to a switch or router first.`);
  if (dst.ipMode === 'static' && dstEff?.invalid)
    return fail(`${dst.name} has an invalid static address. Fix it before you can ping it.`, 'error');
  if (!dstEff)
    return fail(`${dst.name} has no IP: it isn't connected to any network yet. Cable it to a switch or router first.`);

  const path = findPath(srcId, dstId, links);
  if (!path)
    return fail(`Destination unreachable: there is no path from ${src.name} to ${dst.name}. Are they cabled together (through a router)?`, 'error');

  const dstIp = dstEff.ip;
  const segOfPair = (x: string, y: string): Segment | undefined =>
    net.segments.find((s) => s.memberIds.includes(x) && s.memberIds.includes(y));
  const netLabel = (e: EffAddr): string => {
    const ai = ipToInt(e.ip);
    if (ai === null) return `${e.ip}/${e.cidr}`;
    const m = e.cidr <= 0 ? 0 : (0xffffffff << (32 - e.cidr)) >>> 0;
    const nw = (ai & m) >>> 0;
    return `${[(nw >>> 24) & 255, (nw >>> 16) & 255, (nw >>> 8) & 255, nw & 255].join('.')}/${e.cidr}`;
  };
  const pathHasRouter = path.slice(1, -1).some((id) => byId.get(id)?.type === 'router');
  const local = sameSubnet(srcEff, dstEff, 'a');
  const dstSeesLocal = sameSubnet(dstEff, srcEff, 'b');

  const eventsAt = new Map<number, PlanEvent[]>();
  const put = (i: number, text: string, kind: LogKind = 'info') => {
    if (!eventsAt.has(i)) eventsAt.set(i, []);
    eventsAt.get(i)!.push({ text, kind });
  };

  put(0, `${src.name} → ping ${dstIp} (${dst.name})`, 'system');

  // Duplicate IP on the wire is a classic real fault.
  const dup = devices.find(
    (d) => d.id !== srcId && effectiveAddr(d, net)?.ip === srcEff.ip
  );
  if (dup) put(0, `Heads up: ${dup.name} also has ${srcEff.ip}. Duplicate IPs cause intermittent, maddening failures.`, 'warn');

  if (src.type === 'router') {
    put(0, `${src.name}: ${dstIp} isn't directly connected. Consulting my routing table.`);
  } else if (local) {
    // Source believes the destination is on its own subnet (by its own mask).
    if (pathHasRouter)
      return fail(`${src.name} thinks ${dstIp} is local — ${dstIp} matches its own subnet ${netLabel(srcEff)} — so it ARPs for it directly instead of using the gateway. But ${dst.name} is across a router, so no ARP reply ever comes. Request times out. Fix: correct ${src.name}'s subnet mask.`, 'error');
    if (!dstSeesLocal)
      return fail(`${src.name} sent the frame straight to ${dst.name} (same wire). But ${dst.name}'s mask says ${srcEff.ip} is on a different subnet, so its reply goes to ITS gateway and never comes back. The two masks disagree. Line up the subnet masks.`, 'error');
    put(0, `${src.name}: ${dstIp} is on my subnet (${netLabel(srcEff)}). ARP for its MAC, then send the frame directly.`);
  } else {
    // Destination is off-subnet: the source needs a default gateway.
    if (!srcEff.gateway)
      return fail(`${src.name}: ${dstIp} is on a different subnet (mine is ${netLabel(srcEff)}) and I have no default gateway set. An off-subnet packet has nowhere to go. Set a default gateway.`, 'error');
    if (!pathHasRouter)
      return fail(`${src.name} and ${dst.name} share one wire but their IPs are in different subnets (${netLabel(srcEff)} vs ${netLabel(dstEff)}). ${src.name} sends to its gateway ${srcEff.gateway}, but there's no router here to forward it. Put them on the same subnet, or add a router.`, 'error');
    put(0, `${src.name}: ${dstIp} is on a different subnet. Sending the packet to my default gateway (${srcEff.gateway}).`);
  }

  let stopIndex = path.length - 1;
  let outcome: 'success' | 'blocked' = 'success';

  for (let i = 1; i < path.length - 1; i++) {
    const d = byId.get(path[i])!;
    const next = byId.get(path[i + 1])!;
    if (d.type === 'switch') {
      put(i, `${d.name}: Layer 2 switch, MAC table lookup, forwarding the frame toward ${next.name}.`);
    } else if (d.type === 'firewall') {
      if (d.blockIcmp) {
        put(i, `${d.name}: inspecting packet… ICMP is BLOCKED by rule. Packet dropped.`, 'error');
        stopIndex = i;
        outcome = 'blocked';
        break;
      }
      put(i, `${d.name}: inspecting packet… ICMP allowed. Passing it through.`);
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
      text: `Request timed out: ${fw.name} dropped your ping. (Select it and un-check "Block ICMP" to fix this.)`,
      kind: 'error',
    });
  } else {
    put(path.length - 1, `${dst.name}: echo request received. Sending an echo reply back.`, 'success');
    finale.push({ text: `${src.name}: reply from ${dstIp}, ping successful ✓`, kind: 'success' });
  }

  return { ok: true, plan: { path, stopIndex, outcome, eventsAt, finale } };
}
