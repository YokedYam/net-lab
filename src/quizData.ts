import type { ConceptId, DomainId } from './study';

export type QuizDifficulty = 'easy' | 'medium';

export interface QuizQuestion {
  id: string;
  domain: DomainId;
  difficulty?: QuizDifficulty;
  topic: string;
  conceptId?: ConceptId; // jumps to the matching Learn demo on a wrong answer
  resourceLabel?: string; // overrides the demo button label
  question: string;
  choices: string[];
  answer: number; // index into choices
  explanation: string; // beginner-friendly "why", with an analogy where it helps
  ai?: boolean; // true for questions generated at runtime by the AI button
}

type QuizQuestionDraft = Omit<QuizQuestion, 'difficulty'> & { difficulty?: QuizDifficulty };

const asDifficulty =
  (difficulty: QuizDifficulty) =>
  (q: QuizQuestionDraft): QuizQuestion => ({ difficulty, ...q });

// Easy mode is the warm-up bank: definitions, true-or-false checks, and simple
// concept anchors. These are meant to build recall before scenario practice.
export const EASY_QUIZ: QuizQuestion[] = (
  [
    {
      id: 'easy-osi-1',
      domain: '1.0',
      topic: 'OSI model',
      conceptId: 'ip',
      question: 'Which OSI layer is responsible for IP addressing and routing?',
      choices: ['Layer 1: Physical', 'Layer 2: Data Link', 'Layer 3: Network', 'Layer 4: Transport'],
      answer: 2,
      explanation:
        'Layer 3 is the Network layer. It uses IP addresses and routers to move traffic between networks. If the question says routing, think Layer 3.',
    },
    {
      id: 'easy-osi-2',
      domain: '1.0',
      topic: 'OSI model',
      conceptId: 'mac',
      question: 'True or false: MAC addresses are used at Layer 2 for local network delivery.',
      choices: ['True', 'False'],
      answer: 0,
      explanation:
        'True. MAC addresses live at Layer 2. They matter on the local link, like from your laptop to the switch or from a router to the next hop.',
    },
    {
      id: 'easy-osi-3',
      domain: '1.0',
      topic: 'OSI model',
      conceptId: 'tcp',
      question: 'Which OSI layer uses TCP and UDP port numbers?',
      choices: ['Layer 2: Data Link', 'Layer 3: Network', 'Layer 4: Transport', 'Layer 7: Application'],
      answer: 2,
      explanation:
        'Layer 4 is the Transport layer. TCP and UDP use port numbers so the traffic reaches the right app on the host.',
    },
    {
      id: 'easy-tcpudp-1',
      domain: '1.0',
      topic: 'TCP vs UDP',
      conceptId: 'tcp',
      question: 'Which transport protocol is connection-oriented and uses acknowledgments?',
      choices: ['TCP', 'UDP', 'ICMP', 'ARP'],
      answer: 0,
      explanation:
        'TCP is the reliable one. It sets up a connection, tracks sequence numbers, and retransmits missing data.',
    },
    {
      id: 'easy-tcpudp-2',
      domain: '1.0',
      topic: 'TCP vs UDP',
      conceptId: 'udp',
      question: 'True or false: UDP is often used for voice, video, and gaming because low delay matters more than retransmitting old packets.',
      choices: ['True', 'False'],
      answer: 0,
      explanation:
        'True. UDP does not wait around for acknowledgments. For real-time traffic, late data is usually worse than missing data.',
    },
    {
      id: 'easy-dns-1',
      domain: '1.0',
      topic: 'DNS',
      conceptId: 'dns',
      question: 'What does DNS do?',
      choices: ['Turns names into IP addresses', 'Hands out IP leases', 'Encrypts Wi-Fi', 'Blocks switching loops'],
      answer: 0,
      explanation:
        'DNS turns a name like google.com into an IP address. If an IP works but a name fails, DNS is the first thing to check.',
    },
    {
      id: 'easy-dns-2',
      domain: '1.0',
      topic: 'DNS records',
      conceptId: 'dns',
      question: 'Which DNS record maps a hostname to an IPv4 address?',
      choices: ['A', 'AAAA', 'MX', 'TXT'],
      answer: 0,
      explanation:
        'An A record points a name to an IPv4 address. AAAA points to IPv6, MX points to mail servers, and TXT stores text values.',
    },
    {
      id: 'easy-dns-3',
      domain: '1.0',
      topic: 'DNS records',
      conceptId: 'dns',
      question: 'Which DNS record maps a hostname to an IPv6 address?',
      choices: ['A', 'AAAA', 'CNAME', 'PTR'],
      answer: 1,
      explanation:
        'AAAA, pronounced quad-A, maps a name to IPv6. The longer address gets the record with four As.',
    },
    {
      id: 'easy-dhcp-1',
      domain: '1.0',
      topic: 'DHCP',
      conceptId: 'dhcp',
      question: 'What does DHCP provide to clients?',
      choices: ['IP settings automatically', 'Encrypted web traffic', 'MAC address lookups', 'Wireless channels'],
      answer: 0,
      explanation:
        'DHCP automatically gives clients IP settings such as address, subnet mask, default gateway, DNS server, and lease time.',
    },
    {
      id: 'easy-dhcp-2',
      domain: '1.0',
      topic: 'DHCP',
      conceptId: 'dhcp',
      question: 'What is the DHCP four-step process called?',
      choices: ['DORA', 'CIA', 'AAA', 'STP'],
      answer: 0,
      explanation:
        'DORA means Discover, Offer, Request, Acknowledge. It is the basic DHCP lease flow.',
    },
    {
      id: 'easy-ip-1',
      domain: '1.0',
      topic: 'Private IP ranges',
      conceptId: 'ip',
      question: 'Which range is private under RFC 1918?',
      choices: ['10.0.0.0/8', '8.8.8.0/24', '172.32.0.0/16', '169.254.0.0/16'],
      answer: 0,
      explanation:
        '10.0.0.0/8 is private. The three private ranges are 10.x.x.x, 172.16.x.x through 172.31.x.x, and 192.168.x.x.',
    },
    {
      id: 'easy-ip-2',
      domain: '1.0',
      topic: 'Private IP ranges',
      conceptId: 'ip',
      question: 'True or false: 172.32.5.10 is a private IPv4 address.',
      choices: ['True', 'False'],
      answer: 1,
      explanation:
        'False. Only 172.16.0.0 through 172.31.255.255 is private. 172.32.x.x is outside the private range.',
    },
    {
      id: 'easy-apipa-1',
      domain: '5.0',
      topic: 'APIPA',
      conceptId: 'dhcp',
      question: 'A Windows client has 169.254.20.10. What does that usually mean?',
      choices: ['DHCP failed', 'DNS failed', 'NAT is working', 'The address is public'],
      answer: 0,
      explanation:
        '169.254.x.x is APIPA. The client self-assigned it because it could not get an address from DHCP.',
    },
    {
      id: 'easy-nat-1',
      domain: '1.0',
      topic: 'NAT / PAT',
      conceptId: 'router',
      resourceLabel: 'Router demo',
      question: 'What does NAT do?',
      choices: ['Translates private addresses to public addresses', 'Assigns VLAN tags', 'Synchronizes clocks', 'Finds MAC addresses'],
      answer: 0,
      explanation:
        'NAT translates internal private addresses to public addresses so private hosts can reach the internet.',
    },
    {
      id: 'easy-pat-1',
      domain: '1.0',
      topic: 'NAT / PAT',
      conceptId: 'router',
      resourceLabel: 'Router demo',
      question: 'True or false: PAT lets many inside devices share one public IP by tracking port numbers.',
      choices: ['True', 'False'],
      answer: 0,
      explanation:
        'True. PAT is NAT overload. It uses port numbers to keep many private sessions mapped to one public address.',
    },
    {
      id: 'easy-arp-1',
      domain: '1.0',
      topic: 'ARP',
      conceptId: 'mac',
      question: 'What does ARP resolve?',
      choices: ['IP address to MAC address', 'Hostname to IP address', 'Port to protocol', 'SSID to channel'],
      answer: 0,
      explanation:
        'ARP maps an IPv4 address to the MAC address needed for local delivery. DNS maps names to IPs.',
    },
    {
      id: 'easy-gateway-1',
      domain: '1.0',
      topic: 'Default gateway',
      conceptId: 'gateway',
      question: 'What is a default gateway?',
      choices: ['The router a host uses to reach other networks', 'The DNS server for a domain', 'The switch MAC table', 'The first usable DHCP lease only'],
      answer: 0,
      explanation:
        'The default gateway is the local router address a host sends traffic to when the destination is outside its own subnet.',
    },
    {
      id: 'easy-subnet-1',
      domain: '1.0',
      topic: 'Subnetting',
      conceptId: 'subnet',
      question: 'How many usable host addresses are in a /24 subnet?',
      choices: ['254', '256', '255', '128'],
      answer: 0,
      explanation:
        '/24 leaves 8 host bits. 2^8 is 256 total addresses, minus network and broadcast gives 254 usable hosts.',
    },
    {
      id: 'easy-subnet-2',
      domain: '1.0',
      topic: 'Subnetting',
      conceptId: 'subnet',
      question: 'True or false: the network address and broadcast address can be assigned to hosts.',
      choices: ['True', 'False'],
      answer: 1,
      explanation:
        'False. Those two addresses are reserved. That is why usable host math subtracts 2.',
    },
    {
      id: 'easy-icmp-1',
      domain: '5.0',
      topic: 'Tools',
      conceptId: 'icmp',
      question: 'Which protocol does ping use to test reachability?',
      choices: ['ICMP', 'SMTP', 'SNMP', 'LDAP'],
      answer: 0,
      explanation:
        'ping uses ICMP echo request and echo reply. It is a reachability test, not a port test.',
    },
    {
      id: 'easy-switch-1',
      domain: '2.0',
      topic: 'Switching',
      conceptId: 'switch',
      question: 'What does a switch primarily use to forward frames?',
      choices: ['MAC addresses', 'IP routes', 'DNS records', 'Port numbers'],
      answer: 0,
      explanation:
        'Switches forward Layer 2 frames using MAC addresses in a MAC or CAM table.',
    },
    {
      id: 'easy-vlan-1',
      domain: '2.0',
      topic: 'VLANs',
      conceptId: 'switch',
      resourceLabel: 'Switch demo',
      question: 'What does a VLAN create?',
      choices: ['A separate broadcast domain', 'A faster DNS lookup', 'A public IP address', 'A wireless password'],
      answer: 0,
      explanation:
        'A VLAN creates a separate broadcast domain on shared switch hardware. It is a logical split, not a new physical switch.',
    },
    {
      id: 'easy-trunk-1',
      domain: '2.0',
      topic: 'VLANs',
      conceptId: 'switch',
      resourceLabel: 'Switch demo',
      question: 'Which standard tags VLAN traffic across a trunk link?',
      choices: ['802.1Q', '802.1X', '802.11ax', '802.3af'],
      answer: 0,
      explanation:
        '802.1Q is VLAN tagging. 802.1X is authentication, 802.11 is Wi-Fi, and 802.3af is PoE.',
    },
    {
      id: 'easy-stp-1',
      domain: '2.0',
      topic: 'Switching loops',
      conceptId: 'switch',
      resourceLabel: 'Switch demo',
      question: 'What problem does STP prevent?',
      choices: ['Switching loops and broadcast storms', 'Bad DNS records', 'Weak Wi-Fi encryption', 'Expired DHCP leases'],
      answer: 0,
      explanation:
        'STP blocks redundant Layer 2 paths so frames do not loop forever. The exam often ties STP to broadcast storms.',
    },
    {
      id: 'easy-stp-2',
      domain: '2.0',
      topic: 'Switching loops',
      conceptId: 'switch',
      resourceLabel: 'Switch demo',
      question: 'Which STP version converges faster than classic STP?',
      choices: ['RSTP', 'RIP', 'RADIUS', 'RDP'],
      answer: 0,
      explanation:
        'RSTP means Rapid Spanning Tree Protocol. Rapid is the hint: it converges much faster than classic STP.',
    },
    {
      id: 'easy-poe-1',
      domain: '2.0',
      topic: 'PoE',
      question: 'What does PoE allow an Ethernet cable to carry?',
      choices: ['Data and electrical power', 'Fiber and copper at once', 'Two SSIDs only', 'Only voice traffic'],
      answer: 0,
      explanation:
        'Power over Ethernet carries data and power on the same cable. Access points, cameras, and VoIP phones use it a lot.',
    },
    {
      id: 'easy-fiber-1',
      domain: '2.0',
      topic: 'Fiber',
      question: 'Which fiber type is best for very long distances?',
      choices: ['Single-mode fiber', 'Multimode fiber', 'Cat 6a', 'Coax'],
      answer: 0,
      explanation:
        'Single-mode fiber uses a narrow core and laser light for long distance runs. Multimode is usually shorter range.',
    },
    {
      id: 'easy-cable-1',
      domain: '2.0',
      topic: 'Cabling',
      question: 'What is the usual maximum distance for copper Ethernet runs?',
      choices: ['100 meters', '10 meters', '1 kilometer', '20 kilometers'],
      answer: 0,
      explanation:
        'Copper Ethernet is usually limited to 100 meters. Longer runs push you toward fiber.',
    },
    {
      id: 'easy-wifi-1',
      domain: '2.0',
      topic: 'Wireless',
      question: 'Which Wi-Fi band usually has the best range but the most congestion?',
      choices: ['2.4 GHz', '5 GHz', '6 GHz', '60 GHz'],
      answer: 0,
      explanation:
        '2.4 GHz travels farther and goes through walls better, but it is crowded and has fewer clean channels.',
    },
    {
      id: 'easy-wifi-2',
      domain: '2.0',
      topic: 'Wireless',
      question: 'Which 2.4 GHz Wi-Fi channels are the common non-overlapping choices?',
      choices: ['1, 6, and 11', '2, 4, and 8', '10, 20, and 30', '36, 40, and 44'],
      answer: 0,
      explanation:
        'In 2.4 GHz, the clean non-overlapping channel set is 1, 6, and 11. That one is worth memorizing cold.',
    },
    {
      id: 'easy-wifi-3',
      domain: '2.0',
      topic: 'Wireless',
      question: 'Which Wi-Fi standard is also called Wi-Fi 6?',
      choices: ['802.11ax', '802.11ac', '802.11n', '802.11g'],
      answer: 0,
      explanation:
        '802.11ax is Wi-Fi 6. 802.11ac is Wi-Fi 5, and 802.11n is Wi-Fi 4.',
    },
    {
      id: 'easy-routing-1',
      domain: '2.0',
      topic: 'Routing protocols',
      conceptId: 'ospf',
      question: 'Which routing protocol is a link-state interior gateway protocol?',
      choices: ['OSPF', 'BGP', 'RIP', 'ARP'],
      answer: 0,
      explanation:
        'OSPF is link-state and used inside an organization. It chooses paths based on cost.',
    },
    {
      id: 'easy-routing-2',
      domain: '2.0',
      topic: 'Routing protocols',
      conceptId: 'bgp',
      question: 'Which routing protocol connects autonomous systems on the internet?',
      choices: ['BGP', 'OSPF', 'EIGRP', 'STP'],
      answer: 0,
      explanation:
        'BGP is the exterior routing protocol used between autonomous systems. It is the routing protocol of the internet.',
    },
    {
      id: 'easy-sdwan-1',
      domain: '2.0',
      topic: 'SD-WAN',
      conceptId: 'routes',
      question: 'What is SD-WAN mainly used for?',
      choices: ['Centrally managing WAN paths across links like MPLS, broadband, and LTE', 'Assigning DHCP leases on a LAN', 'Replacing DNS records', 'Encrypting a Wi-Fi password'],
      answer: 0,
      explanation:
        'SD-WAN uses software control to steer WAN traffic across multiple underlay links. Think branch offices picking the best path automatically.',
    },
    {
      id: 'easy-snmp-1',
      domain: '3.0',
      topic: 'Monitoring',
      question: 'What is SNMP used for?',
      choices: ['Monitoring and managing network devices', 'Sending email between servers', 'Resolving hostnames', 'Authenticating Wi-Fi users'],
      answer: 0,
      explanation:
        'SNMP is for monitoring and managing devices like switches, routers, and firewalls. SNMPv3 is the secure version.',
    },
    {
      id: 'easy-syslog-1',
      domain: '3.0',
      topic: 'Logging',
      question: 'True or false: syslog severity 0 is more severe than severity 7.',
      choices: ['True', 'False'],
      answer: 0,
      explanation:
        'True. Syslog runs from 0 Emergency to 7 Debug. Lower number means more severe.',
    },
    {
      id: 'easy-syslog-2',
      domain: '3.0',
      topic: 'Logging',
      question: 'What is syslog mainly for?',
      choices: ['Collecting event messages with severity levels', 'Tracking which admin typed every command', 'Assigning IP addresses', 'Finding wireless channels'],
      answer: 0,
      explanation:
        'Syslog collects event messages and severity levels. For who typed which config command, think TACACS+ accounting or change logs.',
    },
    {
      id: 'easy-ntp-1',
      domain: '3.0',
      topic: 'Network services',
      question: 'What does NTP do?',
      choices: ['Synchronizes device clocks', 'Translates IP addresses', 'Blocks malware inline', 'Tags VLANs'],
      answer: 0,
      explanation:
        'NTP keeps clocks synced. That matters because troubleshooting and incident logs are useless when every device has a different time.',
    },
    {
      id: 'easy-qos-1',
      domain: '3.0',
      topic: 'QoS',
      conceptId: 'udp',
      resourceLabel: 'UDP demo',
      question: 'What does QoS help with?',
      choices: ['Prioritizing time-sensitive traffic like voice', 'Creating private IPv4 ranges', 'Preventing ARP lookups', 'Replacing a firewall'],
      answer: 0,
      explanation:
        'QoS prioritizes traffic that is sensitive to delay, like voice and video, so big downloads do not ruin calls.',
    },
    {
      id: 'easy-dr-1',
      domain: '3.0',
      topic: 'Disaster recovery',
      question: 'Which metric means how long you can be down before recovery must be complete?',
      choices: ['RTO', 'RPO', 'MTBF', 'MTTR'],
      answer: 0,
      explanation:
        'RTO is Recovery Time Objective. It answers how quickly service must be restored.',
    },
    {
      id: 'easy-dr-2',
      domain: '3.0',
      topic: 'Disaster recovery',
      question: 'Which metric means how much data loss is acceptable, measured in time?',
      choices: ['RPO', 'RTO', 'MTBF', 'MTU'],
      answer: 0,
      explanation:
        'RPO is Recovery Point Objective. It answers how far back you can restore without losing too much data.',
    },
    {
      id: 'easy-jumbo-1',
      domain: '3.0',
      topic: 'Jumbo frames',
      question: 'What are jumbo frames?',
      choices: ['Ethernet frames with an MTU around 9000 bytes', 'Tiny DNS packets', 'Wireless channels above 6 GHz', 'Encrypted syslog messages'],
      answer: 0,
      explanation:
        'Jumbo frames raise MTU from the usual 1500 bytes to around 9000. They show up in datacenter and storage network contexts.',
    },
    {
      id: 'easy-fhrp-1',
      domain: '3.0',
      topic: 'High availability',
      conceptId: 'gateway',
      resourceLabel: 'Gateway demo',
      question: 'What does FHRP provide?',
      choices: ['A redundant default gateway using a shared virtual IP', 'Encrypted DNS queries', 'A faster DHCP lease', 'A new Wi-Fi band'],
      answer: 0,
      explanation:
        'First Hop Redundancy Protocols let routers share a virtual gateway IP so hosts keep working if one router fails.',
    },
    {
      id: 'easy-fhrp-2',
      domain: '3.0',
      topic: 'High availability',
      conceptId: 'gateway',
      resourceLabel: 'Gateway demo',
      question: 'Which FHRP is Cisco proprietary and uses active/standby routers?',
      choices: ['HSRP', 'VRRP', 'GLBP', 'OSPF'],
      answer: 0,
      explanation:
        'HSRP is Cisco proprietary and uses active/standby. VRRP is the open standard. GLBP is Cisco and adds load balancing.',
    },
    {
      id: 'easy-cia-1',
      domain: '4.0',
      topic: 'Security concepts',
      question: 'What does the C in CIA stand for?',
      choices: ['Confidentiality', 'Control', 'Credential', 'Certificate'],
      answer: 0,
      explanation:
        'CIA means Confidentiality, Integrity, and Availability. Confidentiality is keeping data secret.',
    },
    {
      id: 'easy-aaa-1',
      domain: '4.0',
      topic: 'Authentication',
      question: 'What does AAA stand for?',
      choices: ['Authentication, Authorization, Accounting', 'Access, Addressing, Auditing', 'Availability, Accuracy, Assurance', 'Allow, Alert, Archive'],
      answer: 0,
      explanation:
        'AAA is Authentication, Authorization, and Accounting. Who are you, what are you allowed to do, and what did you do?',
    },
    {
      id: 'easy-tacacs-1',
      domain: '4.0',
      topic: 'Authentication',
      question: 'Which AAA protocol is preferred for network device administration and encrypts the full packet?',
      choices: ['TACACS+', 'RADIUS', 'SNMPv2c', 'LDAP only'],
      answer: 0,
      explanation:
        'TACACS+ is commonly used for device administration. It separates AAA functions and encrypts the full packet.',
    },
    {
      id: 'easy-radius-1',
      domain: '4.0',
      topic: 'Authentication',
      question: 'Which AAA protocol is commonly used with 802.1X for network access?',
      choices: ['RADIUS', 'TACACS+', 'BGP', 'NTP'],
      answer: 0,
      explanation:
        'RADIUS is commonly used for network access authentication, especially with 802.1X wired or wireless access.',
    },
    {
      id: 'easy-vpn-1',
      domain: '4.0',
      topic: 'VPN',
      conceptId: 'vpn',
      question: 'True or false: split tunneling sends only corporate traffic through the VPN.',
      choices: ['True', 'False'],
      answer: 0,
      explanation:
        'True. Split tunneling sends corporate-bound traffic through the VPN while normal internet browsing uses the local connection.',
    },
    {
      id: 'easy-vpn-2',
      domain: '4.0',
      topic: 'VPN',
      conceptId: 'vpn',
      question: 'What does full tunneling do?',
      choices: ['Routes all traffic through the VPN', 'Routes no traffic through the VPN', 'Only encrypts DNS', 'Only connects switches'],
      answer: 0,
      explanation:
        'Full tunneling sends everything through the VPN, including normal internet browsing. It gives more central control but can add load and latency.',
    },
    {
      id: 'easy-8021x-1',
      domain: '4.0',
      topic: 'Authentication',
      question: 'What does 802.1X provide?',
      choices: ['Port-based network access control', 'VLAN trunk tagging', 'Power over Ethernet', 'Wi-Fi channel bonding'],
      answer: 0,
      explanation:
        '802.1X makes a device or user authenticate before the switch port or Wi-Fi access opens up.',
    },
    {
      id: 'easy-idsips-1',
      domain: '4.0',
      topic: 'Security devices',
      conceptId: 'firewall',
      resourceLabel: 'Firewall demo',
      question: 'Which system can actively block malicious traffic inline?',
      choices: ['IPS', 'IDS', 'Syslog', 'NTP'],
      answer: 0,
      explanation:
        'IPS means Intrusion Prevention System. Prevention blocks. IDS detects and alerts.',
    },
    {
      id: 'easy-honeynet-1',
      domain: '4.0',
      topic: 'Security concepts',
      question: 'What is a honeynet?',
      choices: ['A group of decoy systems used to attract and study attackers', 'A faster DNS resolver', 'A private IPv6 range', 'A Wi-Fi mesh standard'],
      answer: 0,
      explanation:
        'A honeynet is a network of decoy systems. It is meant to lure attackers away from real assets and reveal their behavior.',
    },
    {
      id: 'easy-method-1',
      domain: '5.0',
      topic: 'Troubleshooting methodology',
      question: 'What is the first step in the CompTIA troubleshooting methodology?',
      choices: ['Identify the problem', 'Implement a fix', 'Document findings', 'Escalate immediately'],
      answer: 0,
      explanation:
        'Start by identifying the problem: gather information, question users, and find out what changed. Do not jump straight to a fix.',
    },
    {
      id: 'easy-loopback-1',
      domain: '5.0',
      topic: 'Tools',
      conceptId: 'icmp',
      question: 'What does pinging 127.0.0.1 test?',
      choices: ['The local TCP/IP stack', 'The default gateway', 'The DNS server', 'The internet path'],
      answer: 0,
      explanation:
        '127.0.0.1 is loopback. It tests your own TCP/IP stack without touching the network.',
    },
    {
      id: 'easy-dns-trouble-1',
      domain: '5.0',
      topic: 'Troubleshooting',
      conceptId: 'dns',
      question: 'A user can ping 8.8.8.8 but cannot ping google.com. What is the likely issue?',
      choices: ['DNS', 'Bad cable', 'Loopback failure', 'Wrong duplex only'],
      answer: 0,
      explanation:
        'If an IP works but a name fails, routing is probably working and DNS is the likely issue.',
    },
    {
      id: 'easy-tool-1',
      domain: '5.0',
      topic: 'Tools',
      question: 'Which command shows IP address, subnet mask, gateway, and DNS settings on Windows?',
      choices: ['ipconfig', 'netstat', 'tracert', 'arp -a'],
      answer: 0,
      explanation:
        'ipconfig shows Windows IP configuration. Use ipconfig /all when you need the full detail.',
    },
    {
      id: 'easy-tool-2',
      domain: '5.0',
      topic: 'Tools',
      question: 'Which command shows active network connections and listening ports?',
      choices: ['netstat', 'nslookup', 'arp -a', 'ipconfig /release'],
      answer: 0,
      explanation:
        'netstat shows active connections and listening ports. It is useful when you need to see what a host is actually talking to.',
    },
    {
      id: 'easy-tool-3',
      domain: '5.0',
      topic: 'Tools',
      question: 'Which tool captures and analyzes packets from the network?',
      choices: ['tcpdump or Wireshark', 'NTP', 'DHCP', 'RADIUS'],
      answer: 0,
      explanation:
        'tcpdump and Wireshark capture packets. Use them when you need to inspect traffic instead of guessing.',
    },
    {
      id: 'easy-physical-1',
      domain: '5.0',
      topic: 'Common issues',
      question: 'A shorted cable is most likely a problem at which OSI layer?',
      choices: ['Layer 1: Physical', 'Layer 2: Data Link', 'Layer 3: Network', 'Layer 7: Application'],
      answer: 0,
      explanation:
        'Bad cables, wrong transceivers, bent pins, and link lights are Layer 1 problems. Start physical before chasing software.',
    },
    {
      id: 'easy-duplex-1',
      domain: '5.0',
      topic: 'Common issues',
      question: 'Which issue is associated with late collisions and a slow-but-working Ethernet link?',
      choices: ['Duplex mismatch', 'DNS typo', 'Wrong MX record', 'Expired certificate only'],
      answer: 0,
      explanation:
        'Late collisions and a slow link point to a duplex mismatch. One side may be half-duplex while the other is full-duplex.',
    },
  ] satisfies QuizQuestionDraft[]
).map(asDifficulty('easy'));

// A practice pool written in the scenario / "BEST answer" style the real
// Network+ (N10-009) uses. Plain-English explanations, analogies for beginners.
export const MEDIUM_QUIZ: QuizQuestion[] = (
  [
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
  ] satisfies QuizQuestionDraft[]
).map(asDifficulty('medium'));

export const QUIZ: QuizQuestion[] = [...EASY_QUIZ, ...MEDIUM_QUIZ];
