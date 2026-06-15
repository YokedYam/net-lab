// Concise term/definition pairs for the Matching mini game. Tiles need short
// text on both sides, so these are tighter than the flashcard backs. The
// content test scans every string here for em dashes. Straight quotes only.

import type { DomainId } from './study';

export interface MatchPair {
  term: string;
  def: string;
}

export interface MatchSet {
  id: string;
  name: string;
  domain: DomainId;
  color: string;
  blurb: string;
  pairs: MatchPair[];
}

export const MATCH_SETS: MatchSet[] = [
  {
    id: 'ports',
    name: 'Ports & protocols',
    domain: '1.0',
    color: '#3b82f6',
    blurb: 'The port numbers the exam makes you produce from memory.',
    pairs: [
      { term: 'FTP', def: 'TCP 20/21' },
      { term: 'SSH', def: 'TCP 22' },
      { term: 'Telnet', def: 'TCP 23' },
      { term: 'SMTP', def: 'TCP 25' },
      { term: 'DNS', def: 'Port 53' },
      { term: 'DHCP', def: 'UDP 67/68' },
      { term: 'HTTP', def: 'TCP 80' },
      { term: 'HTTPS', def: 'TCP 443' },
      { term: 'SMB', def: 'TCP 445' },
      { term: 'RDP', def: 'TCP 3389' },
      { term: 'SNMP', def: 'UDP 161/162' },
      { term: 'NTP', def: 'UDP 123' },
    ],
  },
  {
    id: 'osi',
    name: 'OSI layers',
    domain: '1.0',
    color: '#8b5cf6',
    blurb: 'Match each layer to what lives there.',
    pairs: [
      { term: 'Layer 1 Physical', def: 'Cables, bits on the wire' },
      { term: 'Layer 2 Data Link', def: 'MAC, switches, frames' },
      { term: 'Layer 3 Network', def: 'IP, routers, packets' },
      { term: 'Layer 4 Transport', def: 'TCP/UDP, ports, segments' },
      { term: 'Layer 5 Session', def: 'Opens and closes sessions' },
      { term: 'Layer 6 Presentation', def: 'Encrypt and format (TLS)' },
      { term: 'Layer 7 Application', def: 'Apps: HTTP, DNS, SMTP' },
    ],
  },
  {
    id: 'protocols',
    name: 'What each protocol does',
    domain: '1.0',
    color: '#14b8a6',
    blurb: 'The job behind the acronym.',
    pairs: [
      { term: 'ARP', def: 'Maps IP to MAC' },
      { term: 'DNS', def: 'Resolves names to IPs' },
      { term: 'DHCP', def: 'Hands out IP config' },
      { term: 'ICMP', def: 'Ping and error messages' },
      { term: 'NAT', def: 'Maps private IPs to public IPs' },
      { term: 'TLS', def: 'Encrypts traffic (HTTPS)' },
      { term: 'STP', def: 'Stops switch loops' },
      { term: 'VLAN', def: 'Splits a switch into segments' },
      { term: 'OSPF', def: 'Link-state routing protocol' },
      { term: 'BGP', def: 'Routing between providers' },
    ],
  },
  {
    id: 'tools',
    name: 'Troubleshooting tools',
    domain: '5.0',
    color: '#f472b6',
    blurb: 'Pick the tool that answers each question.',
    pairs: [
      { term: 'ping', def: 'Reachability and latency' },
      { term: 'traceroute', def: 'Each hop to the target' },
      { term: 'nslookup', def: 'Tests DNS resolution' },
      { term: 'ipconfig', def: 'Your IP, mask, gateway' },
      { term: 'arp -a', def: 'IP to MAC on your segment' },
      { term: 'netstat', def: 'Open ports and connections' },
      { term: 'nmap', def: 'Scan for open services' },
      { term: 'tcpdump', def: 'Capture raw packets' },
    ],
  },
  {
    id: 'addressing',
    name: 'Addressing & subnetting',
    domain: '1.0',
    color: '#fb923c',
    blurb: 'The address facts that show up again and again.',
    pairs: [
      { term: '127.0.0.1', def: 'Loopback (test your stack)' },
      { term: '169.254.x.x', def: 'APIPA (DHCP failed)' },
      { term: '10.0.0.0/8', def: 'Private Class A range' },
      { term: '192.168.0.0/16', def: 'Private Class C range' },
      { term: '255.255.255.0', def: 'A /24 mask' },
      { term: '/24', def: '254 usable hosts' },
      { term: '/30', def: '2 usable hosts (point to point)' },
      { term: 'ff:ff:ff:ff:ff:ff', def: 'Layer 2 broadcast' },
    ],
  },
];

// How many pairs make up one round. Sets larger than this are sampled so replay
// stays fresh; smaller sets just use everything they have.
export const ROUND_PAIRS = 6;
