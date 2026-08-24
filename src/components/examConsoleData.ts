// Data and engine for the Network Troubleshooting simulation PBQ.
//
// The point of this one is that nothing is scripted. The router holds a real
// access control list, every command the student types is evaluated against
// that live list, and the simulated browser succeeds or fails for the same
// reason it would on a real network. Delete the right rule and the site loads.

export type Access = 'Accept' | 'Deny';

export interface AclRule {
  id: number;
  src: string;
  dst: string;
  proto: 'ANY' | 'TCP' | 'UDP' | 'TCP/UDP' | 'ICMP';
  port: string;
  access: Access;
  note: string;
}

export interface Flow {
  src: string;
  dst: string;
  proto: 'TCP' | 'UDP' | 'ICMP';
  port: number | null;
}

// ---------------------------------------------------------------- IP helpers

export function ipToInt(ip: string): number {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return -1;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

export function isIp(s: string): boolean {
  return ipToInt(s) >= 0;
}

// True when ip falls inside a CIDR block, a plain address, or the ANY keyword.
export function inBlock(block: string, ip: string): boolean {
  if (block === 'ANY') return true;
  const target = ipToInt(ip);
  if (target < 0) return false;
  if (!block.includes('/')) return ipToInt(block) === target;
  const [net, bitsRaw] = block.split('/');
  const bits = Number(bitsRaw);
  const base = ipToInt(net);
  if (base < 0 || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0;
  return ((base & mask) >>> 0) === ((target & mask) >>> 0);
}

function protoMatches(rule: AclRule, flow: Flow): boolean {
  if (rule.proto === 'ANY') return true;
  if (rule.proto === 'ICMP') return flow.proto === 'ICMP';
  if (rule.proto === 'TCP/UDP') return flow.proto === 'TCP' || flow.proto === 'UDP';
  return rule.proto === flow.proto;
}

function portMatches(rule: AclRule, flow: Flow): boolean {
  if (rule.port === 'ANY') return true;
  if (flow.port === null) return false;
  return rule.port
    .split(',')
    .map((p) => Number(p.trim()))
    .includes(flow.port);
}

export interface AclVerdict {
  allowed: boolean;
  rule: AclRule | null;
}

// First match wins, read top down, exactly like a real ACL.
export function evaluate(acl: AclRule[], flow: Flow): AclVerdict {
  for (const rule of acl) {
    if (
      inBlock(rule.src, flow.src) &&
      inBlock(rule.dst, flow.dst) &&
      protoMatches(rule, flow) &&
      portMatches(rule, flow)
    ) {
      return { allowed: rule.access === 'Accept', rule };
    }
  }
  // Nothing matched, so the implicit deny at the end of every list applies.
  return { allowed: false, rule: null };
}

// ------------------------------------------------------------------ the case

export const FLOOR2 = '192.168.0.64/27';
export const DMZ = '192.168.0.32/27';

export const BASE_ACL: AclRule[] = [
  {
    id: 1,
    src: FLOOR2,
    dst: DMZ,
    proto: 'ANY',
    port: 'ANY',
    access: 'Accept',
    note: 'Executive Offices reach every service in the screened subnet. This is why internal email, the intranet and the print server all still work.',
  },
  {
    id: 2,
    src: FLOOR2,
    dst: 'ANY',
    proto: 'TCP/UDP',
    port: '22,3389',
    access: 'Deny',
    note: 'Blocks SSH and RDP leaving the office subnet. Remote admin out to the internet is not something a workstation should do.',
  },
  {
    id: 3,
    src: FLOOR2,
    dst: 'ANY',
    proto: 'TCP/UDP',
    port: '80,443',
    access: 'Deny',
    note: 'This is the rule that broke web browsing. It drops HTTP and HTTPS from the Executive Offices subnet to anywhere outside the screened subnet, which is exactly the reported symptom.',
  },
  {
    id: 4,
    src: 'ANY',
    dst: DMZ,
    proto: 'ICMP',
    port: 'ANY',
    access: 'Deny',
    note: 'Ping into the screened subnet is blocked on purpose so the public servers do not answer scans. It is hardening, not a fault, and it is why a timed out ping to a DMZ server does not mean that server is down.',
  },
  {
    id: 5,
    src: '192.168.0.80/28',
    dst: 'ANY',
    proto: 'ANY',
    port: 'ANY',
    access: 'Deny',
    note: 'Quarantines the guest range. Nothing in the scenario lives there, so removing it only widens the hole.',
  },
  {
    id: 6,
    src: DMZ,
    dst: 'ANY',
    proto: 'TCP/UDP',
    port: '22,3389',
    access: 'Deny',
    note: 'Stops a compromised DMZ server from opening admin sessions elsewhere. Standard screened subnet hygiene.',
  },
  {
    id: 7,
    src: FLOOR2,
    dst: 'ANY',
    proto: 'UDP',
    port: '161',
    access: 'Deny',
    note: 'Blocks SNMP polling out of the office subnet. Nothing in the ticket touches SNMP.',
  },
  {
    id: 8,
    src: FLOOR2,
    dst: 'ANY',
    proto: 'TCP/UDP',
    port: '25,465',
    access: 'Deny',
    note: 'Blocks direct SMTP to the internet, a normal anti spam control. Internal mail still works because rule 1 matches it first.',
  },
  {
    id: 9,
    src: FLOOR2,
    dst: 'ANY',
    proto: 'ANY',
    port: 'ANY',
    access: 'Accept',
    note: 'The catch all permit for the office subnet. It is why ping and DNS to the internet still succeed even while the web is blocked.',
  },
  {
    id: 10,
    src: 'ANY',
    dst: 'ANY',
    proto: 'ANY',
    port: 'ANY',
    access: 'Deny',
    note: 'The cleanup rule. Anything not matched above gets dropped here.',
  },
];

export const FAULT_RULE_ID = 3;

export const INTERFACES = `eth1
    Address      192.0.2.2
    Netmask      255.255.255.252
    Network      192.0.2.0/30
    Broadcast    192.0.2.3

eth2
    Address      192.168.0.33
    Netmask      255.255.255.224
    Network      192.168.0.32/27
    Broadcast    192.168.0.63

eth3
    Address      192.168.0.65
    Netmask      255.255.255.224
    Network      192.168.0.64/27
    Broadcast    192.168.0.95`;

export interface Host {
  id: string;
  name: string;
  ip: string;
  mask: string;
  gateway: string;
  adapter: string;
}

export const HOSTS: Record<string, Host> = {
  ws1: {
    id: 'ws1',
    name: 'Workstation 1',
    ip: '192.168.0.70',
    mask: '255.255.255.224',
    gateway: '192.168.0.65',
    adapter: 'Ethernet0',
  },
  ws2: {
    id: 'ws2',
    name: 'Workstation 2',
    ip: '192.168.0.71',
    mask: '255.255.255.224',
    gateway: '192.168.0.65',
    adapter: 'Ethernet0',
  },
};

// Names the simulated resolver knows about.
export const DNS_TABLE: Record<string, string> = {
  'www.example.org': '198.51.100.20',
  'example.org': '198.51.100.20',
  'intranet.corp.example': '192.168.0.43',
  'mail.corp.example': '192.168.0.42',
  'files.corp.example': '192.168.0.41',
};

export const DNS_SERVER = '192.168.0.40';
export const OUTSIDE_SITE = 'www.example.org';
