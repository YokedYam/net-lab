import type { Device, Link, NetInfo, Tool } from './model';
import { effectiveAddr, findPath, ipToInt, planPing, randMac, uid } from './model';
import type { SeqActor, SeqMessage } from './components/SequenceDiagram';

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
  // For sequence-diagram missions: how many messages are revealed at this step.
  reveal?: number;
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
  // Present for protocol missions: renders a bright sequence diagram instead of
  // the build canvas, and each step's `reveal` controls how much is shown.
  diagram?: { actors: SeqActor[]; messages: SeqMessage[] };
  // Optional id of a PBQ that drills this same concept; surfaced as a
  // "Practice this" link at the end of the mission.
  pbq?: string;
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

// Sequence-diagram arrow colors.
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
    pbq: 'pbq-subnet-26',
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
    id: 'ports-protocols',
    pbq: 'pbq-ports',
    title: 'Ports and protocols',
    subtitle: 'The IP finds the host; the port finds the service. Learn the doors that matter.',
    domain: '1.0 Networking Concepts',
    category: 'Protocols',
    level: 'Intermediate',
    minutes: 6,
    diagram: {
      actors: [{ name: 'Client' }, { name: 'Server' }],
      messages: [
        { from: 0, to: 1, label: 'SSH  :22', sub: 'remote shell · TCP · encrypted', color: FLY_GREEN },
        { from: 0, to: 1, label: 'DNS  :53', sub: 'name lookup · TCP + UDP', color: FLY_BLUE },
        { from: 0, to: 1, label: 'HTTP  :80', sub: 'web · TCP · plaintext', color: FLY_ORANGE },
        { from: 0, to: 1, label: 'HTTPS  :443', sub: 'web · TCP · encrypted', color: FLY_GREEN },
        { from: 0, to: 1, label: 'SMTP  :25', sub: 'send mail · TCP', color: FLY_BLUE },
        { from: 0, to: 1, label: 'RDP  :3389', sub: 'remote desktop · TCP', color: FLY_BLUE },
      ],
    },
    steps: [
      {
        title: 'A port is a numbered door',
        body: `Every server runs many services at once. The IP address gets you to the right machine; the port number gets you to the right service on it, like an apartment number after the street address. Ports run from 0 to 65535.`,
        reveal: 0,
        setup: (api) => api.reset([], []),
      },
      {
        title: 'Remote access and names',
        body: `SSH on port 22 is your encrypted remote shell into a box. DNS on port 53 turns a name like example.com into an IP, and it's the oddball that uses BOTH TCP and UDP: UDP for quick lookups, TCP for large zone transfers.`,
        reveal: 2,
      },
      {
        title: 'The web pair',
        body: `HTTP on port 80 is web traffic in plaintext. HTTPS on port 443 is the same thing wrapped in TLS encryption. If a question stresses "secure," 443 beats 80 almost every time.`,
        reveal: 4,
      },
      {
        title: 'Mail and remote desktop',
        body: `SMTP on port 25 carries email between servers. RDP on port 3389 is Windows Remote Desktop. Memorize the number-to-service pairs cold: the exam tests them directly and inside scenarios.`,
        reveal: 6,
      },
      {
        title: 'Secure vs insecure twins',
        body: `A favorite exam move is pairing a plaintext protocol with its encrypted replacement. Telnet :23 becomes SSH :22. FTP :20/21 becomes SFTP :22 or FTPS :990. HTTP :80 becomes HTTPS :443. LDAP :389 becomes LDAPS :636. When in doubt, pick the encrypted twin.`,
        reveal: 6,
      },
      {
        title: 'Well-known vs the rest',
        body: `Ports 0 to 1023 are the well-known ports (everything above). 1024 to 49151 are registered, and 49152 to 65535 are dynamic or ephemeral: the temporary port your client grabs as its return address. That ephemeral port is the source port in the TCP handshake mission.`,
        reveal: 6,
      },
    ],
  },
  {
    id: 'dhcp-dora',
    pbq: 'pbq-dora',
    title: 'DHCP: how a device gets an IP',
    subtitle: 'The four-step DORA exchange that hands out addresses automatically.',
    domain: '1.0 Networking Concepts',
    category: 'Protocols',
    level: 'Intermediate',
    minutes: 5,
    diagram: {
      actors: [{ name: 'New Client' }, { name: 'DHCP Server' }],
      messages: [
        { from: 0, to: 1, label: 'DISCOVER', sub: 'broadcast: anyone out there?', color: FLY_ORANGE },
        { from: 1, to: 0, label: 'OFFER', sub: 'how about 192.168.1.50?', color: FLY_GREEN },
        { from: 0, to: 1, label: 'REQUEST', sub: 'yes, I will take it', color: FLY_BLUE },
        { from: 1, to: 0, label: 'ACK', sub: 'it is yours, lease 24h', color: FLY_GREEN },
      ],
    },
    steps: [
      {
        title: 'No IP yet? Ask DHCP',
        body: `When a device joins a network it usually has no address at all. DHCP hands one out automatically in four steps. The memory hook is DORA: Discover, Offer, Request, Acknowledge.`,
        reveal: 0,
        setup: (api) => api.reset([], []),
      },
      {
        title: 'D is for Discover',
        body: `The client has no IP and no idea where the server is, so it shouts a broadcast: "Is there a DHCP server out there?" Everyone on the subnet hears it.`,
        reveal: 1,
      },
      {
        title: 'O is for Offer',
        body: `Any DHCP server that hears the discover replies with an offer: a candidate address (here 192.168.1.50) plus the mask, gateway, DNS servers, and lease time.`,
        reveal: 2,
      },
      {
        title: 'R is for Request',
        body: `The client formally requests that specific address. This step matters when two servers both offer: the client picks one and broadcasts its choice so the other server releases its reservation.`,
        reveal: 3,
      },
      {
        title: 'A is for Acknowledge',
        body: `The server locks in the lease and sends an ACK. The client now owns that address for the lease duration and starts using it. DORA complete.`,
        reveal: 4,
      },
      {
        title: 'The details that get tested',
        body: `DHCP uses UDP ports 67 (server) and 68 (client). The client tries to renew at 50 percent of the lease. And because Discover is a broadcast, and routers do not forward broadcasts, a device on a remote subnet needs a DHCP relay (an IP helper address) to reach the server.`,
        reveal: 4,
      },
    ],
  },
  {
    id: 'dns-resolution',
    title: 'DNS: turning a name into an IP',
    subtitle: 'Follow a lookup from your machine out to the authoritative server and back.',
    domain: '1.0 Networking Concepts',
    category: 'Protocols',
    level: 'Intermediate',
    minutes: 5,
    diagram: {
      actors: [{ name: 'Client' }, { name: 'Resolver' }, { name: 'Root / TLD' }, { name: 'Authoritative' }],
      messages: [
        { from: 0, to: 1, label: 'example.com?', sub: 'ask my resolver', color: FLY_BLUE },
        { from: 1, to: 2, label: 'example.com?', sub: 'where does .com live?', color: FLY_BLUE },
        { from: 2, to: 1, label: 'ask them', sub: 'name servers for the domain', color: FLY_ORANGE },
        { from: 1, to: 3, label: 'example.com?', sub: 'the real question', color: FLY_BLUE },
        { from: 3, to: 1, label: 'A 93.184.x.x', sub: 'the address', color: FLY_GREEN },
        { from: 1, to: 0, label: 'A 93.184.x.x', sub: 'cached for the TTL', color: FLY_GREEN },
      ],
    },
    steps: [
      {
        title: 'Names are for humans',
        body: `People remember example.com; machines need 93.184.x.x. DNS is the phone book that converts one to the other. Your client almost never does the legwork itself: it hands the job to a resolver.`,
        reveal: 0,
        setup: (api) => api.reset([], []),
      },
      {
        title: 'Ask the resolver',
        body: `The client asks its configured resolver (often the router, or a public one like 8.8.8.8) for example.com. This first hop is a recursive query: "get me the final answer, I will wait."`,
        reveal: 1,
      },
      {
        title: 'Walk down the tree',
        body: `If the resolver does not have it cached, it walks the hierarchy: it asks a root and TLD server who is responsible for the domain, and gets pointed at the right name servers. Those are iterative queries.`,
        reveal: 3,
      },
      {
        title: 'Hit the source',
        body: `The resolver asks the authoritative server, the one that actually holds the records for example.com, and gets back the A record with the IP address.`,
        reveal: 5,
      },
      {
        title: 'Answer and cache',
        body: `The resolver hands the address to your client and caches it for the record's TTL, so the next lookup is instant. DNS runs on port 53: UDP for these quick lookups, TCP for large zone transfers.`,
        reveal: 6,
      },
      {
        title: 'Record types to know',
        body: `A maps a name to an IPv4 address, AAAA to IPv6. CNAME is an alias to another name. MX points to mail servers. NS lists name servers. PTR does the reverse lookup (IP back to name). TXT holds text such as SPF and verification records.`,
        reveal: 6,
      },
    ],
  },
  {
    id: 'tcp-handshake',
    pbq: 'pbq-tcp-handshake',
    title: 'The TCP three-way handshake',
    subtitle: 'Watch a client and server open a reliable connection, then tear it down.',
    domain: '1.0 Networking Concepts',
    category: 'Protocols',
    level: 'Advanced',
    minutes: 6,
    diagram: {
      actors: [{ name: 'Client' }, { name: 'Web Server' }],
      messages: [
        { from: 0, to: 1, label: 'SYN', sub: 'seq = x', color: FLY_BLUE },
        { from: 1, to: 0, label: 'SYN, ACK', sub: 'seq = y, ack = x+1', color: FLY_GREEN },
        { from: 0, to: 1, label: 'ACK', sub: 'ack = y+1', color: FLY_BLUE },
        { from: 0, to: 1, label: 'HTTP GET', sub: 'port 443 (HTTPS)', color: FLY_BLUE },
        { from: 1, to: 0, label: '200 OK', sub: 'data + ACK', color: FLY_GREEN },
        { from: 0, to: 1, label: 'FIN', sub: 'I am done sending', color: FLY_ORANGE },
        { from: 1, to: 0, label: 'ACK', color: FLY_GREEN },
        { from: 1, to: 0, label: 'FIN', sub: 'me too', color: FLY_ORANGE },
        { from: 0, to: 1, label: 'ACK', sub: 'connection closed', color: FLY_GREEN },
      ],
    },
    steps: [
      {
        title: 'Before any data, a handshake',
        body: `TCP is the reliable delivery service behind web pages, email, and file transfers. Before sending a single byte, the two sides shake hands: three messages that agree to talk and sync their counters. Read this diagram top to bottom, like a conversation unfolding over time.`,
        reveal: 0,
        setup: (api) => api.reset([], []),
      },
      {
        title: '1. SYN',
        body: `The client sends a SYN, short for synchronize: "I want to talk, and my starting sequence number is X." It's knocking on the door.`,
        reveal: 1,
      },
      {
        title: '2. SYN, ACK',
        body: `The server answers with SYN-ACK, one packet doing two jobs: it acknowledges the client's request (ack = x+1) and sends its own SYN with sequence number Y.`,
        reveal: 2,
      },
      {
        title: '3. ACK',
        body: `The client sends a final ACK to confirm it got the server's number. Three messages, and the connection is open and trusted by both ends. That's the three-way handshake.`,
        reveal: 3,
      },
      {
        title: 'Now the data flows',
        body: `With the channel open, real data moves. Here the client sends an HTTP GET to port 443 (HTTPS) and the server streams back 200 OK. Every chunk gets acknowledged, so nothing is lost silently. That reliability is why TCP carries the web.`,
        reveal: 5,
      },
      {
        title: 'The four-way goodbye',
        body: `Closing takes four steps, not three. Each side sends its own FIN ("I'm done sending") and waits for an ACK back: client FIN, server ACK, server FIN, client ACK. That's the line to remember: setup is three-way, teardown is four-way.`,
        reveal: 9,
      },
      {
        title: 'TCP vs UDP',
        body: `All this setup is what makes TCP reliable and ordered, but it costs a little time. UDP skips the handshake entirely: no connection, no guarantees, just fire packets and hope. That's why live video, voice, and gaming lean on UDP, while web, email, and file transfer lean on TCP.`,
        reveal: 9,
      },
    ],
  },
  {
    id: 'tls-handshake',
    title: 'TLS: how HTTPS gets encrypted',
    subtitle: 'After TCP connects, TLS proves identity and sets up the encryption keys.',
    domain: '4.0 Network Security',
    category: 'Protocols',
    level: 'Advanced',
    minutes: 5,
    diagram: {
      actors: [{ name: 'Client' }, { name: 'Server' }],
      messages: [
        { from: 0, to: 1, label: 'ClientHello', sub: 'TLS versions + cipher suites', color: FLY_BLUE },
        { from: 1, to: 0, label: 'ServerHello', sub: 'chosen cipher', color: FLY_GREEN },
        { from: 1, to: 0, label: 'Certificate', sub: 'public key, signed by a CA', color: FLY_GREEN },
        { from: 0, to: 1, label: 'Key exchange', sub: 'agree on a shared secret', color: FLY_BLUE },
        { from: 0, to: 1, label: 'Finished', sub: 'encrypted from here on', color: FLY_GREEN },
        { from: 1, to: 0, label: 'Finished', sub: 'secure channel is up', color: FLY_GREEN },
      ],
    },
    steps: [
      {
        title: 'TCP connects, TLS secures',
        body: `The TCP handshake opened a connection, but anyone on the path could read it. TLS is the layer that turns plain HTTP into HTTPS: it proves who the server is and sets up encryption keys, all before the first real byte of web data.`,
        reveal: 0,
        setup: (api) => api.reset([], []),
      },
      {
        title: 'Hello, here is what I support',
        body: `The client sends a ClientHello listing the TLS versions and cipher suites it can use. The server replies with ServerHello, picking the strongest options both sides share.`,
        reveal: 2,
      },
      {
        title: 'Prove who you are',
        body: `The server sends its certificate, which contains its public key and is signed by a Certificate Authority (CA) the client already trusts. This is what stops an imposter: a fake server cannot produce a valid CA signature for that name.`,
        reveal: 3,
      },
      {
        title: 'Agree on a secret',
        body: `Using the server's public key (or modern Diffie-Hellman), both sides agree on a shared session key that no eavesdropper can derive. Public-key crypto sets it up; fast symmetric crypto does the bulk work.`,
        reveal: 4,
      },
      {
        title: 'Switch to encrypted',
        body: `Both sides send Finished and from this point everything is encrypted with the shared key. That is the padlock in your browser. HTTPS is just HTTP running inside this TLS tunnel on port 443.`,
        reveal: 6,
      },
      {
        title: 'What the exam wants',
        body: `TLS replaced the older, broken SSL (never use SSL). TLS 1.3 trimmed the handshake to one round trip, so it is faster. The same TLS wraps other protocols into their secure twins: FTPS, SMTPS, LDAPS. Encryption hides the data; the certificate proves identity. You need both.`,
        reveal: 6,
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
