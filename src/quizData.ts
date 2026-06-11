import type { ConceptId, DomainId } from './study';

export interface QuizQuestion {
  id: string;
  domain: DomainId;
  topic: string;
  conceptId?: ConceptId; // jumps to the matching Learn demo on a wrong answer
  resourceLabel?: string; // overrides the demo button label
  question: string;
  choices: string[];
  answer: number; // index into choices
  explanation: string; // beginner-friendly "why", with an analogy where it helps
  ai?: boolean; // true for questions generated at runtime by the AI button
}

// A practice pool written in the scenario / "BEST answer" style the real
// Network+ (N10-009) uses. Plain-English explanations, analogies for beginners.
export const QUIZ: QuizQuestion[] = [
  // ---------------- Domain 1.0: Networking Concepts ----------------
  {
    id: 'q-osi-1',
    domain: '1.0',
    topic: 'OSI model',
    question:
      'A developer says their app works on the same LAN but fails across the internet. You suspect an IP routing problem. Which OSI layer handles logical addressing and routing between networks?',
    choices: ['Layer 2: Data Link', 'Layer 3: Network', 'Layer 4: Transport', 'Layer 7: Application'],
    answer: 1,
    explanation:
      'Layer 3 (Network) is where IP addresses and routing live. It gets a packet from one network to another. Think of Layer 2 as the street address on one block (MAC), and Layer 3 as the city + ZIP that gets mail across the country (IP).',
    conceptId: 'ip',
  },
  {
    id: 'q-tcpudp-1',
    domain: '1.0',
    topic: 'TCP vs UDP',
    conceptId: 'udp',
    question:
      'A live video call stutters when a few packets drop, but you would rather have a smooth call than a perfect one. Which transport protocol is the BEST fit?',
    choices: ['TCP, because it guarantees delivery', 'UDP, because it is fast and connectionless', 'ICMP, because it tests reachability', 'ARP, because it resolves addresses'],
    answer: 1,
    explanation:
      'UDP is "fire and forget": no handshake, no retransmits, low delay. That is exactly what real-time voice/video want: a late packet is useless, so dropping it beats waiting. TCP would pause to resend and make the call lag. Analogy: UDP is shouting across a room; TCP is a phone call where you confirm "you still there?"',
  },
  {
    id: 'q-ports-1',
    domain: '1.0',
    topic: 'Port numbers',
    conceptId: 'ports',
    question: 'A user can reach a website by its IP address but not by its name. Which port is MOST likely being blocked?',
    choices: ['TCP 80', 'UDP 53', 'TCP 443', 'TCP 22'],
    answer: 1,
    explanation:
      'Name-to-IP resolution is DNS, which uses port 53 (mostly UDP). If the IP works but the name does not, DNS is the prime suspect. Port 80/443 are the web itself; 22 is SSH. Analogy: DNS is the phone book. The phone still works, you just cannot look up the number.',
  },
  {
    id: 'q-dhcp-1',
    domain: '1.0',
    topic: 'DHCP',
    conceptId: 'dhcp',
    question: 'Which sequence correctly describes how a client gets an address from a DHCP server?',
    choices: [
      'Discover, Offer, Request, Acknowledge',
      'Request, Offer, Discover, Acknowledge',
      'Offer, Discover, Acknowledge, Request',
      'Discover, Request, Offer, Acknowledge',
    ],
    answer: 0,
    explanation:
      'DORA: Discover (client shouts "anyone there?"), Offer (server offers a lease), Request (client says "I will take it"), Acknowledge (server confirms). Memorize DORA and you have it.',
  },
  {
    id: 'q-privateip-1',
    domain: '1.0',
    topic: 'Private IP ranges',
    conceptId: 'ip',
    question: 'Which of these is a private IPv4 address that would NOT be routable on the public internet?',
    choices: ['8.8.8.8', '172.16.5.10', '203.0.113.5', '1.1.1.1'],
    answer: 1,
    explanation:
      'Private ranges are 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), and 192.168.0.0/16. 172.16.5.10 falls in the 172.16–172.31 block. The others are public addresses. Private IPs need NAT to reach the internet.',
  },
  {
    id: 'q-gateway-1',
    domain: '1.0',
    topic: 'Default gateway',
    conceptId: 'gateway',
    question:
      'A host can ping other devices on its own subnet but cannot reach anything on other networks. Which setting is MOST likely wrong or missing?',
    choices: ['DNS server', 'Default gateway', 'MAC address', 'Subnet bubble color'],
    answer: 1,
    explanation:
      'Talking to your own subnet works at Layer 2, no router needed. The moment you leave the subnet, the host hands the packet to its default gateway (the router). No gateway = stuck on your own street.',
  },
  {
    id: 'q-macip-1',
    domain: '1.0',
    topic: 'MAC vs IP',
    conceptId: 'mac',
    question: 'As a packet is routed across three routers to a remote server, which statement is TRUE?',
    choices: [
      'The source IP changes at every router',
      'The destination MAC changes at every hop',
      'The destination IP changes at every hop',
      'Both MAC and IP stay the same end to end',
    ],
    answer: 1,
    explanation:
      'The IP addresses (source and destination) stay the same end to end. That is the whole point of Layer 3. The MAC addresses are rewritten at every hop because MAC only has meaning on the local link. Analogy: the final mailing address (IP) never changes, but each mail truck (MAC) hands off to the next.',
  },
  {
    id: 'q-subnet-1',
    domain: '1.0',
    topic: 'Subnetting',
    conceptId: 'subnet',
    question: 'How many usable host addresses are available in a /27 subnet?',
    choices: ['14', '30', '62', '32'],
    answer: 1,
    explanation:
      'A /27 leaves 5 host bits (32 − 27). 2^5 = 32 total, minus the network and broadcast addresses = 30 usable. Quick rule: usable hosts = 2^(host bits) − 2.',
  },
  {
    id: 'q-dns-records-1',
    domain: '1.0',
    topic: 'DNS records',
    conceptId: 'dns',
    question: 'You need to point a hostname to an IPv6 address. Which DNS record type do you create?',
    choices: ['A', 'AAAA', 'MX', 'CNAME'],
    answer: 1,
    explanation:
      'A records map a name to an IPv4 address; AAAA ("quad-A") maps a name to IPv6. MX is for mail servers, CNAME is an alias to another name. Four A’s for the longer (IPv6) address is an easy way to remember it.',
  },
  {
    id: 'q-nat-1',
    domain: '1.0',
    topic: 'NAT / PAT',
    conceptId: 'router',
    resourceLabel: 'Router demo',
    question:
      'A home with 12 devices shares one public IP from the ISP. Which technology lets all of them browse the internet at the same time using that single address?',
    choices: ['DHCP', 'PAT (NAT overload)', 'DNS', 'VLAN tagging'],
    answer: 1,
    explanation:
      'PAT (Port Address Translation, aka NAT overload) maps many private IPs to one public IP by tracking unique port numbers. It is why a whole house shares one ISP address. DHCP hands out the internal IPs; it does not translate them.',
  },
  {
    id: 'q-ipv6-1',
    domain: '1.0',
    topic: 'IPv6',
    conceptId: 'ip',
    question: 'Which address is a valid, correctly compressed IPv6 address?',
    choices: ['192.168.1.1', '2001:0db8::1', '2001:db8:::1', 'FE80:1:2:3:4:5:6:7:8'],
    answer: 1,
    explanation:
      'IPv6 is eight groups of hex. The :: shorthand replaces one run of all-zero groups. And you may use it only once. 2001:0db8::1 is valid. ":::" (triple colon) is illegal, and the last option has nine groups.',
  },
  {
    id: 'q-loadbalancer-1',
    domain: '1.0',
    topic: 'Load balancing',
    conceptId: 'loadbalancer',
    question:
      'A popular website needs to handle a traffic spike and survive a single server failure. Which device spreads requests across multiple servers?',
    choices: ['Load balancer', 'Layer 2 switch', 'DNS resolver', 'Firewall'],
    answer: 0,
    explanation:
      'A load balancer sits in front of a pool of servers and distributes incoming requests, so no single box gets overwhelmed and a dead server can be skipped. Think of a host at a restaurant seating guests evenly across sections.',
  },

  // ---------------- Domain 2.0: Network Implementation ----------------
  {
    id: 'q-ospf-1',
    domain: '2.0',
    topic: 'Routing protocols',
    conceptId: 'ospf',
    question: 'Which interior routing protocol uses link-state and "cost" (based on bandwidth) to pick the best path inside an organization?',
    choices: ['BGP', 'OSPF', 'RIP', 'ARP'],
    answer: 1,
    explanation:
      'OSPF is a link-state IGP that builds a full map of the network and picks the lowest-cost path, where cost is tied to bandwidth. RIP is older and just counts hops. BGP is the routing protocol between organizations (the internet backbone).',
  },
  {
    id: 'q-bgp-1',
    domain: '2.0',
    topic: 'Routing protocols',
    conceptId: 'bgp',
    question: 'Two different companies (autonomous systems) need to exchange routes across the internet. Which protocol is designed for this?',
    choices: ['OSPF', 'EIGRP', 'BGP', 'STP'],
    answer: 2,
    explanation:
      'BGP is the routing protocol of the internet. It exchanges routes between autonomous systems (separate organizations). OSPF and EIGRP are interior protocols used inside one organization. Analogy: OSPF is navigating one city; BGP is the highway system connecting cities.',
  },
  {
    id: 'q-vlan-1',
    domain: '2.0',
    topic: 'VLANs',
    conceptId: 'switch',
    resourceLabel: 'Switch demo',
    question:
      'You want to separate the Sales and Engineering computers into different broadcast domains using the SAME physical switch. What do you configure?',
    choices: ['Spanning Tree Protocol', 'VLANs', 'Port mirroring', 'A second default gateway'],
    answer: 1,
    explanation:
      'VLANs split one physical switch into multiple logical networks, each its own broadcast domain. Sales and Engineering can plug into the same switch but stay separated until a router/Layer 3 device connects them. It is like putting walls inside one open office.',
  },
  {
    id: 'q-stp-1',
    domain: '2.0',
    topic: 'Switching loops',
    conceptId: 'switch',
    resourceLabel: 'Switch demo',
    question: 'Someone cabled two switches together with two cables, creating a loop. Which protocol prevents the resulting broadcast storm?',
    choices: ['STP (Spanning Tree Protocol)', 'OSPF', 'DHCP', 'NAT'],
    answer: 0,
    explanation:
      'Spanning Tree Protocol (STP) detects loops at Layer 2 and blocks the redundant path until it is needed, preventing broadcast storms. Without it, frames circle forever and melt the network.',
  },
  {
    id: 'q-wifi-band-1',
    domain: '2.0',
    topic: 'Wireless',
    question: 'A user far from the access point needs the BEST range, even at lower speed. Which band should they use?',
    choices: ['2.4 GHz', '5 GHz', '6 GHz', 'It makes no difference'],
    answer: 0,
    explanation:
      '2.4 GHz travels farther and penetrates walls better but is slower and more crowded. 5/6 GHz are faster but shorter range. Lower frequency = longer reach. Trade range for speed, or speed for range.',
  },
  {
    id: 'q-cable-1',
    domain: '2.0',
    topic: 'Cabling',
    question:
      'A run needs to carry 10 Gbps over about 80 meters of copper with good interference resistance. Which cable is the BEST choice?',
    choices: ['Cat 5', 'Cat 5e', 'Cat 6a', 'Coaxial RG-6'],
    answer: 2,
    explanation:
      'Cat 6a supports 10 Gbps up to 100 m and has better shielding against crosstalk. Cat 5 tops out at 100 Mbps; Cat 5e does 1 Gbps; coax is not used for Ethernet LAN runs. When you see 10 Gbps over a long copper run, think Cat 6a.',
  },
  {
    id: 'q-fiber-1',
    domain: '2.0',
    topic: 'Fiber',
    question: 'An ISP needs to run a connection 20 km between buildings. Which media is the BEST fit?',
    choices: ['Multimode fiber', 'Single-mode fiber', 'Cat 6 UTP', 'Coaxial cable'],
    answer: 1,
    explanation:
      'Single-mode fiber uses a tiny core and laser light to go very long distances (tens of km). Multimode is for shorter runs (within a campus/building). Copper maxes out around 100 m. Long distance = single-mode.',
  },
  {
    id: 'q-poe-1',
    domain: '2.0',
    topic: 'PoE',
    question: 'You need to install a ceiling Wi-Fi access point where there is no power outlet. What lets the Ethernet cable also deliver electrical power?',
    choices: ['PoE (Power over Ethernet)', 'NAT', 'QoS', 'DHCP'],
    answer: 0,
    explanation:
      'Power over Ethernet sends both data and power over one Ethernet cable, so APs, IP cameras, and phones work without a nearby outlet. One cable does two jobs.',
  },

  // ---------------- Domain 3.0: Network Operations ----------------
  {
    id: 'q-snmp-1',
    domain: '3.0',
    topic: 'Monitoring',
    question: 'Which protocol lets a central system poll routers and switches for health stats and receive alert "traps"?',
    choices: ['SNMP', 'SMTP', 'NTP', 'TFTP'],
    answer: 0,
    explanation:
      'SNMP (Simple Network Management Protocol) monitors and manages devices. Polling for stats and receiving traps when something goes wrong. Do not confuse it with SMTP (email) or NTP (time). Use SNMPv3 because it adds encryption.',
  },
  {
    id: 'q-syslog-1',
    domain: '3.0',
    topic: 'Logging',
    question: 'On the syslog severity scale, which level is the MOST severe?',
    choices: ['0: Emergency', '3: Error', '5: Notice', '7: Debug'],
    answer: 0,
    explanation:
      'Syslog severity runs 0 (Emergency, system unusable) to 7 (Debug, most verbose). Lower number = more severe. A handy mnemonic: "Every Awesome Cisco Engineer Will Need Ice cream Daily" for Emergency, Alert, Critical, Error, Warning, Notice, Informational, Debug.',
  },
  {
    id: 'q-ha-1',
    domain: '3.0',
    topic: 'High availability',
    conceptId: 'gateway',
    resourceLabel: 'Gateway demo',
    question:
      'You want two routers to share one virtual gateway IP so that if the active router dies, the backup takes over with no client reconfiguration. Which technology does this?',
    choices: ['FHRP (e.g., HSRP/VRRP)', 'STP', 'NAT', 'SNMP'],
    answer: 0,
    explanation:
      'A First Hop Redundancy Protocol (HSRP, VRRP, GLBP) lets two routers share a virtual IP/MAC as the default gateway. If the active one fails, the standby takes over instantly and hosts never notice. It is a backup quarterback for the gateway.',
  },
  {
    id: 'q-drmetrics-1',
    domain: '3.0',
    topic: 'Disaster recovery',
    question:
      'Management says "we can lose at most 15 minutes of data in a disaster." Which metric are they defining?',
    choices: ['RTO (Recovery Time Objective)', 'RPO (Recovery Point Objective)', 'MTBF', 'SLA'],
    answer: 1,
    explanation:
      'RPO = how much data you can afford to lose, measured in time (drives backup frequency). RTO = how fast you must be back up and running. "15 minutes of data" is about the recovery point, so RPO.',
  },
  {
    id: 'q-qos-1',
    domain: '3.0',
    topic: 'QoS',
    conceptId: 'udp',
    resourceLabel: 'UDP demo',
    question: 'VoIP calls sound choppy when the network is busy. Which feature prioritizes voice traffic over bulk downloads?',
    choices: ['QoS (Quality of Service)', 'PoE', 'NAT', 'STP'],
    answer: 0,
    explanation:
      'QoS tags and prioritizes time-sensitive traffic (like voice/video) so it jumps the queue ahead of less urgent data. It is an HOV lane for packets that cannot tolerate delay.',
  },
  {
    id: 'q-ntp-1',
    domain: '3.0',
    topic: 'Network services',
    question: 'Log timestamps across your devices are out of sync, making incident analysis painful. Which protocol fixes this?',
    choices: ['NTP', 'SNMP', 'DNS', 'LDAP'],
    answer: 0,
    explanation:
      'NTP (Network Time Protocol, UDP 123) keeps device clocks synchronized. Consistent time is critical for correlating logs during troubleshooting and security investigations.',
  },

  // ---------------- Domain 4.0: Network Security ----------------
  {
    id: 'q-onpath-1',
    domain: '4.0',
    topic: 'Attacks',
    conceptId: 'tls',
    resourceLabel: 'TLS demo',
    question:
      'An attacker on the same LAN sends forged ARP replies so traffic to the gateway flows through them first. What is this attack called?',
    choices: ['On-path (man-in-the-middle) via ARP poisoning', 'SYN flood', 'DNS amplification', 'Evil twin'],
    answer: 0,
    explanation:
      'ARP poisoning lets an attacker insert themselves between you and the gateway. An on-path (man-in-the-middle) attack. Encryption like TLS protects the data even if they intercept it. Dynamic ARP Inspection on switches helps stop the poisoning.',
  },
  {
    id: 'q-vpn-1',
    domain: '4.0',
    topic: 'VPN',
    conceptId: 'vpn',
    question: 'A remote employee needs a secure, encrypted tunnel to the office network over the public internet. Which solution is the BEST fit?',
    choices: ['A client-to-site VPN (e.g., IPsec/SSL)', 'Opening port 80 to their home', 'A second default gateway', 'A VLAN'],
    answer: 0,
    explanation:
      'A client-to-site (remote access) VPN builds an encrypted tunnel from the user’s device to the corporate network, so traffic is private even over the open internet. It is a sealed pipe through a public space.',
  },
  {
    id: 'q-firewall-1',
    domain: '4.0',
    topic: 'Firewalls',
    conceptId: 'firewall',
    question:
      'You want to block traffic based on the application and user identity, not just IP and port. Which device is the BEST choice?',
    choices: ['Next-generation firewall (NGFW)', 'Layer 2 switch', 'Hub', 'Basic ACL on a router'],
    answer: 0,
    explanation:
      'A next-generation firewall inspects deeper. Application awareness, user identity, and intrusion prevention: beyond the simple IP/port rules of a traditional firewall. More context = smarter blocking.',
  },
  {
    id: 'q-8021x-1',
    domain: '4.0',
    topic: 'Authentication',
    question:
      'You want devices to authenticate BEFORE they are allowed onto a switch port. Which standard provides this port-based network access control?',
    choices: ['802.1X', '802.11ac', '802.3af', '802.1Q'],
    answer: 0,
    explanation:
      '802.1X is port-based access control: a device must authenticate (often via RADIUS) before the switch port opens. 802.11 is Wi-Fi, 802.3af is PoE, 802.1Q is VLAN tagging. Easy to mix up the numbers, so anchor 802.1X = authentication.',
  },
  {
    id: 'q-cia-1',
    domain: '4.0',
    topic: 'Security concepts',
    question: 'Encrypting data so only authorized parties can read it primarily protects which part of the CIA triad?',
    choices: ['Confidentiality', 'Integrity', 'Availability', 'Accountability'],
    answer: 0,
    explanation:
      'Encryption protects confidentiality (keeping data secret). Integrity is about data not being altered (hashing), and availability is about uptime. CIA = Confidentiality, Integrity, Availability.',
  },
  {
    id: 'q-eviltwin-1',
    domain: '4.0',
    topic: 'Wireless attacks',
    question:
      'At a coffee shop, a laptop auto-connects to a rogue access point with the same SSID as the real one, run by an attacker. What is this called?',
    choices: ['Evil twin', 'Smurf attack', 'VLAN hopping', 'Zero-day'],
    answer: 0,
    explanation:
      'An evil twin is a rogue AP impersonating a legitimate SSID to trick devices into connecting, so the attacker can capture traffic. Lesson: a familiar network name is not proof it is safe.',
  },
  {
    id: 'q-ddos-1',
    domain: '4.0',
    topic: 'Attacks',
    question:
      'A web server becomes unreachable because thousands of compromised devices flood it with traffic at once. Which attack is this, and which CIA principle does it target?',
    choices: ['DDoS: Availability', 'Phishing: Confidentiality', 'On-path: Integrity', 'SQL injection: Availability'],
    answer: 0,
    explanation:
      'A Distributed Denial of Service uses a botnet (many devices) to overwhelm a target, knocking it offline: that attacks Availability. It is a crowd jamming a doorway so real customers cannot get in.',
  },

  // ---------------- Domain 5.0: Network Troubleshooting ----------------
  {
    id: 'q-method-1',
    domain: '5.0',
    topic: 'Troubleshooting methodology',
    question: 'According to CompTIA’s troubleshooting methodology, what is the FIRST step?',
    choices: [
      'Identify the problem',
      'Establish a theory of probable cause',
      'Implement the solution',
      'Document findings',
    ],
    answer: 0,
    explanation:
      'Step 1 is always Identify the problem (gather info, question users, find what changed). You cannot theorize a cause before you understand the symptoms. The order: Identify → Theory → Test theory → Plan → Implement → Verify → Document.',
  },
  {
    id: 'q-tool-traceroute-1',
    domain: '5.0',
    topic: 'Tools',
    conceptId: 'router',
    resourceLabel: 'Router demo',
    question: 'Traffic to a remote site is slow and you want to see WHERE along the path the delay happens. Which tool is BEST?',
    choices: ['ping', 'traceroute / tracert', 'nslookup', 'ipconfig'],
    answer: 1,
    explanation:
      'traceroute (tracert on Windows) shows every router hop and the latency at each one, so you can spot where the slowdown starts. ping only tells you round-trip to the final destination, not the path in between.',
  },
  {
    id: 'q-tool-nslookup-1',
    domain: '5.0',
    topic: 'Tools',
    conceptId: 'dns',
    question: 'You suspect a DNS issue and want to manually query which IP a hostname resolves to. Which tool do you use?',
    choices: ['nslookup / dig', 'arp -a', 'netstat', 'tracert'],
    answer: 0,
    explanation:
      'nslookup (or dig) queries DNS directly so you can confirm whether a name resolves and to what IP. arp shows MAC-to-IP on the local link; netstat shows active connections; tracert maps the path.',
  },
  {
    id: 'q-duplex-1',
    domain: '5.0',
    topic: 'Common issues',
    question:
      'A link works but is extremely slow, and the interface counters show lots of late collisions and CRC errors. What is the MOST likely cause?',
    choices: ['Duplex mismatch', 'Wrong DNS server', 'Exhausted DHCP scope', 'Blocked port 443'],
    answer: 0,
    explanation:
      'Late collisions plus CRC errors on a working-but-slow link scream duplex mismatch (one side full-duplex, the other half). Fix by setting both ends the same. Ideally auto-negotiate on both.',
  },
  {
    id: 'q-ipconflict-1',
    domain: '5.0',
    topic: 'Common issues',
    conceptId: 'ip',
    question:
      'Two devices were both manually set to 192.168.1.50. What symptom will users MOST likely report?',
    choices: ['Intermittent connectivity / IP conflict', 'Faster speeds', 'Better DNS resolution', 'Automatic VLAN assignment'],
    answer: 0,
    explanation:
      'Two hosts with the same IP cause an address conflict. Connectivity drops in and out as the network confuses the two. This is why DHCP (which tracks leases) usually beats hand-typed static IPs.',
  },
  {
    id: 'q-apipa-1',
    domain: '5.0',
    topic: 'Common issues',
    conceptId: 'dhcp',
    question:
      'A Windows PC shows an address of 169.254.10.23 and cannot reach anything. What does that tell you?',
    choices: [
      'It got a normal address from DHCP',
      'It failed to reach a DHCP server (APIPA self-assigned)',
      'It is using IPv6',
      'Its firewall is blocking port 53',
    ],
    answer: 1,
    explanation:
      'A 169.254.x.x address is APIPA: the PC self-assigned because no DHCP server answered. The real problem is DHCP reachability (server down, cable unplugged, VLAN issue). APIPA is the "I gave up waiting" address.',
  },
  {
    id: 'q-loopback-1',
    domain: '5.0',
    topic: 'Tools',
    conceptId: 'icmp',
    question: 'You ping 127.0.0.1 to confirm the local TCP/IP stack works. What is this address called?',
    choices: ['The loopback address', 'The default gateway', 'A broadcast address', 'A public DNS server'],
    answer: 0,
    explanation:
      '127.0.0.1 is the loopback: it tests your own machine’s TCP/IP stack without touching the network. If loopback fails, the problem is local (the stack itself), not the cable or switch.',
  },

  // ---- extra high-yield items (added from N10-009 exam research) ----
  {
    id: 'q-wifi6-1',
    domain: '2.0',
    topic: 'Wireless',
    question:
      'A company is deploying Wi-Fi in a packed auditorium and needs to support the MOST simultaneous users with the least congestion. Which standard is the BEST choice?',
    choices: [
      '802.11g at 2.4 GHz',
      '802.11n at 2.4 GHz',
      '802.11ac (Wi-Fi 5) at 5 GHz',
      '802.11ax (Wi-Fi 6) with OFDMA',
    ],
    answer: 3,
    explanation:
      'Wi-Fi 6 (802.11ax) adds OFDMA, which lets one access point serve many clients at once instead of one at a time. Exactly what a dense crowd needs. Older standards choke when hundreds of devices share the air. Newer Wi-Fi number = better in a crowd.',
  },
  {
    id: 'q-wpa3-1',
    domain: '4.0',
    topic: 'Wireless security',
    question:
      'Each employee should log into the corporate Wi-Fi with their own username and password (not one shared key), authenticated against a central server. Which setup is correct?',
    choices: [
      'WPA2/WPA3-Personal (PSK)',
      'WPA2/WPA3-Enterprise (802.1X + RADIUS)',
      'An open network with a captive portal',
      'WEP with a rotating key',
    ],
    answer: 1,
    explanation:
      'Enterprise mode uses 802.1X with a RADIUS server so every user has individual credentials. Easy to revoke one person without changing everyone’s key. Personal mode uses one shared pre-shared key (PSK), fine for home but not per-user. WEP is broken; never use it.',
  },
  {
    id: 'q-ztna-1',
    domain: '1.0',
    topic: 'Modern network environments',
    question:
      'A security model assumes no device or user is trusted by default. Every request must be verified, even from inside the network. What is this approach called?',
    choices: ['Zero Trust', 'Flat network', 'Implicit allow', 'Perimeter-only security'],
    answer: 0,
    explanation:
      'Zero Trust means "never trust, always verify": being inside the network no longer earns automatic access. It is newer N10-009 material (alongside SDN, SD-WAN, SASE). Think of a building where every door needs a badge swipe, not just the front entrance.',
  },
  {
    id: 'q-ids-ips-1',
    domain: '4.0',
    topic: 'Security devices',
    conceptId: 'firewall',
    resourceLabel: 'Firewall demo',
    question:
      'You want a device that not only detects malicious traffic but actively BLOCKS it inline as it passes. Which is the correct choice?',
    choices: ['IDS (Intrusion Detection System)', 'IPS (Intrusion Prevention System)', 'A syslog server', 'A spanning-tree bridge'],
    answer: 1,
    explanation:
      'An IPS sits inline and stops bad traffic in real time. An IDS only watches and alerts. It detects but does not block. Memory hook: Prevention = blocks, Detection = just tells you.',
  },
  {
    id: 'q-cast-1',
    domain: '1.0',
    topic: 'Traffic types',
    conceptId: 'ip',
    question: 'A router sends a single stream of video to a group of subscribed hosts (and only them). Which delivery method is this?',
    choices: ['Unicast', 'Broadcast', 'Multicast', 'Anycast'],
    answer: 2,
    explanation:
      'Multicast = one-to-many for a subscribed group (efficient for streaming). Unicast = one-to-one. Broadcast = one-to-all on the subnet. Anycast = one-to-nearest. Picking the right one saves bandwidth.',
  },
];
