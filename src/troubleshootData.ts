// Domain 5.0 (Network Troubleshooting, 24% of the exam) as data. The component
// renders it; the content test scans every string here for em dashes. Keep the
// human voice and straight quotes only.

export interface TshootStep {
  n: number;
  name: string;
  action: string; // what the step actually asks you to do
  applied: string; // the same step worked on one running example
  tip: string; // the thing the exam loves to test about this step
}

// CompTIA's official seven-step methodology, in order. The running example is a
// user who cannot reach the file server.
export const TSHOOT_STEPS: TshootStep[] = [
  {
    n: 1,
    name: 'Identify the problem',
    action: 'Gather information, question the user, and find out what changed. Reproduce the symptom if you can.',
    applied: 'Ask the user: which server, since when, anyone else affected? You learn it started after a switch was swapped this morning.',
    tip: 'Always ask what changed. A working setup that broke usually points straight at the last change.',
  },
  {
    n: 2,
    name: 'Establish a theory of probable cause',
    action: 'Question the obvious first. Pick an approach: top-to-bottom or bottom-to-top of the OSI model, or divide and conquer.',
    applied: 'Theory: the new switch left the port on the wrong VLAN, so the user has no path to the server subnet.',
    tip: 'When stuck, name your OSI approach out loud. Bottom-up (cable first) is the safe default for a single host.',
  },
  {
    n: 3,
    name: 'Test the theory to determine the cause',
    action: 'Prove or kill the theory. If it holds, plan the fix. If it does not, form a new theory or escalate.',
    applied: 'Check the switch port config. It is on VLAN 20, not VLAN 10 where the server lives. Theory confirmed.',
    tip: 'A confirmed theory moves you forward. A failed test sends you back to step two, not straight to a fix.',
  },
  {
    n: 4,
    name: 'Establish a plan of action',
    action: 'Decide what you will do, and call out side effects before you touch anything.',
    applied: 'Plan: move the port back to VLAN 10. Side effect: the port drops for a second when it re-tags.',
    tip: 'Identify potential effects here. The exam wants you to think about blast radius before you act.',
  },
  {
    n: 5,
    name: 'Implement the solution or escalate',
    action: 'Apply the fix, or hand it to someone with the access or authority you lack.',
    applied: 'You change the port to VLAN 10. If you had no switch access, you would escalate to the network team instead.',
    tip: 'Escalating is a valid answer. Knowing when you are out of scope is part of the methodology.',
  },
  {
    n: 6,
    name: 'Verify full system functionality',
    action: 'Confirm the original problem is gone, then add prevention if it makes sense.',
    applied: 'The user pings the server and opens a file. It works. You note the switch template so the next swap keeps VLAN 10.',
    tip: 'Verify with the user, not just yourself. Add a preventive measure when the same gap could bite again.',
  },
  {
    n: 7,
    name: 'Document findings, actions, and outcomes',
    action: 'Write down what was wrong, what you did, and how it turned out so the next person is faster.',
    applied: 'Log it: wrong VLAN after switch swap, port moved to VLAN 10, file access restored. Link the change ticket.',
    tip: 'Documentation is the last step every time. Skipping it is the classic wrong answer on the exam.',
  },
];

export type ToolVisual = 'trace' | 'arp' | null;

export interface CliTool {
  id: string;
  name: string; // tool, with the common alias
  cmd: string; // an example invocation
  proves: string; // the question it answers
  sample: string; // a short, realistic line of output
  layer: string; // the OSI layer or job it speaks to
  visual: ToolVisual; // links to a live visual below, when there is one
}

export const CLI_TOOLS: CliTool[] = [
  {
    id: 'ping',
    name: 'ping',
    cmd: 'ping 10.0.10.5',
    proves: 'Is the host reachable, and how fast?',
    sample: 'Reply from 10.0.10.5: time=2ms  (or "Request timed out")',
    layer: 'Layer 3 reachability (ICMP)',
    visual: null,
  },
  {
    id: 'ipconfig',
    name: 'ipconfig / ip / ifconfig',
    cmd: 'ipconfig /all',
    proves: 'What is my own IP, mask, and gateway? Did DHCP work?',
    sample: 'IPv4 169.254.7.12  ->  APIPA, the DHCP server never answered',
    layer: 'Your local Layer 3 config',
    visual: null,
  },
  {
    id: 'nslookup',
    name: 'nslookup / dig',
    cmd: 'nslookup files.corp.local',
    proves: 'Is DNS resolving the name to an address?',
    sample: 'Name: files.corp.local  Address: 10.0.10.5  (or "cannot find")',
    layer: 'Name resolution (DNS)',
    visual: null,
  },
  {
    id: 'traceroute',
    name: 'traceroute / tracert',
    cmd: 'traceroute 10.0.10.5',
    proves: 'Where along the path does it break?',
    sample: '4  198.51.100.20  22ms   then  5  * * *  request timed out',
    layer: 'Layer 3 path, hop by hop',
    visual: 'trace',
  },
  {
    id: 'arp',
    name: 'arp',
    cmd: 'arp -a',
    proves: 'Which MAC is mapped to this IP on my segment?',
    sample: '192.168.1.1  00-1a-2b-3c-4d-5e  dynamic',
    layer: 'Layer 2 to Layer 3 mapping',
    visual: 'arp',
  },
  {
    id: 'netstat',
    name: 'netstat / ss',
    cmd: 'netstat -an',
    proves: 'What ports are listening, and who am I connected to?',
    sample: 'TCP 0.0.0.0:445  LISTENING   ->  SMB file sharing is up',
    layer: 'Layer 4 sockets and ports',
    visual: null,
  },
  {
    id: 'nmap',
    name: 'nmap',
    cmd: 'nmap 10.0.10.5',
    proves: 'Which ports and services are open on that host?',
    sample: '445/tcp open  microsoft-ds   22/tcp closed',
    layer: 'Layer 4 service discovery',
    visual: null,
  },
  {
    id: 'tcpdump',
    name: 'tcpdump / Wireshark',
    cmd: 'tcpdump -i eth0 host 10.0.10.5',
    proves: 'What is actually on the wire, packet by packet?',
    sample: 'IP you.49512 > 10.0.10.5.445: Flags [S]  ->  SYN sent, no reply',
    layer: 'Every layer, raw capture',
    visual: null,
  },
];

export interface TraceHop {
  n: number;
  host: string;
  ip: string;
  rtt: number | null; // milliseconds, or null for a timeout
  note: string;
}

// A traceroute that answers for the first few hops, then goes dark. The last
// hop that replied is your last known-good point on the path.
export const TRACE_HOPS: TraceHop[] = [
  { n: 1, host: 'your gateway', ip: '192.168.1.1', rtt: 1, note: 'Your default gateway. Local network is fine.' },
  { n: 2, host: 'isp edge', ip: '10.0.0.1', rtt: 8, note: 'First ISP router. You left the building.' },
  { n: 3, host: 'isp core', ip: '203.0.113.9', rtt: 15, note: 'Deeper into the provider network.' },
  { n: 4, host: 'peering point', ip: '198.51.100.20', rtt: 23, note: 'Last hop that answers. Your known-good edge.' },
  { n: 5, host: 'no reply', ip: '* * *', rtt: null, note: 'Request timed out. The path breaks past hop 4.' },
  { n: 6, host: 'no reply', ip: '* * *', rtt: null, note: 'Still dark. The fault is upstream, not on your LAN.' },
];

export const TRACE_VERDICT =
  'Hops 1 through 4 answer, then it goes quiet. The break is past the peering point at 198.51.100.20, upstream and out of your hands. Your own gateway and ISP path are healthy, so this is one to report, not one to fix locally.';

export type ArpState = 'dynamic' | 'static' | 'incomplete';

export interface ArpRow {
  ip: string;
  mac: string;
  state: ArpState;
  note: string;
}

export const ARP_ROWS: ArpRow[] = [
  { ip: '192.168.1.1', mac: '00-1a-2b-3c-4d-5e', state: 'dynamic', note: 'Your default gateway, learned from a live reply.' },
  { ip: '192.168.1.10', mac: '00-1a-2b-3c-4d-60', state: 'dynamic', note: 'A neighbor on your subnet that you have talked to.' },
  { ip: '192.168.1.20', mac: '(incomplete)', state: 'incomplete', note: 'No ARP reply came back. The host is off, or you are on the wrong subnet.' },
  { ip: '192.168.1.255', mac: 'ff-ff-ff-ff-ff-ff', state: 'static', note: 'The broadcast address. Always all ones at Layer 2.' },
];

export const ARP_NOTE =
  'arp -a lists the IP-to-MAC pairs your machine has learned on the local segment. A dynamic entry means you got a reply. An incomplete entry means you asked and heard nothing, which is a strong hint the target is down or off-subnet.';
