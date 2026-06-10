import type { DeviceType } from './model';

// The 21-concept chain from Tech With Diego's "Every Networking Concept
// Explained": each concept exists because the previous one created a problem.
// Demos are scripted step sequences played over a fixed topology; hands-on
// loads the same topology into the sandbox with a task.

export interface ConceptDevice {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  blockIcmp?: boolean;
}

export interface ConceptTopology {
  devices: ConceptDevice[];
  links: [string, string][];
}

// An on-canvas callout that points at a device while a step plays, so the
// explanation shows up on the diagram instead of only in the side text.
export interface DemoNote {
  at: string; // device id to anchor the callout to
  text: string;
  color?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export type DemoStep =
  | { kind: 'say'; text: string }
  | {
      kind: 'flight';
      from: string;
      to: string;
      label?: string;
      color?: string;
      say?: string;
      stopAt?: string;
      notes?: DemoNote[];
    }
  | {
      kind: 'flights';
      flights: { from: string; to: string; label?: string; color?: string }[];
      say?: string;
      notes?: DemoNote[];
    }
  | { kind: 'highlight'; ids: string[]; say: string; notes?: DemoNote[] }
  | { kind: 'note'; notes: DemoNote[]; say?: string }
  | { kind: 'set'; id: string; blockIcmp: boolean; say: string };

export interface Concept {
  id: string;
  title: string;
  problem: string;
  topology: ConceptTopology;
  steps: DemoStep[];
  tryIt: string;
}

const D = (id: string, type: DeviceType, name: string, x: number, y: number): ConceptDevice => ({
  id,
  type,
  name,
  x,
  y,
});

// Step colors (default amber comes from DemoFlight)
const GREEN = '#34d399';
const RED = '#f87171';
const BLUE = '#93c5fd';
const PURPLE = '#c4b5fd';

export const CONCEPTS: Concept[] = [
  {
    id: 'ethernet',
    title: 'Ethernet & Wi-Fi',
    problem: 'How does a device physically connect to anything?',
    topology: {
      devices: [D('a', 'pc', 'PC-1', 320, 320), D('b', 'pc', 'PC-2', 780, 320)],
      links: [['a', 'b']],
    },
    steps: [
      { kind: 'say', text: 'Two computers. One cable. This is Ethernet: the physical layer of almost every wired network on Earth.' },
      { kind: 'flight', from: 'a', to: 'b', label: 'frame', say: 'Data crosses the cable as electrical signals, grouped into chunks called frames.', notes: [{ at: 'a', text: 'Your NIC turns data into electrical signals', side: 'bottom' }, { at: 'b', text: 'Sent as chunks called frames', side: 'top' }] },
      { kind: 'say', text: 'Wi-Fi is the exact same idea with radio waves instead of copper. Same frames, no cable.' },
      { kind: 'highlight', ids: ['a', 'b'], say: 'Problem: the frame reached the wire… but who is it FOR? We need addressing. → MAC address' },
    ],
    tryIt: 'Place two PCs, cable them together, and ping one from the other. The simplest network that can exist.',
  },
  {
    id: 'mac',
    title: 'MAC address',
    problem: "Two devices are connected. How do they know who's who?",
    topology: {
      devices: [D('a', 'pc', 'PC-1', 320, 320), D('b', 'pc', 'PC-2', 780, 320)],
      links: [['a', 'b']],
    },
    steps: [
      { kind: 'highlight', ids: ['a'], say: 'Every network card is born with a unique hardware ID burned in at the factory: the MAC address. Something like A3:7F:0C:91:B4:E2.', notes: [{ at: 'a', text: 'MAC A3:7F:0C:91:B4:E2, burned in at the factory', side: 'top' }] },
      { kind: 'flight', from: 'a', to: 'b', label: 'To: B4:…:E2', say: 'Every frame carries a destination MAC and a source MAC. Like a sealed envelope with both addresses.', notes: [{ at: 'a', text: 'Source MAC (sender)', side: 'bottom' }, { at: 'b', text: 'Destination MAC (who it is for)', side: 'bottom' }] },
      { kind: 'say', text: 'MAC addresses only work inside the local network. They never survive a hop through a router. Remember that for later.' },
      { kind: 'say', text: 'Problem: this works for 2 devices. What about 10? 100? You cannot cable everything to everything. → Switch' },
    ],
    tryIt: 'Select any device and read its MAC address in the details panel. Every device here gets a unique one.',
  },
  {
    id: 'switch',
    title: 'Switch',
    problem: 'What if you need to connect 10 or 100 devices?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 180),
        D('l2', 'laptop', 'Laptop-2', 280, 460),
        D('pc', 'pc', 'PC-1', 540, 560),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('srv', 'server', 'Server-1', 840, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['l2', 'sw'],
        ['pc', 'sw'],
        ['srv', 'sw'],
      ],
    },
    steps: [
      { kind: 'highlight', ids: ['sw'], say: 'A switch is a box of network ports. Every device plugs into it, and the switch learns which MAC address lives on which port.', notes: [{ at: 'sw', text: 'Learns which MAC lives on which port', side: 'bottom' }] },
      { kind: 'flight', from: 'l1', to: 'srv', label: 'frame', say: 'Laptop-1 sends a frame for Server-1. The switch looks up the MAC table and forwards it out ONE port. Only the right one.', notes: [{ at: 'sw', text: 'MAC table lookup, forwards out ONE port', side: 'bottom' }] },
      { kind: 'say', text: "That MAC-table lookup is what makes a switch smarter than an old hub, which blasted every frame to everyone." },
      { kind: 'say', text: 'Problem: MAC addresses only work locally. How do you reach a device in ANOTHER network. Across the internet? → IP address' },
    ],
    tryIt: 'Add a fourth device, cable it to the switch, and ping it from Laptop-1. Watch the MAC-table narration in the log.',
  },
  {
    id: 'ip',
    title: 'IP address',
    problem: 'MAC only works locally: how do you reach devices on other networks?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 220, 240),
        D('l2', 'laptop', 'Laptop-2', 220, 420),
        D('sw1', 'switch', 'Switch-1', 400, 330),
        D('r1', 'router', 'Router-1', 600, 330),
        D('sw2', 'switch', 'Switch-2', 790, 330),
        D('srv', 'server', 'Server-1', 960, 330),
      ],
      links: [
        ['l1', 'sw1'],
        ['l2', 'sw1'],
        ['sw1', 'r1'],
        ['r1', 'sw2'],
        ['sw2', 'srv'],
      ],
    },
    steps: [
      { kind: 'say', text: 'An IP address is a LOGICAL address: 192.168.1.10. Unlike a MAC, it is not burned in. It depends on which network you join.' },
      { kind: 'highlight', ids: ['l1', 'srv'], say: 'Look at the glowing bubbles: two different networks, two different address ranges. The first part of an IP identifies the network, the rest identifies the device.', notes: [{ at: 'l1', text: 'Network A: 192.168.1.x', side: 'top' }, { at: 'srv', text: 'Network B: 10.0.0.x', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'srv', label: 'IP packet', say: 'IP packets can cross network boundaries. The MAC envelope is replaced at every router hop, but the IP packet inside survives end to end.', notes: [{ at: 'r1', text: 'MAC envelope swapped each hop; IP stays the same', side: 'bottom' }] },
      { kind: 'say', text: 'Problem: who hands out these IP addresses? Nobody types them by hand on 500 laptops. → DHCP' },
    ],
    tryIt: 'Click devices in the two different bubbles and compare their IPs. Same idea, different network prefix.',
  },
  {
    id: 'dhcp',
    title: 'DHCP',
    problem: 'How does your device get an IP without you typing it manually?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 300, 320),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('r1', 'router', 'Router-1', 820, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'r1'],
      ],
    },
    steps: [
      { kind: 'highlight', ids: ['l1'], say: 'A new device joins the network. It has a MAC address but NO IP yet. It cannot talk to anyone beyond the local wire.', notes: [{ at: 'l1', text: 'Has a MAC, but no IP yet', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'r1', label: 'DHCP Discover', color: BLUE, say: 'So it shouts to everyone: "Can anybody give me an IP address?" That is a DHCP Discover broadcast.', notes: [{ at: 'l1', text: '“Anyone got an IP for me?” broadcast', side: 'top' }] },
      { kind: 'flight', from: 'r1', to: 'l1', label: 'Offer: .10', color: GREEN, say: 'The DHCP server (usually the router at home) answers with a lease: your IP, the subnet mask, the default gateway, and a DNS server. Four settings, zero typing.', notes: [{ at: 'r1', text: 'Leases IP + mask + gateway + DNS', side: 'top' }] },
      { kind: 'say', text: 'In this lab, IPs appear automatically when you cable a device. Pretend DHCP did it. Problem: what defines the SIZE of the local network DHCP hands addresses for? → Subnet' },
    ],
    tryIt: 'Drop a new laptop, cable it to the switch, and watch it get an IP instantly. That is the DHCP moment.',
  },
  {
    id: 'subnet',
    title: 'Subnet',
    problem: 'How do you define the size of your local network?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 200),
        D('l2', 'laptop', 'Laptop-2', 280, 440),
        D('sw', 'switch', 'Switch-1', 520, 320),
        D('r1', 'router', 'Router-1', 780, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['l2', 'sw'],
        ['sw', 'r1'],
      ],
    },
    steps: [
      { kind: 'say', text: 'A subnet is the chunk of IP space that counts as "local". This bubble is 192.168.1.0/24: every address starting 192.168.1 belongs to it.' },
      { kind: 'say', text: 'The /24 is CIDR notation: the first 24 bits are the network part, the last 8 are for hosts. That leaves 254 usable addresses.' },
      { kind: 'highlight', ids: ['l1', 'l2'], say: 'Devices in the same subnet talk DIRECTLY. Frame to MAC, through the switch, done. No router involved.', notes: [{ at: 'sw', text: 'Same subnet, talk directly through the switch, no router', side: 'bottom' }] },
      { kind: 'say', text: 'Problem: what happens when the destination is OUTSIDE your subnet? Someone has to carry traffic out. → Router' },
    ],
    tryIt: 'Build two separate LANs (hosts + switch each): each gets its own /24 bubble automatically.',
  },
  {
    id: 'router',
    title: 'Router',
    problem: 'How does traffic leave your local network and reach the internet?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 220, 240),
        D('l2', 'laptop', 'Laptop-2', 220, 420),
        D('sw1', 'switch', 'Switch-1', 400, 330),
        D('r1', 'router', 'Router-1', 600, 330),
        D('sw2', 'switch', 'Switch-2', 790, 330),
        D('srv', 'server', 'Server-1', 960, 330),
      ],
      links: [
        ['l1', 'sw1'],
        ['l2', 'sw1'],
        ['sw1', 'r1'],
        ['r1', 'sw2'],
        ['sw2', 'srv'],
      ],
    },
    steps: [
      { kind: 'highlight', ids: ['r1'], say: 'The router stands with one foot in each network. See the overlapping bubbles? It owns an interface and an IP in both.', notes: [{ at: 'r1', text: 'One interface + IP in each network', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'srv', label: 'packet', say: 'A packet from the blue network to the purple one: the router strips the old frame, decrements TTL, wraps a new frame, and forwards. The IP packet inside never changes.', notes: [{ at: 'r1', text: 'Strips old frame, drops TTL, re-wraps, forwards', side: 'bottom' }] },
      { kind: 'say', text: 'Switches connect devices. Routers connect NETWORKS. That one sentence is half of Network+.' },
      { kind: 'say', text: 'Problem: your laptop might know several routers. Which one does it send to by default? → Default gateway' },
    ],
    tryIt: 'Use the Ping tool across the two bubbles and read the router hop in the event log.',
  },
  {
    id: 'gateway',
    title: 'Default gateway',
    problem: 'Your device has multiple ways out. Which router does it use?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 220, 240),
        D('l2', 'laptop', 'Laptop-2', 220, 420),
        D('sw1', 'switch', 'Switch-1', 400, 330),
        D('r1', 'router', 'Router-1', 600, 330),
        D('sw2', 'switch', 'Switch-2', 790, 330),
        D('srv', 'server', 'Server-1', 960, 330),
      ],
      links: [
        ['l1', 'sw1'],
        ['l2', 'sw1'],
        ['sw1', 'r1'],
        ['r1', 'sw2'],
        ['sw2', 'srv'],
      ],
    },
    steps: [
      { kind: 'say', text: 'Every time your device sends a packet it asks ONE question: is the destination inside my subnet?' },
      { kind: 'flight', from: 'l1', to: 'l2', label: 'local', color: GREEN, say: 'Inside the subnet → deliver directly. Frame to MAC, through the switch. The router never sees it.', notes: [{ at: 'l1', text: 'Destination in my subnet, deliver directly', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'r1', label: 'to gateway .1', say: 'Outside the subnet → hand it to the default gateway, the router IP your device was given by DHCP. Usually the .1 of your network.', notes: [{ at: 'r1', text: 'Default gateway: the .1 router DHCP gave me', side: 'top' }] },
      { kind: 'flight', from: 'r1', to: 'srv', label: 'forwarded', say: 'From there it is the router\'s problem. "Not local? Send it to the gateway" is the entire algorithm your laptop knows.' },
    ],
    tryIt: 'Select Laptop-1 and find its default gateway in the details panel. Then ping Server-1 and watch the gateway decision in the log.',
  },
  {
    id: 'routes',
    title: 'Routes & static routing',
    problem: 'How does the router know where to forward traffic?',
    topology: {
      devices: [
        D('h1', 'laptop', 'Laptop-1', 180, 320),
        D('r1', 'router', 'Router-1', 400, 320),
        D('r2', 'router', 'Router-2', 620, 320),
        D('r3', 'router', 'Router-3', 840, 320),
        D('h2', 'server', 'Server-1', 1040, 320),
      ],
      links: [
        ['h1', 'r1'],
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'h2'],
      ],
    },
    steps: [
      { kind: 'say', text: 'A router holds a routing table: a list of "to reach network X, send to router Y". Every packet is matched against that list.' },
      { kind: 'flight', from: 'h1', to: 'h2', label: 'hop by hop', say: 'Each router only knows the NEXT hop, not the whole journey: like passing a letter between post offices.' },
      { kind: 'say', text: 'Static routing means a human typed those table entries by hand. Fine for 3 routers. A nightmare for 300.' },
      { kind: 'say', text: 'Problem: networks change. Links die. Nobody can retype tables all day. Routers need to LEARN routes themselves. → OSPF' },
    ],
    tryIt: 'Build a chain of two routers between two LANs and ping end to end. Notice the 10.0.x.0/30 transit subnets between routers.',
  },
  {
    id: 'ospf',
    title: 'OSPF',
    problem: "Static routing doesn't scale: how do routers auto-discover paths?",
    topology: {
      devices: [
        D('h1', 'laptop', 'Laptop-1', 200, 460),
        D('r1', 'router', 'Router-1', 400, 460),
        D('r2', 'router', 'Router-2', 620, 180),
        D('r3', 'router', 'Router-3', 840, 460),
        D('h2', 'server', 'Server-1', 1040, 460),
      ],
      links: [
        ['h1', 'r1'],
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r1', 'r3'],
        ['r3', 'h2'],
      ],
    },
    steps: [
      {
        kind: 'flights',
        flights: [
          { from: 'r1', to: 'r2', label: 'LSA', color: PURPLE },
          { from: 'r2', to: 'r3', label: 'LSA', color: PURPLE },
          { from: 'r3', to: 'r1', label: 'LSA', color: PURPLE },
        ],
        say: 'OSPF routers advertise what they are connected to. Link-state advertisements. Every router ends up with a full map of the network.',
      },
      { kind: 'flight', from: 'h1', to: 'h2', label: 'shortest path', color: GREEN, say: 'Then each one runs "Open Shortest Path First" on that map and picks the best route. Here: straight across the bottom.' },
      { kind: 'say', text: 'If the bottom link dies, OSPF recalculates within seconds and traffic flows over the top through Router-2. No human involved.' },
      { kind: 'say', text: 'OSPF runs INSIDE one organization. Problem: how do DIFFERENT companies\' networks (entire ISPs) talk to each other? → BGP' },
    ],
    tryIt: 'Hands-on: delete the bottom Router-1↔Router-3 cable, ping Laptop-1 → Server-1 again, and watch the packet reroute over the top.',
  },
  {
    id: 'bgp',
    title: 'BGP',
    problem: "How do different companies' networks talk to each other?",
    topology: {
      devices: [
        D('h1', 'laptop', 'Laptop-1', 170, 320),
        D('r1', 'router', 'ISP-A', 390, 320),
        D('r2', 'router', 'ISP-B', 620, 320),
        D('r3', 'router', 'ISP-C', 850, 320),
        D('h2', 'server', 'Server-1', 1060, 320),
      ],
      links: [
        ['h1', 'r1'],
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'h2'],
      ],
    },
    steps: [
      { kind: 'say', text: 'The internet is not one network. It is ~80,000 independent networks (autonomous systems): ISPs, clouds, universities: that agree to exchange traffic.' },
      {
        kind: 'flights',
        flights: [
          { from: 'r3', to: 'r2', label: 'I can reach 192.168.2.0/24', color: PURPLE },
          { from: 'r2', to: 'r1', label: 'reach it via me', color: PURPLE },
        ],
        say: 'BGP is how they advertise: "I can reach this address range." The promise propagates from ISP to ISP.',
      },
      { kind: 'flight', from: 'h1', to: 'h2', label: 'data', say: 'Your packet then follows those promises hop by hop across companies. BGP is the protocol that makes "the internet" one thing.' },
      { kind: 'say', text: 'Problem: you built all this. Is the far end even alive? You need a test tool. → Ping (ICMP)' },
    ],
    tryIt: 'Rebuild the chain in the sandbox: two LANs joined through three routers, then ping end to end.',
  },
  {
    id: 'icmp',
    title: 'Ping & ICMP',
    problem: 'How do you test if a host is reachable?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 250, 320),
        D('sw', 'switch', 'Switch-1', 480, 320),
        D('r1', 'router', 'Router-1', 700, 320),
        D('srv', 'server', 'Server-1', 930, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'r1'],
        ['r1', 'srv'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'srv', label: 'echo request', say: 'Ping sends an ICMP echo request: "are you there?"', notes: [{ at: 'l1', text: '“Are you there?” ICMP echo request', side: 'top' }] },
      { kind: 'flight', from: 'srv', to: 'l1', label: 'echo reply', color: GREEN, say: 'A healthy host answers with an echo reply. The round-trip time is your latency.', notes: [{ at: 'srv', text: 'Echo reply, round-trip time = latency', side: 'top' }] },
      { kind: 'say', text: 'ICMP is the network\'s control channel: it is not TCP and not UDP. It also carries errors like "destination unreachable" and "TTL expired" (that one powers traceroute).' },
      { kind: 'say', text: 'Problem: ping proves the host is alive. But real data needs to arrive complete, in order, with no gaps. → TCP' },
    ],
    tryIt: 'Use the Ping tool on anything. That is literally this concept. Try pinging a switch and read why it fails.',
  },
  {
    id: 'tcp',
    title: 'TCP',
    problem: 'How do you guarantee every packet arrives, in order, without errors?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 320),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('srv', 'server', 'Server-1', 840, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'srv'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'srv', label: 'SYN', say: 'TCP starts every conversation with a handshake. Step 1: SYN: "I want to talk."', notes: [{ at: 'l1', text: '1) SYN: “I want to talk”', side: 'top' }] },
      { kind: 'flight', from: 'srv', to: 'l1', label: 'SYN-ACK', color: GREEN, say: 'Step 2: SYN-ACK: "Heard you, ready."', notes: [{ at: 'srv', text: '2) SYN-ACK: “Heard you, ready”', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'srv', label: 'ACK', say: 'Step 3: ACK: "Confirmed." Connection established. Three packets, every single time.', notes: [{ at: 'l1', text: '3) ACK: “Confirmed”, connection open', side: 'bottom' }] },
      { kind: 'say', text: 'From here every segment is numbered and acknowledged. Lost? Retransmitted. Out of order? Reassembled. Web pages, email, file transfers: anything that must be perfect rides TCP.' },
      { kind: 'say', text: 'Problem: all those receipts cost time. A video call would rather drop a frame than wait for one. → UDP' },
    ],
    tryIt: 'Ping the server and imagine every packet getting a numbered receipt. That is the TCP mindset.',
  },
  {
    id: 'udp',
    title: 'UDP',
    problem: "TCP is too slow for live traffic. What's the fast alternative?",
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 320),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('srv', 'server', 'Server-1', 840, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'srv'],
      ],
    },
    steps: [
      {
        kind: 'flights',
        flights: [
          { from: 'l1', to: 'srv', label: 'datagram' },
          { from: 'l1', to: 'srv', label: 'datagram' },
          { from: 'l1', to: 'srv', label: 'datagram' },
        ],
        say: 'UDP just sends. No handshake, no acknowledgments, no order, no retransmits. Fire and forget.',
        notes: [{ at: 'srv', text: 'No handshake, no receipts. A lost one is just gone', side: 'top' }],
      },
      { kind: 'say', text: 'A lost datagram is simply gone. And for live video, voice, and games that is CORRECT. A late frame is worse than a missing one.' },
      { kind: 'say', text: 'DNS also uses UDP: one tiny question, one tiny answer. A TCP handshake would triple the cost.' },
      { kind: 'say', text: 'Problem: your laptop runs TCP and UDP for dozens of apps at once. When a packet arrives… which app gets it? → Ports' },
    ],
    tryIt: 'Same topology as TCP on purpose. The difference is not the wiring, it is the rules of the conversation.',
  },
  {
    id: 'ports',
    title: 'Ports',
    problem: 'One device, many apps: how does traffic find the right one?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 320),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('srv', 'server', 'Server-1', 840, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'srv'],
      ],
    },
    steps: [
      { kind: 'say', text: 'The IP address gets a packet to the right building. The port number is the apartment door: which application inside.' },
      {
        kind: 'flights',
        flights: [
          { from: 'l1', to: 'srv', label: ':443', color: GREEN },
          { from: 'l1', to: 'srv', label: ':53', color: BLUE },
          { from: 'l1', to: 'srv', label: ':22', color: PURPLE },
        ],
        say: 'Same server, three doors: 443 → the web server, 53 → DNS, 22 → SSH. One machine, many services.',
        notes: [{ at: 'srv', text: '443 web · 53 DNS · 22 SSH, same IP, different doors', side: 'top' }],
      },
      { kind: 'say', text: 'Know the exam set: 22 SSH · 25 SMTP · 53 DNS · 67/68 DHCP · 80 HTTP · 443 HTTPS · 3389 RDP.' },
      { kind: 'say', text: 'Problem: every open door is a way in. Something must decide which doors are open and to whom. → Firewall' },
    ],
    tryIt: 'Ping the server, then picture the echo request knocking on a numbered door instead of the whole building.',
  },
  {
    id: 'firewall',
    title: 'Firewall',
    problem: 'What controls which traffic is allowed through?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 240, 320),
        D('sw', 'switch', 'Switch-1', 470, 320),
        D('fw', 'firewall', 'Firewall-1', 700, 320),
        D('srv', 'server', 'Server-1', 930, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'fw'],
        ['fw', 'srv'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'srv', label: 'ping', say: 'A firewall sits inline and inspects every packet against its rules. Right now ICMP is allowed. The ping passes.', notes: [{ at: 'fw', text: 'Inspects every packet against its rules', side: 'top' }] },
      { kind: 'set', id: 'fw', blockIcmp: true, say: 'Now the admin adds a rule: BLOCK ICMP.' },
      { kind: 'flight', from: 'l1', to: 'srv', label: 'ping', color: RED, stopAt: 'fw', say: 'Same ping, new rule: the firewall drops it. The sender just sees "request timed out". Firewalls do not apologize.', notes: [{ at: 'fw', text: 'Rule says BLOCK ICMP, dropped here', side: 'top' }] },
      { kind: 'say', text: 'Real rules match source, destination, port, and protocol. "Allow 443 in, deny everything else" is the classic default. Problem: allowed traffic can still be READ in transit. → TLS' },
    ],
    tryIt: 'Select Firewall-1, toggle "Block ICMP", and ping the server, then unblock it and ping again.',
  },
  {
    id: 'tls',
    title: 'TLS',
    problem: 'The connection works, but anyone in the middle can read it.',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 240, 320),
        D('sw', 'switch', 'Switch-1', 520, 320),
        D('hak', 'pc', 'Hacker-1', 520, 560),
        D('srv', 'server', 'Server-1', 820, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'srv'],
        ['hak', 'sw'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'srv', label: 'pass=hunter2', color: RED, say: 'Plain HTTP: your password crosses the network as readable text.' },
      { kind: 'highlight', ids: ['hak'], say: 'Anyone positioned on the path. Rogue Wi-Fi, tapped switch, compromised router, reads it straight off the wire.' },
      { kind: 'flight', from: 'l1', to: 'srv', label: '🔒 8f3a91…c2', color: GREEN, say: 'TLS encrypts the connection first: client and server agree on keys, then everything becomes ciphertext. Same eavesdropper now sees noise.' },
      { kind: 'say', text: 'The browser padlock = TLS. SSL is its retired ancestor. Same job, old name. Problem: TLS protects one connection. What about ALL traffic between two offices? → VPN' },
    ],
    tryIt: 'Recreate it: laptop, switch, server, plus a "hacker" PC hanging off the switch. Position is power.',
  },
  {
    id: 'vpn',
    title: 'VPN',
    problem: 'How do you protect your whole network path, not just one connection?',
    topology: {
      devices: [
        D('h1', 'laptop', 'Laptop-1', 180, 320),
        D('r1', 'router', 'Office-A', 400, 320),
        D('ri', 'router', 'Internet', 620, 320),
        D('r2', 'router', 'Office-B', 840, 320),
        D('h2', 'server', 'Server-1', 1050, 320),
      ],
      links: [
        ['h1', 'r1'],
        ['r1', 'ri'],
        ['ri', 'r2'],
        ['r2', 'h2'],
      ],
    },
    steps: [
      { kind: 'say', text: 'Two offices, public internet between them. Every packet crossing the middle is exposed infrastructure you do not own.' },
      { kind: 'flight', from: 'r1', to: 'r2', label: '🔒 tunnel', color: GREEN, say: 'A VPN builds an encrypted tunnel between the two routers. Packets are encrypted, wrapped inside new packets, and unwrapped on the far side.' },
      { kind: 'flight', from: 'h1', to: 'h2', label: '🔒 anything', color: GREEN, say: 'Now EVERYTHING between the sites rides the tunnel. Every app, every protocol. The two LANs behave like one private network. That is the V and the P.' },
      { kind: 'say', text: 'Your personal VPN does the same: an encrypted tunnel from your laptop to a provider, hiding traffic from the local network. Problem: we still type names, not IPs. → DNS' },
    ],
    tryIt: 'Build two LANs joined through a middle "Internet" router, then ping across and imagine the tunnel wrapping every hop in the middle.',
  },
  {
    id: 'dns',
    title: 'DNS',
    problem: 'Users type google.com: how does a name become an IP?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 240, 320),
        D('sw', 'switch', 'Switch-1', 500, 320),
        D('dns', 'server', 'DNS-1', 500, 120),
        D('web', 'server', 'Web-1', 800, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'dns'],
        ['sw', 'web'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'dns', label: 'A? google.com', color: BLUE, say: 'You type a name. Your device asks its DNS server (port 53): "what is the IP for google.com?"', notes: [{ at: 'dns', text: '“What is the IP for google.com?” (port 53)', side: 'bottom' }] },
      { kind: 'flight', from: 'dns', to: 'l1', label: '142.250.65.78', color: GREEN, say: 'DNS answers with the IP. The internet\'s phone book. Answers get cached so the next lookup is instant.', notes: [{ at: 'l1', text: 'Gets back 142.250.65.78, then caches it', side: 'top' }] },
      { kind: 'flight', from: 'l1', to: 'web', label: 'connect', say: 'Only NOW can the real connection start, using the returned IP. Every website visit begins with this invisible lookup.', notes: [{ at: 'web', text: 'Only now does the real connection start', side: 'top' }] },
      { kind: 'say', text: '"It\'s always DNS" is a sysadmin proverb: when the IP works but the name does not, you know the suspect. Problem: connected to the server… how do we actually ask for the page? → HTTP' },
    ],
    tryIt: 'Build it: a laptop, a switch, a DNS server, and a web server. Ping DNS-1 first, then Web-1. Query order matters.',
  },
  {
    id: 'http',
    title: 'HTTP & HTTPS',
    problem: 'DNS gave you the IP. How does the browser request the page?',
    topology: {
      devices: [
        D('l1', 'laptop', 'Laptop-1', 280, 320),
        D('sw', 'switch', 'Switch-1', 560, 320),
        D('srv', 'server', 'Web-1', 840, 320),
      ],
      links: [
        ['l1', 'sw'],
        ['sw', 'srv'],
      ],
    },
    steps: [
      { kind: 'flight', from: 'l1', to: 'srv', label: 'GET /index.html', say: 'HTTP is a request language. The browser asks: GET /index.html: "give me this page."' },
      { kind: 'flight', from: 'srv', to: 'l1', label: '200 OK', color: GREEN, say: 'The server answers with a status code and the content. 200 OK: here is your page. (404 = no such page; 500 = server fell over.)' },
      { kind: 'say', text: 'HTTPS is the same conversation tunneled through TLS. The padlock means the GET and the response were encrypted. Port 80 plain, port 443 encrypted.' },
      { kind: 'say', text: 'Problem: one popular server, a million browsers sending GETs. One machine cannot answer them all. → Load balancer' },
    ],
    tryIt: 'Ping Web-1 and narrate it to yourself as a GET: request out, response back, status code read.',
  },
  {
    id: 'loadbalancer',
    title: 'Load balancer',
    problem: "One server can't handle everyone: how do you distribute traffic?",
    topology: {
      devices: [
        D('l1', 'laptop', 'Client-1', 220, 320),
        D('lb', 'router', 'LB-1', 500, 320),
        D('s1', 'server', 'Web-1', 800, 140),
        D('s2', 'server', 'Web-2', 800, 320),
        D('s3', 'server', 'Web-3', 800, 500),
      ],
      links: [
        ['l1', 'lb'],
        ['lb', 's1'],
        ['lb', 's2'],
        ['lb', 's3'],
      ],
    },
    steps: [
      { kind: 'say', text: 'Clients never talk to the web servers directly. They all hit ONE front address. The load balancer.' },
      {
        kind: 'flights',
        flights: [
          { from: 'l1', to: 's1', label: 'req 1' },
          { from: 'l1', to: 's2', label: 'req 2', color: BLUE },
          { from: 'l1', to: 's3', label: 'req 3', color: PURPLE },
        ],
        say: 'The LB spreads requests across the pool. Round robin here, or by least connections, or by response time.',
      },
      { kind: 'say', text: 'It also health-checks the pool. If Web-2 dies, traffic silently flows to Web-1 and Web-3. Users notice nothing: that is high availability.' },
      { kind: 'say', text: 'And that completes the chain: a cable became Ethernet, became switching, routing, the internet, encryption, names, and finally scale. Every concept exists because the previous one hit a wall.' },
    ],
    tryIt: 'Build the fan-out yourself: one client, one "LB" router, three servers, then ping each server through it.',
  },
];

export const conceptById = (id: string): Concept | undefined => CONCEPTS.find((c) => c.id === id);
