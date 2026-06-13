import type { Device, Link, NetInfo, Tool } from './model';
import { effectiveAddr, ipToInt, planPing, randMac, uid } from './model';

// A guided mission is a sequence of steps played over the real Visual Lab
// canvas. The overlay dims the screen, spotlights one control at a time, and
// only advances when the learner actually does the thing (state-checked). This
// is the "learn the theory, then do it with hand-holding" loop.

export interface MissionCtx {
  devices: Device[];
  links: Link[];
  net: NetInfo;
  selectedId: string | null;
  tool: Tool;
  tab: 'build' | 'learn';
  pingCount: number;
  lastPingOk: boolean;
}

export interface MissionApi {
  reset: (devices?: Device[], links?: Link[]) => void;
  setTool: (t: Tool) => void;
  setTab: (t: 'build' | 'learn') => void;
  select: (id: string | null) => void;
}

export interface MissionStep {
  title: string;
  body: string;
  // data-coach attribute value of the element to spotlight, if any.
  target?: string;
  // Runs once when the step opens (seed the canvas, pick a tool, etc.).
  setup?: (api: MissionApi) => void;
  // Advance gate. start is a snapshot of ctx when the step opened, so a check
  // can ask "did something change since I got here?".
  check?: (ctx: MissionCtx, start: MissionCtx) => boolean;
  hint?: string;
  // Microcopy shown for a beat when the check passes.
  done?: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  domain: string;
  minutes: number;
  steps: MissionStep[];
}

// ---------- check helpers ----------

const byName = (ctx: MissionCtx, name: string): Device | undefined =>
  ctx.devices.find((d) => d.name === name);
const countType = (ctx: MissionCtx, type: Device['type']): number =>
  ctx.devices.filter((d) => d.type === type).length;

const canPing = (ctx: MissionCtx, aName: string, bName: string): boolean => {
  const a = byName(ctx, aName);
  const b = byName(ctx, bName);
  if (!a || !b) return false;
  const r = planPing(a.id, b.id, ctx.devices, ctx.links, ctx.net);
  return r.ok && r.plan.outcome === 'success';
};

const inSubnet = (ip: string, base: string, cidr: number): boolean => {
  const a = ipToInt(ip);
  const n = ipToInt(base);
  if (a === null || n === null) return false;
  const m = cidr <= 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  return ((a & m) >>> 0) === ((n & m) >>> 0);
};

// ---------- seed topologies ----------

const dev = (type: Device['type'], name: string, x: number, y: number, over: Partial<Device> = {}): Device => ({
  id: uid(),
  type,
  name,
  mac: randMac(),
  x,
  y,
  blockIcmp: false,
  ipMode: 'auto',
  ...over,
});

// Two hosts already cabled to a switch, so the learner focuses on addressing.
function staticSeed(): { devices: Device[]; links: Link[] } {
  const l1 = dev('laptop', 'Laptop-1', 260, 200, { ipMode: 'static' });
  const l2 = dev('laptop', 'Laptop-2', 260, 440, { ipMode: 'static' });
  const sw = dev('switch', 'Switch-1', 560, 320);
  return {
    devices: [l1, l2, sw],
    links: [
      { id: uid(), a: l1.id, b: sw.id },
      { id: uid(), a: l2.id, b: sw.id },
    ],
  };
}

// ---------- missions ----------

export const MISSIONS: Mission[] = [
  {
    id: 'first-network',
    title: 'Build your first network',
    subtitle: 'Place a switch, add two hosts, cable them, and prove they can talk.',
    domain: '1.0 Networking Concepts',
    minutes: 4,
    steps: [
      {
        title: 'Every network starts somewhere',
        body: 'A switch is the meeting point for devices on one local network. It forwards frames by MAC address and never touches IPs. We will build the smallest real network: a switch with two computers hanging off it.',
        setup: (api) => {
          api.reset([], []);
          api.setTab('build');
          api.setTool('select');
        },
      },
      {
        title: 'Drop a switch',
        body: 'Grab the Switch from the device tools, then click anywhere on the canvas to place it.',
        target: 'device-switch',
        check: (ctx) => countType(ctx, 'switch') >= 1,
        hint: 'Click the Switch tool first, then click an empty spot on the canvas.',
        done: 'Switch placed. That is your Layer 2 meeting point.',
      },
      {
        title: 'Add two laptops',
        body: 'Now place two laptops. Pick the Laptop tool and click two empty spots. Each one gets its own MAC address the moment it appears.',
        target: 'device-laptop',
        check: (ctx) => countType(ctx, 'laptop') >= 2,
        hint: 'Select the Laptop tool, then click the canvas twice.',
        done: 'Two hosts, two MAC addresses.',
      },
      {
        title: 'Cable them to the switch',
        body: 'Pick the Cable tool. Click Laptop-1, then the Switch. Do the same for Laptop-2. A host has one NIC, so it gets exactly one cable.',
        target: 'tool-cable',
        check: (ctx) => canPing(ctx, 'Laptop-1', 'Laptop-2'),
        hint: 'Cable tool, then click a laptop and the switch. Both laptops need a cable to the switch.',
        done: 'Both hosts share one switch, so the app dropped them in the same subnet automatically.',
      },
      {
        title: 'Ping across the wire',
        body: 'Prove it works. Pick the Ping tool, click Laptop-1, then Laptop-2. Watch the packet hop the path and the event log narrate every step.',
        target: 'tool-ping',
        check: (ctx, start) => ctx.pingCount > start.pingCount && ctx.lastPingOk,
        hint: 'Ping tool, click Laptop-1 (source), then Laptop-2 (destination).',
        done: 'Reply received. You just built and tested a working LAN.',
      },
      {
        title: 'That is a network',
        body: 'Same subnet means the source ARPs for the destination MAC and sends the frame straight across. No router needed yet. Next mission: throw away the automatic IPs and configure addressing by hand.',
      },
    ],
  },
  {
    id: 'configure-ip',
    title: 'Configure IP addresses by hand',
    subtitle: 'Switch off DHCP, type addresses yourself, then break it on purpose to see why masks matter.',
    domain: '5.0 Network Troubleshooting',
    minutes: 7,
    steps: [
      {
        title: 'Auto vs static',
        body: 'So far the app played DHCP and handed out IPs for you. In the real world you often set them by hand: servers, routers, printers, lab gear. Here are two laptops on a switch with no addresses yet. Let us configure them.',
        setup: (api) => {
          const seed = staticSeed();
          api.reset(seed.devices, seed.links);
          api.setTab('build');
          api.setTool('select');
          api.select(null);
        },
      },
      {
        title: 'Select Laptop-1',
        body: 'With the Select tool, click Laptop-1. Its details open on the right, where you can set its address.',
        target: 'tool-select',
        check: (ctx) => byName(ctx, 'Laptop-1')?.id === ctx.selectedId,
        hint: 'Pick the Select tool, then click Laptop-1.',
        done: 'Its details panel is open on the right.',
      },
      {
        title: 'Give it the address 192.168.1.11',
        body: 'In the details panel, the mode is already Static. Type 192.168.1.11 into the IP address field.',
        target: 'static-ip',
        check: (ctx) => {
          const d = byName(ctx, 'Laptop-1');
          return !!d && d.staticIp === '192.168.1.11';
        },
        hint: 'Click the IP address field and type 192.168.1.11 exactly.',
        done: 'Laptop-1 has an IP.',
      },
      {
        title: 'Set the subnet mask',
        body: 'Type 24 (or 255.255.255.0) into the subnet mask field. That mask says "the first three octets are the network, the last is the host". 254 usable addresses.',
        target: 'static-mask',
        check: (ctx) => {
          const d = byName(ctx, 'Laptop-1');
          return !!d && !!d.staticMask && (d.staticMask.trim() === '24' || d.staticMask.trim() === '255.255.255.0');
        },
        hint: 'Type 24 in the subnet mask field.',
        done: 'Laptop-1 now lives in 192.168.1.0/24.',
      },
      {
        title: 'Now do Laptop-2',
        body: 'Select Laptop-2, then give it 192.168.1.12 with mask 24. Same subnet as Laptop-1, different host number.',
        target: 'tool-select',
        check: (ctx) => {
          const d = byName(ctx, 'Laptop-2');
          return !!d && d.ipMode === 'static' && d.staticIp === '192.168.1.12' && inSubnet('192.168.1.12', '192.168.1.0', 24) && !!d.staticMask && (d.staticMask.trim() === '24' || d.staticMask.trim() === '255.255.255.0');
        },
        hint: 'Select Laptop-2, keep it on Static, set IP 192.168.1.12 and mask 24.',
        done: 'Two hosts, hand-addressed, same subnet.',
      },
      {
        title: 'Ping to confirm',
        body: 'Pick the Ping tool and ping Laptop-1 to Laptop-2. Both are in 192.168.1.0/24, so this should just work.',
        target: 'tool-ping',
        check: (ctx, start) => ctx.pingCount > start.pingCount && ctx.lastPingOk,
        hint: 'Ping tool, click Laptop-1 then Laptop-2.',
        done: 'Clean reply. Your hand-typed addressing is correct.',
      },
      {
        title: 'Break it on purpose',
        body: 'Select Laptop-2 and change its IP to 10.0.0.12 (leave the mask at 24). Then ping Laptop-1 to Laptop-2 again. It will fail, and the event log will tell you exactly why.',
        target: 'tool-select',
        check: (ctx, start) => {
          const d = byName(ctx, 'Laptop-2');
          return !!d && d.staticIp === '10.0.0.12' && ctx.pingCount > start.pingCount && !ctx.lastPingOk;
        },
        hint: 'Set Laptop-2 to 10.0.0.12, then ping Laptop-1 to Laptop-2 and read the failure.',
        done: 'Same wire, two different subnets. Neither host thinks the other is local, so the frame goes nowhere.',
      },
      {
        title: 'Fix it',
        body: 'Put Laptop-2 back to 192.168.1.12 and ping once more. Watch it recover. This is exactly how a mis-typed IP looks on a real network, and how you spot it.',
        target: 'static-ip',
        check: (ctx, start) => {
          const d = byName(ctx, 'Laptop-2');
          return !!d && d.staticIp === '192.168.1.12' && ctx.pingCount > start.pingCount && ctx.lastPingOk;
        },
        hint: 'Set Laptop-2 back to 192.168.1.12 and ping Laptop-1 to Laptop-2.',
        done: 'Recovered. You just diagnosed and fixed a subnet-mismatch fault.',
      },
      {
        title: 'You configured a network by hand',
        body: 'IP plus mask decides who is local. Wrong mask or wrong subnet means traffic silently misfires. That single idea is most of the Network Troubleshooting domain. Next up: carving one network into several subnets.',
      },
    ],
  },
];

export const missionById = (id: string): Mission | undefined => MISSIONS.find((m) => m.id === id);

// Used by the static-IP step checks; exported so a future subnet mission can
// reuse the same in-range test.
export { inSubnet };

// Convenience for the overlay's live address readout.
export function hostAddrLabel(d: Device | undefined, net: NetInfo): string {
  if (!d) return '';
  const eff = effectiveAddr(d, net);
  return eff ? `${eff.ip}/${eff.cidr}` : 'unaddressed';
}
