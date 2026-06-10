// Shared types + helpers for the study modes (Quiz, Flashcards, PBQ).
// Concept ids below match the Learn-mode demo ids in concepts.ts, so any card,
// question, or PBQ can deep-link a learner straight to the matching animation.

export type ConceptId =
  | 'ethernet'
  | 'mac'
  | 'switch'
  | 'ip'
  | 'dhcp'
  | 'subnet'
  | 'router'
  | 'gateway'
  | 'routes'
  | 'ospf'
  | 'bgp'
  | 'icmp'
  | 'tcp'
  | 'udp'
  | 'ports'
  | 'firewall'
  | 'tls'
  | 'vpn'
  | 'dns'
  | 'http'
  | 'loadbalancer';

export type DomainId = '1.0' | '2.0' | '3.0' | '4.0' | '5.0';

export interface DomainMeta {
  id: DomainId;
  name: string;
  weight: number; // exam weight %
  color: string;
}

// N10-009 domain weights (CompTIA, exam released June 2024).
export const DOMAINS: DomainMeta[] = [
  { id: '1.0', name: 'Networking Concepts', weight: 23, color: '#3b82f6' },
  { id: '2.0', name: 'Network Implementation', weight: 20, color: '#8b5cf6' },
  { id: '3.0', name: 'Network Operations', weight: 19, color: '#14b8a6' },
  { id: '4.0', name: 'Network Security', weight: 14, color: '#fb923c' },
  { id: '5.0', name: 'Network Troubleshooting', weight: 24, color: '#f472b6' },
];

export const domainName = (id: DomainId): string => DOMAINS.find((d) => d.id === id)?.name ?? id;
export const domainColor = (id: DomainId): string => DOMAINS.find((d) => d.id === id)?.color ?? '#3b82f6';

// ---------- IPv4 / subnet math ----------

const ipToInt = (ip: string): number =>
  ip.split('.').reduce((acc, oct) => (acc << 8) + (parseInt(oct, 10) & 255), 0) >>> 0;

const intToIp = (n: number): string =>
  [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

export interface SubnetFacts {
  mask: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hostCount: number; // usable hosts
  cidr: number;
}

export type SubnetField = 'mask' | 'network' | 'broadcast' | 'firstHost' | 'lastHost' | 'hostCount';

export function subnetFacts(ip: string, cidr: number): SubnetFacts {
  const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const ipInt = ipToInt(ip);
  const network = (ipInt & maskInt) >>> 0;
  const broadcast = (network | (~maskInt >>> 0)) >>> 0;
  const hostBits = 32 - cidr;
  const usable = hostBits >= 2 ? Math.pow(2, hostBits) - 2 : 0;
  return {
    cidr,
    mask: intToIp(maskInt),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: usable > 0 ? intToIp((network + 1) >>> 0) : '—',
    lastHost: usable > 0 ? intToIp((broadcast - 1) >>> 0) : '—',
    hostCount: usable,
  };
}

// Loose compare so "192.168.1.0 " or extra spaces still match.
export const sameIp = (a: string, b: string): boolean => a.trim() === b.trim();
export const sameNum = (a: string, b: number): boolean => {
  const n = parseInt(a.replace(/[, ]/g, ''), 10);
  return !Number.isNaN(n) && n === b;
};

// CIDR → mask + usable host reference (for the subnet cheat card).
export const CIDR_TABLE: { cidr: number; mask: string; hosts: number }[] = [
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
].map((cidr) => {
  const f = subnetFacts('0.0.0.0', cidr);
  return { cidr, mask: f.mask, hosts: f.hostCount };
});
