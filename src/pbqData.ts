import type { ConceptId, DomainId, SubnetField } from './study';

// Performance-Based Questions. Four formats that mirror the real Network+ PBQ
// styles: match (drag/select), categorize (sort into buckets), subnet
// (calculate addressing), and order (sequence steps). All graded deterministically
// in the browser, with per-item feedback and a generated insight on submit.

interface PbqBase {
  id: string;
  title: string;
  domain: DomainId;
  scenario: string;
  instruction: string;
  resources?: ConceptId[]; // demos to suggest after grading
  ai?: boolean; // true for PBQs generated at runtime by the AI button
}

export interface MatchPbq extends PbqBase {
  kind: 'match';
  options: string[];
  prompts: { id: string; text: string; correct: string; why: string }[];
}

export interface CategorizePbq extends PbqBase {
  kind: 'categorize';
  buckets: string[];
  items: { id: string; text: string; bucket: string; why: string }[];
}

export interface SubnetPbq extends PbqBase {
  kind: 'subnet';
  ip: string;
  cidr: number;
  fields: SubnetField[];
}

export interface OrderPbq extends PbqBase {
  kind: 'order';
  items: { id: string; text: string }[]; // stored in CORRECT order
}

export type Pbq = MatchPbq | CategorizePbq | SubnetPbq | OrderPbq;

export const PBQS: Pbq[] = [
  {
    id: 'pbq-ports',
    kind: 'match',
    title: 'Match the protocol to its port',
    domain: '1.0',
    scenario:
      'You are documenting firewall rules. For each protocol, select the standard port number it uses.',
    instruction: 'Pick the correct port for each protocol.',
    resources: ['ports', 'dns', 'http', 'tls'],
    options: ['21', '22', '25', '53', '80', '443', '3389', '161'],
    prompts: [
      { id: 'ssh', text: 'SSH (secure remote admin)', correct: '22', why: 'SSH is TCP 22: encrypted remote shell.' },
      { id: 'dns', text: 'DNS (name resolution)', correct: '53', why: 'DNS is port 53 (UDP for lookups).' },
      { id: 'http', text: 'HTTP (web, unencrypted)', correct: '80', why: 'HTTP is TCP 80.' },
      { id: 'https', text: 'HTTPS (web, encrypted)', correct: '443', why: 'HTTPS is TCP 443: HTTP over TLS.' },
      { id: 'rdp', text: 'RDP (remote desktop)', correct: '3389', why: 'RDP is TCP 3389.' },
      { id: 'smtp', text: 'SMTP (sending email)', correct: '25', why: 'SMTP is TCP 25.' },
    ],
  },
  {
    id: 'pbq-osi',
    kind: 'match',
    title: 'Map each item to its OSI layer',
    domain: '1.0',
    scenario:
      'A junior tech is learning the OSI model. Place each device or address at the layer where it operates.',
    instruction: 'Choose the OSI layer for each item.',
    resources: ['mac', 'ip', 'switch', 'router', 'tcp'],
    options: ['Layer 1: Physical', 'Layer 2: Data Link', 'Layer 3: Network', 'Layer 4: Transport'],
    prompts: [
      { id: 'switch', text: 'Switch', correct: 'Layer 2: Data Link', why: 'A switch forwards frames using MAC addresses. Layer 2.' },
      { id: 'router', text: 'Router', correct: 'Layer 3: Network', why: 'A router moves packets between networks using IP. Layer 3.' },
      { id: 'mac', text: 'MAC address', correct: 'Layer 2: Data Link', why: 'MAC addressing is a Layer 2 function.' },
      { id: 'ip', text: 'IP address', correct: 'Layer 3: Network', why: 'IP addressing and routing are Layer 3.' },
      { id: 'port', text: 'TCP/UDP port number', correct: 'Layer 4: Transport', why: 'Ports identify apps at Layer 4 (Transport).' },
      { id: 'cable', text: 'Ethernet cable / hub', correct: 'Layer 1: Physical', why: 'Cabling and hubs are raw bits. Layer 1.' },
    ],
  },
  {
    id: 'pbq-tcpudp',
    kind: 'categorize',
    title: 'Sort each protocol: TCP or UDP?',
    domain: '1.0',
    scenario:
      'You are tuning QoS rules and need to know which protocols ride on reliable TCP versus fast UDP.',
    instruction: 'Drag each protocol into TCP or UDP.',
    resources: ['tcp', 'udp'],
    buckets: ['TCP', 'UDP'],
    items: [
      { id: 'https', text: 'HTTPS (web)', bucket: 'TCP', why: 'Web needs every byte in order. TCP.' },
      { id: 'ssh', text: 'SSH', bucket: 'TCP', why: 'Remote shell needs reliable delivery. TCP.' },
      { id: 'ftp', text: 'FTP', bucket: 'TCP', why: 'File transfer must be complete and ordered. TCP.' },
      { id: 'voip', text: 'VoIP / live video', bucket: 'UDP', why: 'Real-time media drops late packets. UDP.' },
      { id: 'dns', text: 'DNS lookup', bucket: 'UDP', why: 'Quick request/response fits UDP (TCP for big/zone transfers).' },
      { id: 'dhcp', text: 'DHCP', bucket: 'UDP', why: 'DHCP broadcasts before it even has an IP. UDP.' },
    ],
  },
  {
    id: 'pbq-devlayer',
    kind: 'categorize',
    title: 'Classify each device by OSI layer',
    domain: '1.0',
    scenario: 'An audit asks you to label network gear by the OSI layer it primarily operates at.',
    instruction: 'Sort each device into its layer.',
    resources: ['switch', 'router', 'ethernet'],
    buckets: ['Layer 1', 'Layer 2', 'Layer 3'],
    items: [
      { id: 'hub', text: 'Hub', bucket: 'Layer 1', why: 'A hub just repeats bits to all ports. Layer 1.' },
      { id: 'repeater', text: 'Repeater', bucket: 'Layer 1', why: 'A repeater regenerates the raw signal. Layer 1.' },
      { id: 'switch', text: 'Switch', bucket: 'Layer 2', why: 'A switch forwards frames by MAC. Layer 2.' },
      { id: 'bridge', text: 'Bridge', bucket: 'Layer 2', why: 'A bridge joins segments at the MAC layer. Layer 2.' },
      { id: 'router', text: 'Router', bucket: 'Layer 3', why: 'A router forwards packets by IP. Layer 3.' },
    ],
  },
  {
    id: 'pbq-pubpriv',
    kind: 'categorize',
    title: 'Public or Private IP?',
    domain: '1.0',
    scenario:
      'Before configuring NAT, sort these addresses into public (internet-routable) and private (internal only).',
    instruction: 'Drag each address into Public or Private.',
    resources: ['ip', 'router', 'subnet'],
    buckets: ['Private', 'Public'],
    items: [
      { id: 'a', text: '10.4.9.20', bucket: 'Private', why: '10.0.0.0/8 is private.' },
      { id: 'b', text: '192.168.50.1', bucket: 'Private', why: '192.168.0.0/16 is private.' },
      { id: 'c', text: '172.20.5.5', bucket: 'Private', why: '172.16–172.31 is private; .20 is inside it.' },
      { id: 'd', text: '172.32.5.5', bucket: 'Public', why: 'Trap: private 172 range STOPS at 172.31. .32 is public.' },
      { id: 'e', text: '8.8.8.8', bucket: 'Public', why: 'Google DNS: public.' },
      { id: 'f', text: '203.0.113.10', bucket: 'Public', why: 'A normal public address.' },
    ],
  },
  {
    id: 'pbq-subnet-26',
    kind: 'subnet',
    title: 'Subnet the /26',
    domain: '1.0',
    scenario:
      'A host is configured as 192.168.10.50 /26. Calculate the addressing facts for its subnet.',
    instruction: 'Fill in each value for the subnet that 192.168.10.50 /26 belongs to.',
    resources: ['subnet', 'ip'],
    ip: '192.168.10.50',
    cidr: 26,
    fields: ['network', 'broadcast', 'firstHost', 'lastHost', 'hostCount'],
  },
  {
    id: 'pbq-subnet-28',
    kind: 'subnet',
    title: 'Subnet the /28',
    domain: '1.0',
    scenario: 'You are carving a /24 into smaller /28 subnets. Work out the facts for 10.20.30.200 /28.',
    instruction: 'Fill in each value for the subnet that 10.20.30.200 /28 belongs to.',
    resources: ['subnet'],
    ip: '10.20.30.200',
    cidr: 28,
    fields: ['mask', 'network', 'broadcast', 'hostCount'],
  },
  {
    id: 'pbq-troubleshoot',
    kind: 'order',
    title: 'Order the troubleshooting steps',
    domain: '5.0',
    scenario:
      'A user reports they cannot reach a file server. Put CompTIA’s troubleshooting methodology in the correct order.',
    instruction: 'Drag the steps into the official order (top = first).',
    resources: [],
    items: [
      { id: 's1', text: 'Identify the problem (gather info, ask what changed)' },
      { id: 's2', text: 'Establish a theory of probable cause' },
      { id: 's3', text: 'Test the theory to determine the cause' },
      { id: 's4', text: 'Establish a plan of action' },
      { id: 's5', text: 'Implement the solution (or escalate)' },
      { id: 's6', text: 'Verify full system functionality' },
      { id: 's7', text: 'Document findings, actions, and outcomes' },
    ],
  },
  {
    id: 'pbq-dora',
    kind: 'order',
    title: 'Order the DHCP handshake',
    domain: '1.0',
    scenario: 'A new laptop joins the network and needs an IP. Put the DHCP exchange in order.',
    instruction: 'Drag the DHCP steps into order (top = first).',
    resources: ['dhcp'],
    items: [
      { id: 'd1', text: 'Discover: client broadcasts "is there a DHCP server?"' },
      { id: 'd2', text: 'Offer: server offers an available address/lease' },
      { id: 'd3', text: 'Request: client requests the offered address' },
      { id: 'd4', text: 'Acknowledge: server confirms the lease' },
    ],
  },
];
