import type { Device, Link, NetInfo, Tool } from './model';
import { effectiveAddr, findPath, ipToInt, planPing, randMac, uid } from './model';

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

// A scripted packet animation for protocol missions (SYN, ACK, FIN, …). Devices
// are referenced by name so a mission never needs to know generated ids.
export interface FlightSpec {
  from: string;
  to: string;
  label?: string;
  color?: string;
  delay?: number;
}

export interface MissionApi {
  reset: (devices?: Device[], links?: Link[]) => void;
  setTool: (t: Tool) => void;
  setTab: (t: 'build' | 'learn') => void;
  select: (id: string | null) => void;
  flight: (specs: FlightSpec[]) => void;
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
  // Teach cards center by default; 'bottom' docks them low so a canvas
  // animation stays visible above the card.
  place?: 'center' | 'bottom';
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  domain: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
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

// Reachability by cabling (works for switches too, which have no IP to ping).
const connected = (ctx: MissionCtx, aName: string, bName: string): boolean => {
  const a = byName(ctx, aName);
  const b = byName(ctx, bName);
  return !!a && !!b && !!findPath(a.id, b.id, ctx.links);
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

// A client and a web server across a switch, spread wide so packet animations
// have room to travel: the stage for the TCP handshake mission.
function tcpSeed(): { devices: Device[]; links: Link[] } {
  const client = dev('laptop', 'Client', 220, 300);
  const sw = dev('switch', 'Switch-1', 600, 300);
  const server = dev('server', 'Web-Server', 980, 300);
  return {
    devices: [client, sw, server],
    links: [
      { id: uid(), a: client.id, b: sw.id },
      { id: uid(), a: sw.id, b: server.id },
    ],
  };
}

const FLY_BLUE = '#60a5fa';
const FLY_GREEN = '#34d399';
const FLY_ORANGE = '#fb923c';

// ---------- missions ----------

export const MISSIONS: Mission[] = [
  {
    id: 'first-network',
    title: 'Build your first network',
    subtitle: 'Place a switch, add two hosts, cable them, and prove they can talk.',
    domain: '1.0 Networking Concepts',
    category: 'Fundamentals',
    level: 'Beginner',
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
    category: 'Fundamentals',
    level: 'Beginner',
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
  {
    id: 'subnet-mask',
    title: 'Reading the subnet mask',
    subtitle: 'See how the mask, not the cable, decides which devices share a subnet.',
    domain: '1.0 Networking Concepts',
    category: 'Subnetting',
    level: 'Intermediate',
    minutes: 7,
    steps: [
      {
        title: 'The mask draws a line',
        body: `Every IP has two parts: the network (the street) and the host (the house number). The subnet mask decides where that line falls. A /24 means the first three numbers are the street and the last is the house, so 254 houses share one street.`,
        setup: (api) => {
          const s = staticSeed();
          api.reset(s.devices, s.links);
          api.setTab('build');
          api.setTool('select');
          api.select(null);
        },
      },
      {
        title: 'Address the first host',
        body: `Select Laptop-1 with the Select tool, then set its IP to 192.168.1.50 with mask 24.`,
        target: 'tool-select',
        check: (ctx) => {
          const d = byName(ctx, 'Laptop-1');
          return !!d && d.staticIp === '192.168.1.50' && !!d.staticMask && (d.staticMask.trim() === '24' || d.staticMask.trim() === '255.255.255.0');
        },
        hint: 'Select Laptop-1, keep it Static, IP 192.168.1.50, mask 24.',
        done: `Laptop-1 is in 192.168.1.0/24.`,
      },
      {
        title: 'Address the second host',
        body: `Now Laptop-2: set it to 192.168.1.70 with mask 24. Both sit in 192.168.1.0/24, so they share a street.`,
        target: 'tool-select',
        check: (ctx) => {
          const d = byName(ctx, 'Laptop-2');
          return !!d && d.staticIp === '192.168.1.70' && !!d.staticMask && (d.staticMask.trim() === '24' || d.staticMask.trim() === '255.255.255.0');
        },
        hint: 'Select Laptop-2, IP 192.168.1.70, mask 24.',
        done: `Both hosts share 192.168.1.0/24.`,
      },
      {
        title: 'They can talk',
        body: `Ping Laptop-1 to Laptop-2. Same subnet, so the frame goes straight across with no router involved.`,
        target: 'tool-ping',
        check: (ctx, start) => ctx.pingCount > start.pingCount && ctx.lastPingOk,
        hint: 'Ping tool, Laptop-1 then Laptop-2.',
        done: `Same street, direct delivery.`,
      },
      {
        title: 'Now tighten the mask',
        body: `Change BOTH laptops to mask 26 (255.255.255.192). A /26 chops the old street into four blocks of 64: .0 to .63, .64 to .127, and so on. Watch what that does to .50 and .70.`,
        target: 'tool-select',
        check: (ctx) => {
          const ok = (d: Device | undefined) => !!d && !!d.staticMask && (d.staticMask.trim() === '26' || d.staticMask.trim() === '255.255.255.192');
          return ok(byName(ctx, 'Laptop-1')) && ok(byName(ctx, 'Laptop-2'));
        },
        hint: 'Select each laptop and set its mask to 26.',
        done: `.50 now lives in 192.168.1.0/26; .70 lives in 192.168.1.64/26. Different subnets.`,
      },
      {
        title: 'Same wire, different subnets',
        body: `Ping Laptop-1 to Laptop-2 again. It fails, even though nothing moved and the cable never changed. The smaller mask split them into two subnets, and a host won't deliver straight to an address it thinks lives on another network.`,
        target: 'tool-ping',
        check: (ctx, start) => ctx.pingCount > start.pingCount && !ctx.lastPingOk,
        hint: 'Ping Laptop-1 to Laptop-2 and read why it fails.',
        done: `The mask, not the cable, defines the subnet. That's the whole game.`,
      },
      {
        title: 'Subnetting in one breath',
        body: `Borrowing host bits (a bigger /number) makes more, smaller subnets with fewer hosts each. /24 holds 254 hosts, /25 holds 126, /26 holds 62, /27 holds 30. You're trading hosts-per-subnet for number-of-subnets. That's all subnetting really is.`,
      },
    ],
  },
  {
    id: 'topologies',
    title: 'Topologies and redundancy',
    subtitle: 'Build a star, find its weak point, then add a backup path toward a mesh.',
    domain: '1.0 Networking Concepts',
    category: 'Topology & Routing',
    level: 'Intermediate',
    minutes: 6,
    steps: [
      {
        title: 'Topology is the shape',
        body: `A topology is how your devices are wired together. The everyday winner is the star: every device cabled to one central switch, like spokes on a bike wheel. Let's build one.`,
        setup: (api) => {
          api.reset([], []);
          api.setTab('build');
          api.setTool('select');
        },
      },
      {
        title: 'Drop the center',
        body: `Place one switch. It's the hub every spoke will plug into.`,
        target: 'device-switch',
        check: (ctx) => countType(ctx, 'switch') >= 1,
        hint: 'Switch tool, click the canvas.',
        done: `There's your hub.`,
      },
      {
        title: 'Add three hosts',
        body: `Place three laptops around the switch. These are the spokes of the star.`,
        target: 'device-laptop',
        check: (ctx) => countType(ctx, 'laptop') >= 3,
        hint: 'Laptop tool, click three empty spots.',
        done: `Three spokes, no cables yet.`,
      },
      {
        title: 'Wire the star',
        body: `Cable all three laptops to the switch. Once every host can reach every other host through that one hub, you've got a star.`,
        target: 'tool-cable',
        check: (ctx) => connected(ctx, 'Laptop-1', 'Laptop-2') && connected(ctx, 'Laptop-1', 'Laptop-3'),
        hint: 'Cable tool: click each laptop, then the switch. Three cables total.',
        done: `A working star. Every device is one hop from the hub.`,
      },
      {
        title: 'The star has a weak spot',
        body: `Here's the catch: if that center switch dies, the whole network goes with it. It's a single point of failure. Bigger networks fix this by adding more switches and extra links, edging toward a mesh.`,
      },
      {
        title: 'Add a second switch',
        body: `Place a second switch and cable it to the first. Now there's another path through the core and room to grow redundancy.`,
        target: 'device-switch',
        check: (ctx) => countType(ctx, 'switch') >= 2 && connected(ctx, 'Switch-1', 'Switch-2'),
        hint: 'Place a second switch, then use the Cable tool to link Switch-1 and Switch-2.',
        done: `Two switches, linked. That's the start of a redundant core.`,
      },
      {
        title: 'Know the family',
        body: `For the exam: BUS is one shared cable (old, one break kills it), RING wires each device to two neighbors and passes a token, STAR is today's default, and MESH cross-links everything for maximum redundancy (think WAN cores). More links means more resilience and more cost.`,
      },
      {
        title: 'One catch: loops',
        body: `Cross-linking switches can create a loop where frames circle forever. Switches run Spanning Tree Protocol (STP) to spot loops and quietly block the backup link until it's actually needed. Redundancy without the meltdown.`,
      },
    ],
  },
  {
    id: 'routing',
    title: 'Routing between two subnets',
    subtitle: 'A switch stays in one subnet. Add a router to move traffic between two.',
    domain: '1.0 Networking Concepts',
    category: 'Topology & Routing',
    level: 'Intermediate',
    minutes: 6,
    steps: [
      {
        title: 'Switches stop at the subnet edge',
        body: `A switch only moves frames inside one subnet. The instant a packet needs a different network, you need a router. A router has a foot in each network and forwards between them, like a bridge between two neighborhoods.`,
        setup: (api) => {
          api.reset([], []);
          api.setTab('build');
          api.setTool('select');
        },
      },
      {
        title: 'Place two hosts',
        body: `Drop two laptops. Each one will end up on its own separate network.`,
        target: 'device-laptop',
        check: (ctx) => countType(ctx, 'laptop') >= 2,
        hint: 'Laptop tool, click twice.',
        done: `Two hosts, no network yet.`,
      },
      {
        title: 'Place a router',
        body: `Add a router between them. Unlike a switch, a router gets its own IP on every network it touches.`,
        target: 'device-router',
        check: (ctx) => countType(ctx, 'router') >= 1,
        hint: 'Router tool, click the canvas.',
        done: `The bridge is in place.`,
      },
      {
        title: 'Cable each host to the router',
        body: `Cable Laptop-1 to the router, then Laptop-2 to the router. Each laptop hangs off its own router port, so each becomes its own subnet.`,
        target: 'tool-cable',
        check: (ctx) => connected(ctx, 'Laptop-1', 'Router-1') && connected(ctx, 'Laptop-2', 'Router-1'),
        hint: 'Cable tool: Laptop-1 to the router, then Laptop-2 to the router.',
        done: `See the two colored bubbles: 192.168.1.0/24 and 192.168.2.0/24. Two subnets.`,
      },
      {
        title: 'Meet the default gateway',
        body: `The router owns .1 in each subnet. That .1 is each laptop's default gateway: the address it ships anything that isn't local. When Laptop-1 wants Laptop-2, it can't deliver directly, so it hands the packet to its gateway and lets the router sort it out.`,
      },
      {
        title: 'Route a packet across',
        body: `Ping Laptop-1 to Laptop-2 and follow the event log: it goes to the gateway, the router forwards it onto the other subnet, and the reply comes back. That's routing.`,
        target: 'tool-ping',
        check: (ctx, start) => ctx.pingCount > start.pingCount && ctx.lastPingOk,
        hint: 'Ping tool, Laptop-1 then Laptop-2.',
        done: `Cross-subnet delivery, courtesy of the router.`,
      },
      {
        title: 'Layer 2 vs Layer 3',
        body: `Switches forward by MAC address inside one subnet (Layer 2). Routers forward by IP address between subnets (Layer 3) and drop the TTL by one at each hop. Same packet, brand new frame on every leg of the trip.`,
      },
    ],
  },
  {
    id: 'tcp-handshake',
    title: 'The TCP three-way handshake',
    subtitle: 'Watch a client and server open a reliable connection, then tear it down.',
    domain: '1.0 Networking Concepts',
    category: 'Protocols',
    level: 'Advanced',
    minutes: 6,
    steps: [
      {
        title: 'Before any data, a handshake',
        body: `TCP is the reliable delivery service behind web pages, email, and file transfers. Before sending a single byte, the two sides shake hands: three messages that agree to talk and sync their counters. Here's a client and a web server. Watch the canvas.`,
        place: 'bottom',
        setup: (api) => {
          const s = tcpSeed();
          api.reset(s.devices, s.links);
          api.setTab('build');
          api.setTool('select');
          api.select(null);
        },
      },
      {
        title: '1. SYN',
        body: `The client sends a SYN, short for synchronize: "I want to talk, and my starting sequence number is X." It's knocking on the door.`,
        place: 'bottom',
        setup: (api) => api.flight([{ from: 'Client', to: 'Web-Server', label: 'SYN', color: FLY_BLUE }]),
      },
      {
        title: '2. SYN-ACK',
        body: `The server answers with SYN-ACK: it acknowledges the client's request AND sends its own SYN ("I'm ready too, my number is Y"). One packet doing two jobs.`,
        place: 'bottom',
        setup: (api) => api.flight([{ from: 'Web-Server', to: 'Client', label: 'SYN-ACK', color: FLY_GREEN }]),
      },
      {
        title: '3. ACK',
        body: `The client fires back a final ACK to confirm it got the server's number. Three messages and you're done. The connection is open and trusted by both ends.`,
        place: 'bottom',
        setup: (api) => api.flight([{ from: 'Client', to: 'Web-Server', label: 'ACK', color: FLY_BLUE }]),
      },
      {
        title: 'Now the data flows',
        body: `With the handshake complete, real data moves: the client sends its request (an HTTP GET) and the server streams back the reply. Every chunk gets acknowledged, so nothing goes missing silently. That reliability is why TCP carries the web.`,
        place: 'bottom',
        setup: (api) =>
          api.flight([
            { from: 'Client', to: 'Web-Server', label: 'HTTP GET', color: FLY_BLUE },
            { from: 'Web-Server', to: 'Client', label: '200 OK', color: FLY_GREEN, delay: 1 },
          ]),
      },
      {
        title: 'The four-way goodbye',
        body: `Closing takes four steps, not three. Each side sends a FIN ("I'm done sending") and gets an ACK back: client FIN, server ACK, server FIN, client ACK. That's why you'll hear "TCP setup is three-way, teardown is four-way."`,
        place: 'bottom',
        setup: (api) =>
          api.flight([
            { from: 'Client', to: 'Web-Server', label: 'FIN', color: FLY_ORANGE, delay: 0 },
            { from: 'Web-Server', to: 'Client', label: 'ACK', color: FLY_GREEN, delay: 0.9 },
            { from: 'Web-Server', to: 'Client', label: 'FIN', color: FLY_ORANGE, delay: 1.8 },
            { from: 'Client', to: 'Web-Server', label: 'ACK', color: FLY_GREEN, delay: 2.7 },
          ]),
      },
      {
        title: 'TCP vs UDP',
        body: `All this setup is what makes TCP reliable and ordered, but it costs a little time. UDP skips the handshake entirely: no connection, no guarantees, just fire packets and hope. That's why live video and games lean on UDP, while web and email lean on TCP.`,
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
