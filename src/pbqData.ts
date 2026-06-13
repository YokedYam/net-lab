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

// Type the answer from memory (no options to recognize). Graded by normalized
// match against any accepted form.
export interface RecallPbq extends PbqBase {
  kind: 'recall';
  prompts: { id: string; text: string; accept: string[]; why: string }[];
}

// Say-it-out-loud / teach-back: write a free-text explanation. Graded on whether
// each key point is covered (keyword check), then a model answer is revealed for
// self-comparison.
export interface TeachbackPbq extends PbqBase {
  kind: 'teachback';
  points: { id: string; text: string; keywords: string[] }[];
  model: string;
}

export type Pbq = MatchPbq | CategorizePbq | SubnetPbq | OrderPbq | RecallPbq | TeachbackPbq;

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
    id: 'pbq-tcp-handshake',
    kind: 'order',
    title: 'Build the TCP three-way handshake',
    domain: '1.0',
    scenario:
      'A client opens a connection to a web server. Build the TCP three-way handshake that sets it up, then the graceful close.',
    instruction: 'Drag the segments into the order they are sent (top = first).',
    resources: ['tcp', 'ports'],
    items: [
      { id: 't1', text: 'SYN: client sends its starting sequence number (seq = x)' },
      { id: 't2', text: 'SYN, ACK: server acknowledges (ack = x+1) and sends its own SYN (seq = y)' },
      { id: 't3', text: 'ACK: client acknowledges the server (ack = y+1). Connection is open' },
      { id: 't4', text: 'Data flows (for example HTTP GET, then 200 OK), each segment acknowledged' },
      { id: 't5', text: 'FIN: a side signals it is done sending' },
      { id: 't6', text: 'ACK + FIN: the other side acknowledges, then sends its own FIN' },
      { id: 't7', text: 'ACK: final acknowledge. Connection fully closed' },
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

  // ----- Domain 2.0: Network Implementation -----
  {
    id: 'pbq-wifi',
    kind: 'match',
    title: 'Match the 802.11 standard to its band',
    domain: '2.0',
    scenario: 'You are planning a wireless upgrade and need to know which band each Wi-Fi standard uses.',
    instruction: 'Pick the band each 802.11 standard operates on.',
    resources: [],
    options: ['2.4 GHz', '5 GHz', '2.4 and 5 GHz', '2.4, 5, and 6 GHz'],
    prompts: [
      { id: 'a', text: '802.11a', correct: '5 GHz', why: '802.11a was 5 GHz only.' },
      { id: 'bg', text: '802.11b / 802.11g', correct: '2.4 GHz', why: 'b and g run on 2.4 GHz.' },
      { id: 'n', text: '802.11n (Wi-Fi 4)', correct: '2.4 and 5 GHz', why: 'n added MIMO and works on both bands.' },
      { id: 'ac', text: '802.11ac (Wi-Fi 5)', correct: '5 GHz', why: 'ac is 5 GHz only.' },
      { id: 'ax', text: '802.11ax (Wi-Fi 6 / 6E)', correct: '2.4, 5, and 6 GHz', why: 'Wi-Fi 6E added the 6 GHz band.' },
    ],
  },
  {
    id: 'pbq-cabling',
    kind: 'categorize',
    title: 'Copper or fiber?',
    domain: '2.0',
    scenario: 'You are speccing cable runs. Sort each item into copper or fiber.',
    instruction: 'Drag each item into Copper or Fiber.',
    resources: [],
    buckets: ['Copper', 'Fiber'],
    items: [
      { id: 'cat6', text: 'Cat 6 / Cat 6a cable', bucket: 'Copper', why: 'Cat5e/6/6a are twisted-pair copper.' },
      { id: 'rj45', text: 'RJ45 connector', bucket: 'Copper', why: 'RJ45 terminates copper Ethernet.' },
      { id: 'smf', text: 'Single-mode, long-haul runs', bucket: 'Fiber', why: 'Single-mode fiber carries light for kilometers.' },
      { id: 'lc', text: 'LC / SC connector', bucket: 'Fiber', why: 'LC and SC are fiber connectors.' },
      { id: '100m', text: '100 meter maximum length', bucket: 'Copper', why: 'Copper Ethernet tops out at 100 m.' },
      { id: 'emi', text: 'Immune to EMI, very long distance', bucket: 'Fiber', why: 'Fiber is glass: no electrical interference, long runs.' },
    ],
  },

  // ----- Domain 3.0: Network Operations -----
  {
    id: 'pbq-monitoring',
    kind: 'match',
    title: 'Match the monitoring tool to its job',
    domain: '3.0',
    scenario: 'You are building visibility into the network. Match each tool to what it is best at.',
    instruction: 'Pick the right tool for each job.',
    resources: [],
    options: ['SNMP', 'Syslog', 'NetFlow', 'Packet capture'],
    prompts: [
      { id: 'metrics', text: 'Poll devices for metrics (CPU, interface counters)', correct: 'SNMP', why: 'SNMP polls device stats on UDP 161/162.' },
      { id: 'logs', text: 'Collect event and log messages from many devices centrally', correct: 'Syslog', why: 'Syslog aggregates logs to one server.' },
      { id: 'flows', text: 'Summarize who talked to whom and how much', correct: 'NetFlow', why: 'NetFlow/sFlow report traffic flow statistics.' },
      { id: 'bytes', text: 'Inspect the actual bytes on the wire', correct: 'Packet capture', why: 'Wireshark/tcpdump capture real packets.' },
    ],
  },

  // ----- Domain 4.0: Network Security -----
  {
    id: 'pbq-secure-twins',
    kind: 'match',
    title: 'Replace each plaintext protocol with its secure twin',
    domain: '4.0',
    scenario: 'A security audit flags several plaintext protocols. Choose the encrypted replacement for each.',
    instruction: 'Pick the secure replacement for each insecure protocol.',
    resources: ['tls', 'ports'],
    options: ['SSH', 'SFTP', 'HTTPS', 'LDAPS', 'SNMPv3'],
    prompts: [
      { id: 'telnet', text: 'Telnet (plaintext remote login, port 23)', correct: 'SSH', why: 'SSH on 22 replaces Telnet.' },
      { id: 'ftp', text: 'FTP (plaintext file transfer, port 21)', correct: 'SFTP', why: 'SFTP (over SSH, 22) replaces FTP.' },
      { id: 'http', text: 'HTTP (plaintext web, port 80)', correct: 'HTTPS', why: 'HTTPS on 443 is HTTP over TLS.' },
      { id: 'ldap', text: 'LDAP (plaintext directory, port 389)', correct: 'LDAPS', why: 'LDAPS on 636 encrypts LDAP.' },
      { id: 'snmp', text: 'SNMP v1/v2 (plaintext management)', correct: 'SNMPv3', why: 'SNMPv3 adds authentication and encryption.' },
    ],
  },
  {
    id: 'pbq-cia-teachback',
    kind: 'teachback',
    title: 'Teach back: the CIA triad',
    domain: '4.0',
    scenario: 'A new hire asks what "CIA" means in security. Explain the triad in your own words, as if teaching them out loud.',
    instruction: 'Write your explanation. Hit all three goals and what protects each.',
    resources: [],
    points: [
      { id: 'c', text: 'Confidentiality: only authorized people can read the data (encryption, access control)', keywords: ['confidential', 'encrypt', 'authorized', 'access control', 'secret', 'only those'] },
      { id: 'i', text: 'Integrity: the data has not been altered (hashing, checksums, signatures)', keywords: ['integrity', 'alter', 'tamper', 'hash', 'checksum', 'unchanged', 'modif', 'signature'] },
      { id: 'a', text: 'Availability: the service is up and reachable when needed (redundancy, backups, DDoS defense)', keywords: ['availab', 'uptime', 'redundan', 'backup', 'reachable', 'up when', 'ddos'] },
    ],
    model:
      'The CIA triad is the three goals of security. Confidentiality keeps data secret so only authorized people can read it, using encryption and access controls. Integrity makes sure data has not been tampered with, which hashes and digital signatures prove. Availability keeps the system up and reachable when it is needed, using redundancy, backups, and defenses against attacks like DDoS. Almost every control you add supports one of these three.',
  },

  // ----- Domain 5.0: Network Troubleshooting -----
  {
    id: 'pbq-cli-tools',
    kind: 'match',
    title: 'Match the command-line tool to what it proves',
    domain: '5.0',
    scenario: 'A user cannot reach a server. Match each CLI tool to the question it answers.',
    instruction: 'Pick the tool that answers each question.',
    resources: [],
    options: ['ping', 'traceroute', 'nslookup', 'ipconfig', 'arp', 'netstat'],
    prompts: [
      { id: 'reach', text: 'Is the host reachable, and how fast?', correct: 'ping', why: 'ping is ICMP reachability and latency.' },
      { id: 'path', text: 'Where along the path does it break?', correct: 'traceroute', why: 'traceroute shows each hop to the target.' },
      { id: 'name', text: 'Is name resolution (DNS) working?', correct: 'nslookup', why: 'nslookup/dig query DNS directly.' },
      { id: 'local', text: 'What is my IP, mask, and gateway (is it APIPA)?', correct: 'ipconfig', why: 'ipconfig/ip show local config and catch a 169.254 address.' },
      { id: 'mac', text: 'Which MAC is mapped to this IP?', correct: 'arp', why: 'arp -a shows the IP-to-MAC table.' },
      { id: 'ports', text: 'What ports are open or listening here?', correct: 'netstat', why: 'netstat/ss list active connections and listening ports.' },
    ],
  },
  {
    id: 'pbq-ports-recall',
    kind: 'recall',
    title: 'Recall the port numbers (type them)',
    domain: '1.0',
    scenario: 'No multiple choice this time. Type the port from memory, the way the exam makes you produce it.',
    instruction: 'Type the correct port number for each protocol.',
    resources: ['ports'],
    prompts: [
      { id: 'ssh', text: 'SSH uses TCP port…', accept: ['22'], why: 'SSH is TCP 22.' },
      { id: 'https', text: 'HTTPS uses TCP port…', accept: ['443'], why: 'HTTPS is TCP 443.' },
      { id: 'dns', text: 'DNS uses port…', accept: ['53'], why: 'DNS is port 53 (UDP and TCP).' },
      { id: 'rdp', text: 'RDP uses TCP port…', accept: ['3389'], why: 'RDP is TCP 3389.' },
      { id: 'smtp', text: 'SMTP uses TCP port…', accept: ['25'], why: 'SMTP is TCP 25.' },
      { id: 'dhcp', text: 'DHCP uses UDP ports… (both)', accept: ['67/68', '68/67', '67 68', '67,68', '67 and 68'], why: 'DHCP is UDP 67 (server) and 68 (client).' },
    ],
  },
  {
    id: 'pbq-tshoot-recall',
    kind: 'recall',
    title: 'Recall the troubleshooting facts (type them)',
    domain: '5.0',
    scenario: 'Produce these from memory. They are the most common "what is wrong" answers on the exam.',
    instruction: 'Type the answer for each.',
    resources: [],
    prompts: [
      { id: 'loop', text: 'You ping ___ to test your own TCP/IP stack (the loopback).', accept: ['127.0.0.1', 'loopback', 'localhost'], why: 'Loopback is 127.0.0.1.' },
      { id: 'apipa', text: 'A 169.254.x.x address means ___ failed.', accept: ['dhcp', 'apipa', 'dhcp server', 'the dhcp server'], why: '169.254 is APIPA: the DHCP server never answered.' },
      { id: 'dns', text: 'IP addresses work but names do not. The problem is ___.', accept: ['dns'], why: 'Names fail, IPs work, points to DNS.' },
      { id: 'trace', text: 'The command that shows every hop to a destination is ___.', accept: ['traceroute', 'tracert'], why: 'traceroute (tracert on Windows).' },
    ],
  },
  {
    id: 'pbq-osi-teachback',
    kind: 'teachback',
    title: 'Teach back: how data moves through OSI',
    domain: '1.0',
    scenario: 'Explain encapsulation, how data travels through the OSI layers, in your own words, like teaching a beginner.',
    instruction: 'Write it out. Cover the direction, the headers each layer adds, and the receiving side.',
    resources: ['ip', 'mac', 'tcp'],
    points: [
      { id: 'down', text: 'On the sender, data starts at the top (Application) and moves DOWN the stack', keywords: ['down', 'top', 'application', 'sender', 'descend'] },
      { id: 'headers', text: 'Each layer adds its own header (encapsulation): Transport adds ports, Network adds IPs, Data Link adds MACs', keywords: ['header', 'encapsulat', 'port', 'ip address', 'mac', 'wrap', 'adds'] },
      { id: 'up', text: 'It crosses as bits, then moves UP the stack on the receiver, stripping headers (de-encapsulation)', keywords: ['up', 'receiver', 'strip', 'de-encapsulat', 'bits', 'unwrap', 'remove'] },
    ],
    model:
      'Picture the OSI model as a stack of seven layers. When you send data it starts at the top (Application) and moves down. Each layer wraps it with its own header: Transport adds port numbers, Network adds source and destination IP addresses, Data Link adds MAC addresses, and Physical turns it all into bits on the wire. That wrapping is called encapsulation. On the receiving side the data moves back up the stack and each layer peels off its header until the application reads the original message. A mnemonic for the layers is "Please Do Not Throw Sausage Pizza Away": Physical, Data Link, Network, Transport, Session, Presentation, Application.',
  },
];
