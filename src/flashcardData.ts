import type { ConceptId, DomainId } from './study';

export interface Flashcard {
  id: string;
  domain: DomainId;
  topic: string;
  conceptId?: ConceptId; // links to a Learn demo
  front: string;
  back: string;
}

// High-yield + commonly-confused Network+ facts. Fronts are quick prompts;
// backs are plain-English answers with a memory hook where it helps.
export const FLASHCARDS: Flashcard[] = [
  // ---- Ports & protocols (memorize these for the exam) ----
  { id: 'fc-port-ftp', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'FTP: port(s) and transport?', back: 'TCP 20 (data) and 21 (control). Transfers files; unencrypted.' },
  { id: 'fc-port-ssh', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'SSH: port and use?', back: 'TCP 22. Encrypted remote shell/admin. SFTP and SCP ride on it too.' },
  { id: 'fc-port-telnet', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'Telnet: port and warning?', back: 'TCP 23. Remote shell but unencrypted. Use SSH (22) instead.' },
  { id: 'fc-port-smtp', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'SMTP: port and use?', back: 'TCP 25. Sends email between servers. (587 for secure submission.)' },
  { id: 'fc-port-dns', domain: '1.0', topic: 'Ports', conceptId: 'dns', front: 'DNS: port and transport?', back: 'Port 53, UDP for lookups, TCP for zone transfers/large replies. Name → IP.' },
  { id: 'fc-port-dhcp', domain: '1.0', topic: 'Ports', conceptId: 'dhcp', front: 'DHCP: ports and transport?', back: 'UDP 67 (server) and 68 (client). Hands out IP config automatically.' },
  { id: 'fc-port-tftp', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'TFTP: port and transport?', back: 'UDP 69. Trivial file transfer: no auth, used for configs/firmware.' },
  { id: 'fc-port-http', domain: '1.0', topic: 'Ports', conceptId: 'http', front: 'HTTP: port?', back: 'TCP 80. Unencrypted web traffic.' },
  { id: 'fc-port-https', domain: '1.0', topic: 'Ports', conceptId: 'tls', front: 'HTTPS: port and what secures it?', back: 'TCP 443. HTTP wrapped in TLS for encryption.' },
  { id: 'fc-port-ntp', domain: '3.0', topic: 'Ports', front: 'NTP: port and use?', back: 'UDP 123. Synchronizes clocks across devices.' },
  { id: 'fc-port-snmp', domain: '3.0', topic: 'Ports', front: 'SNMP: ports and use?', back: 'UDP 161 (queries) and 162 (traps). Monitor/manage network devices. Use v3 for encryption.' },
  { id: 'fc-port-ldap', domain: '4.0', topic: 'Ports', front: 'LDAP / LDAPS: ports?', back: 'LDAP TCP 389, LDAPS (encrypted) TCP 636. Directory lookups (e.g., Active Directory).' },
  { id: 'fc-port-rdp', domain: '2.0', topic: 'Ports', front: 'RDP: port and use?', back: 'TCP 3389. Remote Desktop to Windows machines.' },
  { id: 'fc-port-smb', domain: '2.0', topic: 'Ports', front: 'SMB: port and use?', back: 'TCP 445. Windows file/printer sharing.' },
  { id: 'fc-port-syslog', domain: '3.0', topic: 'Ports', front: 'Syslog: port?', back: 'UDP 514. Centralized logging from network devices.' },
  { id: 'fc-port-sqlmail', domain: '1.0', topic: 'Ports', conceptId: 'ports', front: 'POP3 vs IMAP: ports?', back: 'POP3 TCP 110 (downloads + removes). IMAP TCP 143 (syncs, keeps mail on server). Secure: 995 / 993.' },

  // ---- OSI model ----
  { id: 'fc-osi-layers', domain: '1.0', topic: 'OSI model', front: 'Name the 7 OSI layers, 1→7.', back: 'Physical, Data Link, Network, Transport, Session, Presentation, Application. Mnemonic: "Please Do Not Throw Sausage Pizza Away."' },
  { id: 'fc-osi-l2', domain: '1.0', topic: 'OSI model', conceptId: 'mac', front: 'OSI Layer 2: name, address, device?', back: 'Data Link. Uses MAC addresses. Switches live here. Forwards frames on the local link.' },
  { id: 'fc-osi-l3', domain: '1.0', topic: 'OSI model', conceptId: 'router', front: 'OSI Layer 3: name, address, device?', back: 'Network. Uses IP addresses. Routers live here. Routes packets between networks.' },
  { id: 'fc-osi-l4', domain: '1.0', topic: 'OSI model', conceptId: 'tcp', front: 'OSI Layer 4: name and protocols?', back: 'Transport. TCP (reliable) and UDP (fast). Uses port numbers to reach the right app.' },
  { id: 'fc-osi-pdu', domain: '1.0', topic: 'OSI model', front: 'PDU names at L2 / L3 / L4?', back: 'L2 = frame, L3 = packet, L4 = segment (TCP) / datagram (UDP). "Some People Fear Birthdays" → Segment, Packet, Frame, Bits.' },

  // ---- Confusion pairs (the ones beginners mix up) ----
  { id: 'fc-conf-macip', domain: '1.0', topic: 'Confusion pairs', conceptId: 'mac', front: 'MAC vs IP: what is the difference?', back: 'MAC = physical, burned-in, used on the local link, never changes. IP = logical, assigned, used to route across networks. MAC = street address; IP = full mailing address.' },
  { id: 'fc-conf-tcpudp', domain: '1.0', topic: 'Confusion pairs', conceptId: 'udp', front: 'TCP vs UDP: when to use each?', back: 'TCP: reliable, ordered, does a handshake. Good for web, email, file transfer. UDP: fast, connectionless. Good for voice, video, DNS, gaming. "Lost packet useless? Use UDP."' },
  { id: 'fc-conf-hubswitch', domain: '2.0', topic: 'Confusion pairs', conceptId: 'switch', front: 'Hub vs Switch vs Router?', back: 'Hub: dumb, repeats to all ports (L1). Switch: forwards by MAC, one network (L2). Router: connects different networks by IP (L3).' },
  { id: 'fc-conf-routerswitch', domain: '2.0', topic: 'Confusion pairs', conceptId: 'router', front: 'Switch vs Router: one-liner?', back: 'Switch connects devices WITHIN one network (L2, MAC). Router connects DIFFERENT networks together (L3, IP).' },
  { id: 'fc-conf-tlsssl', domain: '4.0', topic: 'Confusion pairs', conceptId: 'tls', front: 'TLS vs SSL?', back: 'Same idea: encrypt data in transit. SSL is the old, deprecated version; TLS is the modern, secure replacement. People still say "SSL" but mean TLS.' },
  { id: 'fc-conf-natpat', domain: '1.0', topic: 'Confusion pairs', conceptId: 'router', front: 'NAT vs PAT?', back: 'NAT maps private IPs to public IPs. PAT (NAT overload) maps MANY private IPs to ONE public IP using port numbers. What your home router does.' },
  { id: 'fc-conf-ospfbgp', domain: '2.0', topic: 'Confusion pairs', conceptId: 'bgp', front: 'OSPF vs BGP?', back: 'OSPF = interior (inside one organization), link-state, fast. BGP = exterior, routes between organizations. The internet’s backbone protocol.' },
  { id: 'fc-conf-csma', domain: '2.0', topic: 'Confusion pairs', front: 'CSMA/CD vs CSMA/CA?', back: 'CD = Collision Detection (old wired Ethernet, detect after). CA = Collision Avoidance (Wi-Fi, avoid before). Wireless can’t detect collisions, so it avoids them.' },
  { id: 'fc-conf-rpoto', domain: '3.0', topic: 'Confusion pairs', front: 'RPO vs RTO?', back: 'RPO = how much DATA you can lose (time between backups). RTO = how much TIME to restore service. Point = data, Time = uptime.' },
  { id: 'fc-conf-saml', domain: '4.0', topic: 'Confusion pairs', front: 'Authentication vs Authorization?', back: 'Authentication = proving WHO you are (login). Authorization = what you are ALLOWED to do (permissions). AuthN first, then AuthZ.' },

  // ---- Subnetting ----
  { id: 'fc-sub-hosts', domain: '1.0', topic: 'Subnetting', conceptId: 'subnet', front: 'Formula for usable hosts in a subnet?', back: '2^(host bits) − 2. Subtract 2 for the network and broadcast addresses. /24 → 8 host bits → 254 usable.' },
  { id: 'fc-sub-24', domain: '1.0', topic: 'Subnetting', conceptId: 'subnet', front: '/24: mask and usable hosts?', back: '255.255.255.0, 254 usable hosts.' },
  { id: 'fc-sub-30', domain: '1.0', topic: 'Subnetting', conceptId: 'subnet', front: '/30: mask, usable hosts, common use?', back: '255.255.255.252, 2 usable hosts. Perfect for point-to-point router links.' },
  { id: 'fc-sub-priv', domain: '1.0', topic: 'Subnetting', conceptId: 'ip', front: 'The three private IPv4 ranges?', back: '10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), 192.168.0.0/16. Not routable on the public internet.' },
  { id: 'fc-sub-apipa', domain: '5.0', topic: 'Subnetting', conceptId: 'dhcp', front: 'What does a 169.254.x.x address mean?', back: 'APIPA self-assignment: the host couldn’t reach a DHCP server. Troubleshoot DHCP reachability.' },
  { id: 'fc-sub-magic', domain: '1.0', topic: 'Subnetting', conceptId: 'subnet', front: 'What is the "block size" (magic number) trick?', back: 'Block size = 256 − mask octet. Subnets increment by that. E.g. /26 mask 192 → block size 64 → networks .0, .64, .128, .192.' },

  // ---- Wireless & cabling ----
  { id: 'fc-wifi-bands', domain: '2.0', topic: 'Wireless', front: '2.4 GHz vs 5 GHz trade-off?', back: '2.4 GHz: longer range, more interference, slower. 5 GHz: faster, shorter range. Lower frequency = farther reach.' },
  { id: 'fc-wifi-gen', domain: '2.0', topic: 'Wireless', front: 'Wi-Fi 6 = which 802.11 standard?', back: '802.11ax. Wi-Fi 5 = 802.11ac, Wi-Fi 4 = 802.11n. Higher number = newer/faster.' },
  { id: 'fc-cable-cat', domain: '2.0', topic: 'Cabling', front: 'Cat 5e vs Cat 6 vs Cat 6a speeds?', back: 'Cat 5e: 1 Gbps. Cat 6: 10 Gbps up to ~55 m. Cat 6a: 10 Gbps up to 100 m. Copper Ethernet max run ≈ 100 m.' },
  { id: 'fc-fiber', domain: '2.0', topic: 'Cabling', front: 'Single-mode vs multimode fiber?', back: 'Single-mode: tiny core, laser, very long distance (km+). Multimode: bigger core, LED, shorter runs (campus/building).' },
  { id: 'fc-poe', domain: '2.0', topic: 'Cabling', front: 'What is PoE used for?', back: 'Power over Ethernet: sends power + data over one cable to APs, IP cameras, and phones where there’s no outlet.' },

  // ---- Services & operations ----
  { id: 'fc-dhcp-dora', domain: '1.0', topic: 'DHCP', conceptId: 'dhcp', front: 'The DHCP 4-step process?', back: 'DORA: Discover, Offer, Request, Acknowledge.' },
  { id: 'fc-dns-records', domain: '1.0', topic: 'DNS', conceptId: 'dns', front: 'A vs AAAA vs CNAME vs MX vs PTR?', back: 'A = name→IPv4, AAAA = name→IPv6, CNAME = alias, MX = mail server, PTR = reverse (IP→name).' },
  { id: 'fc-snmp-versions', domain: '3.0', topic: 'Monitoring', front: 'Why use SNMPv3?', back: 'v3 adds authentication and encryption. v1/v2c send community strings in clear text.' },
  { id: 'fc-fhrp', domain: '3.0', topic: 'High availability', conceptId: 'gateway', front: 'What does FHRP (HSRP/VRRP) do?', back: 'Two routers share one virtual gateway IP. If the active dies, the standby takes over: no client changes. A backup gateway.' },
  { id: 'fc-vlan', domain: '2.0', topic: 'VLANs', conceptId: 'switch', front: 'What problem do VLANs solve?', back: 'They split one physical switch into separate logical networks / broadcast domains for segmentation and security.' },

  // ---- Security ----
  { id: 'fc-cia', domain: '4.0', topic: 'Security concepts', front: 'What is the CIA triad?', back: 'Confidentiality (secrecy), Integrity (unaltered), Availability (uptime). The three goals of security.' },
  { id: 'fc-vpn-types', domain: '4.0', topic: 'VPN', conceptId: 'vpn', front: 'Site-to-site vs client-to-site VPN?', back: 'Site-to-site: connects two whole networks (office to office). Client-to-site (remote access): one user’s device tunnels into the network.' },
  { id: 'fc-aaa', domain: '4.0', topic: 'Authentication', front: 'RADIUS vs TACACS+?', back: 'RADIUS: UDP, encrypts only the password, cross-vendor, often Wi-Fi/802.1X. TACACS+: TCP, encrypts the whole payload, Cisco, granular command control.' },
  { id: 'fc-attacks', domain: '4.0', topic: 'Attacks', conceptId: 'tls', front: 'What is an on-path (MITM) attack?', back: 'Attacker secretly relays/alters traffic between two parties (e.g., via ARP poisoning). Encryption (TLS) limits the damage.' },
  { id: 'fc-evil', domain: '4.0', topic: 'Wireless attacks', front: 'Evil twin vs rogue AP?', back: 'Rogue AP = any unauthorized AP on the network. Evil twin = a rogue AP impersonating a legit SSID to lure victims.' },
  { id: 'fc-8021x', domain: '4.0', topic: 'Authentication', front: 'What does 802.1X provide?', back: 'Port-based network access control. A device must authenticate (usually via RADIUS) before the switch port lets it on.' },

  // ---- Troubleshooting ----
  { id: 'fc-method', domain: '5.0', topic: 'Methodology', front: 'CompTIA’s 7 troubleshooting steps in order?', back: '1) Identify the problem 2) Theory of probable cause 3) Test the theory 4) Plan of action 5) Implement 6) Verify full functionality 7) Document.' },
  { id: 'fc-tool-ping', domain: '5.0', topic: 'Tools', conceptId: 'icmp', front: 'ping vs traceroute?', back: 'ping = is it reachable + round-trip time (ICMP). traceroute/tracert = every hop along the path and where delay starts.' },
  { id: 'fc-tool-ipconfig', domain: '5.0', topic: 'Tools', front: 'ipconfig vs ifconfig/ip?', back: 'ipconfig = Windows; ifconfig (older) / ip a (modern) = Linux/macOS. Show interface IP/MAC/gateway config.' },
  { id: 'fc-loopback', domain: '5.0', topic: 'Tools', conceptId: 'icmp', front: 'What is 127.0.0.1?', back: 'The loopback address: pings your own TCP/IP stack. If it fails, the problem is local to the machine.' },
  { id: 'fc-duplex', domain: '5.0', topic: 'Common issues', front: 'Symptom of a duplex mismatch?', back: 'Slow link with late collisions + CRC errors. One side full-duplex, other half. Fix: set both ends the same (auto/auto).' },

  // ---- extra high-yield (added from N10-009 exam research) ----
  { id: 'fc-port-radius', domain: '4.0', topic: 'Ports', front: 'RADIUS & Kerberos: ports?', back: 'RADIUS UDP 1812/1813 (auth/accounting). Kerberos 88. Both used to authenticate users centrally.' },
  { id: 'fc-conf-idsips', domain: '4.0', topic: 'Confusion pairs', conceptId: 'firewall', front: 'IDS vs IPS?', back: 'IDS detects and alerts only (out of band). IPS sits inline and actively blocks. Prevention = blocks; Detection = just warns.' },
  { id: 'fc-conf-cast', domain: '1.0', topic: 'Confusion pairs', conceptId: 'ip', front: 'Unicast vs Multicast vs Broadcast?', back: 'Unicast = one-to-one. Multicast = one-to-many (subscribed group). Broadcast = one-to-all on the subnet. Anycast = one-to-nearest.' },
  { id: 'fc-conf-vlansubnet', domain: '2.0', topic: 'Confusion pairs', conceptId: 'switch', front: 'VLAN vs Subnet?', back: 'VLAN = Layer 2 broadcast-domain segmentation (on the switch). Subnet = Layer 3 IP range. Usually map 1:1, but they live at different layers.' },
  { id: 'fc-conf-duplex2', domain: '2.0', topic: 'Confusion pairs', front: 'Half-duplex vs Full-duplex?', back: 'Half = send OR receive at a time (walkie-talkie). Full = send AND receive at once (phone call). Mismatch = errors and slowness.' },
  { id: 'fc-wpa', domain: '4.0', topic: 'Wireless security', front: 'WPA2 vs WPA3, Personal vs Enterprise?', back: 'WPA3 is newer/stronger (SAE replaces the weak PSK handshake). Personal = one shared key (PSK). Enterprise = 802.1X + RADIUS, per-user logins.' },
  { id: 'fc-sdn', domain: '1.0', topic: 'Modern networks', front: 'What is SDN (and SD-WAN)?', back: 'Software-Defined Networking splits the control plane (decisions) from the data plane (forwarding) for central, programmable control. SD-WAN applies that idea to manage WAN links smartly.' },
  { id: 'fc-zerotrust', domain: '4.0', topic: 'Modern networks', front: 'What is Zero Trust?', back: '"Never trust, always verify." No device/user is trusted just for being inside the network. Every request is authenticated and authorized. New emphasis in N10-009.' },
  { id: 'fc-conf-sftpftps', domain: '4.0', topic: 'Confusion pairs', front: 'SFTP vs FTPS?', back: 'SFTP = file transfer over SSH (port 22), one protocol. FTPS = old FTP wrapped in TLS (ports 989/990). Both secure, totally different under the hood.' },
];
