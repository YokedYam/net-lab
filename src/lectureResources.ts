import type { QuizQuestion } from './quizData';
import type { ConceptId } from './study';

export interface LectureResource {
  id: string;
  title: string;
  section: string;
  url: string;
}

const PM_BASE = 'https://www.professormesser.com/network-plus/n10-009/n10-009-video';

const R: Record<string, LectureResource> = {
  osi: {
    id: 'osi',
    title: 'Understanding the OSI Model',
    section: '1.1',
    url: `${PM_BASE}/understanding-the-osi-model-n10-009/`,
  },
  devices: {
    id: 'devices',
    title: 'Networking Devices',
    section: '1.2',
    url: `${PM_BASE}/networking-devices-n10-009/`,
  },
  functions: {
    id: 'functions',
    title: 'Networking Functions',
    section: '1.2',
    url: `${PM_BASE}/networking-functions-n10-009/`,
  },
  cloud: {
    id: 'cloud',
    title: 'Designing the Cloud',
    section: '1.3',
    url: `${PM_BASE}/designing-the-cloud-n10-009/`,
  },
  ipIntro: {
    id: 'ipIntro',
    title: 'Introduction to IP',
    section: '1.4',
    url: `${PM_BASE}/introduction-to-ip-n10-009/`,
  },
  ports: {
    id: 'ports',
    title: 'Common Ports',
    section: '1.4',
    url: `${PM_BASE}/common-ports-n10-009/`,
  },
  protocols: {
    id: 'protocols',
    title: 'Other Useful Protocols',
    section: '1.4',
    url: `${PM_BASE}/other-useful-protocols-n10-009/`,
  },
  communication: {
    id: 'communication',
    title: 'Network Communication',
    section: '1.4',
    url: `${PM_BASE}/network-communication-n10-009/`,
  },
  wirelessBasics: {
    id: 'wirelessBasics',
    title: 'Wireless Networking',
    section: '1.5',
    url: `${PM_BASE}/wireless-networking-n10-009/`,
  },
  fiber: {
    id: 'fiber',
    title: 'Optical Fiber',
    section: '1.5',
    url: `${PM_BASE}/optical-fiber-n10-009/`,
  },
  copper: {
    id: 'copper',
    title: 'Copper Cabling',
    section: '1.5',
    url: `${PM_BASE}/copper-cabling-n10-009/`,
  },
  transceivers: {
    id: 'transceivers',
    title: 'Network Transceivers',
    section: '1.5',
    url: `${PM_BASE}/network-transceivers-n10-009/`,
  },
  topologies: {
    id: 'topologies',
    title: 'Network Topologies',
    section: '1.6',
    url: `${PM_BASE}/network-topologies-n10-009/`,
  },
  ipv4: {
    id: 'ipv4',
    title: 'IPv4 Addressing',
    section: '1.7',
    url: `${PM_BASE}/ipv4-addressing-n10-009/`,
  },
  subnetMasks: {
    id: 'subnetMasks',
    title: 'IPv4 Subnet Masks',
    section: '1.7',
    url: `${PM_BASE}/ipv4-subnet-masks-n10-009/`,
  },
  subnetCalc: {
    id: 'subnetCalc',
    title: 'Calculating IPv4 Subnets and Hosts',
    section: '1.7',
    url: `${PM_BASE}/calculating-ipv4-subnets-and-hosts-n10-009/`,
  },
  ipv6: {
    id: 'ipv6',
    title: 'IPv6 Addressing',
    section: '1.8',
    url: `${PM_BASE}/ipv6-addressing-n10-009/`,
  },
  sdn: {
    id: 'sdn',
    title: 'Software Defined Networking',
    section: '1.8',
    url: `${PM_BASE}/software-defined-networking-n10-009/`,
  },
  zeroTrust: {
    id: 'zeroTrust',
    title: 'Zero Trust',
    section: '1.8',
    url: `${PM_BASE}/zero-trust-n10-009/`,
  },
  staticRouting: {
    id: 'staticRouting',
    title: 'Static Routing',
    section: '2.1',
    url: `${PM_BASE}/static-routing-n10-009/`,
  },
  dynamicRouting: {
    id: 'dynamicRouting',
    title: 'Dynamic Routing',
    section: '2.1',
    url: `${PM_BASE}/dynamic-routing-n10-009/`,
  },
  routingTech: {
    id: 'routingTech',
    title: 'Routing Technologies',
    section: '2.1',
    url: `${PM_BASE}/routing-technologies-n10-009/`,
  },
  nat: {
    id: 'nat',
    title: 'Network Address Translation',
    section: '2.1',
    url: `${PM_BASE}/network-address-translation-n10-009/`,
  },
  vlans: {
    id: 'vlans',
    title: 'VLANs and Trunking',
    section: '2.2',
    url: `${PM_BASE}/vlans-and-trunking-n10-009/`,
  },
  interfaces: {
    id: 'interfaces',
    title: 'Interface Configurations',
    section: '2.2',
    url: `${PM_BASE}/interface-configurations-n10-009/`,
  },
  stp: {
    id: 'stp',
    title: 'Spanning Tree Protocol',
    section: '2.2',
    url: `${PM_BASE}/spanning-tree-protocol-n10-009/`,
  },
  wirelessTech: {
    id: 'wirelessTech',
    title: 'Wireless Technologies',
    section: '2.3',
    url: `${PM_BASE}/wireless-technologies-n10-009/`,
  },
  wirelessDesign: {
    id: 'wirelessDesign',
    title: 'Wireless Networking',
    section: '2.3',
    url: `${PM_BASE}/wireless-networking-n10-009-2/`,
  },
  wirelessEncryption: {
    id: 'wirelessEncryption',
    title: 'Wireless Encryption',
    section: '2.3',
    url: `${PM_BASE}/wireless-encryption-n10-009/`,
  },
  docs: {
    id: 'docs',
    title: 'Network Documentation',
    section: '3.1',
    url: `${PM_BASE}/network-documentation-n10-009/`,
  },
  snmp: {
    id: 'snmp',
    title: 'SNMP',
    section: '3.2',
    url: `${PM_BASE}/snmp-n10-009/`,
  },
  logs: {
    id: 'logs',
    title: 'Logs and Monitoring',
    section: '3.2',
    url: `${PM_BASE}/logs-and-monitoring-n10-009/`,
  },
  disaster: {
    id: 'disaster',
    title: 'Disaster Recovery',
    section: '3.3',
    url: `${PM_BASE}/disaster-recovery-n10-009/`,
  },
  redundancy: {
    id: 'redundancy',
    title: 'Network Redundancy',
    section: '3.3',
    url: `${PM_BASE}/network-redundancy-n10-009/`,
  },
  dhcp: {
    id: 'dhcp',
    title: 'DHCP',
    section: '3.4',
    url: `${PM_BASE}/dhcp-n10-009/`,
  },
  dhcpConfig: {
    id: 'dhcpConfig',
    title: 'Configuring DHCP',
    section: '3.4',
    url: `${PM_BASE}/configuring-dhcp-n10-009/`,
  },
  slaac: {
    id: 'slaac',
    title: 'IPv6 and SLAAC',
    section: '3.4',
    url: `${PM_BASE}/ipv6-and-slaac-n10-009/`,
  },
  dnsOverview: {
    id: 'dnsOverview',
    title: 'An Overview of DNS',
    section: '3.4',
    url: `${PM_BASE}/an-overview-of-dns-n10-009/`,
  },
  dnsRecords: {
    id: 'dnsRecords',
    title: 'DNS Records',
    section: '3.4',
    url: `${PM_BASE}/dns-records-n10-009/`,
  },
  vpn: {
    id: 'vpn',
    title: 'VPNs',
    section: '3.5',
    url: `${PM_BASE}/vpns-n10-009/`,
  },
  remoteAccess: {
    id: 'remoteAccess',
    title: 'Remote Access',
    section: '3.5',
    url: `${PM_BASE}/remote-access-n10-009/`,
  },
  securityConcepts: {
    id: 'securityConcepts',
    title: 'Security Concepts',
    section: '4.1',
    url: `${PM_BASE}/security-concepts-n10-009/`,
  },
  authentication: {
    id: 'authentication',
    title: 'Authentication',
    section: '4.1',
    url: `${PM_BASE}/authentication-n10-009/`,
  },
  segmentation: {
    id: 'segmentation',
    title: 'Segmentation Enforcement',
    section: '4.1',
    url: `${PM_BASE}/segmentation-enforcement-n10-009/`,
  },
  dos: {
    id: 'dos',
    title: 'Denial of Service',
    section: '4.2',
    url: `${PM_BASE}/denial-of-service-n10-009/`,
  },
  macFlooding: {
    id: 'macFlooding',
    title: 'MAC Flooding',
    section: '4.2',
    url: `${PM_BASE}/mac-flooding-n10-009/`,
  },
  poisoning: {
    id: 'poisoning',
    title: 'ARP and DNS Poisoning',
    section: '4.2',
    url: `${PM_BASE}/arp-and-dns-poisoning-n10-009/`,
  },
  rogue: {
    id: 'rogue',
    title: 'Rogue Services',
    section: '4.2',
    url: `${PM_BASE}/rogue-services-n10-009/`,
  },
  deviceSecurity: {
    id: 'deviceSecurity',
    title: 'Device Security',
    section: '4.3',
    url: `${PM_BASE}/device-security-n10-009/`,
  },
  securityRules: {
    id: 'securityRules',
    title: 'Security Rules',
    section: '4.3',
    url: `${PM_BASE}/security-rules-n10-009/`,
  },
  methodology: {
    id: 'methodology',
    title: 'Network Troubleshooting Methodology',
    section: '5.1',
    url: `${PM_BASE}/network-troubleshooting-methodology-n10-009/`,
  },
  cableIssues: {
    id: 'cableIssues',
    title: 'Cable Issues',
    section: '5.2',
    url: `${PM_BASE}/cable-issues-n10-009/`,
  },
  interfaceIssues: {
    id: 'interfaceIssues',
    title: 'Interface Issues',
    section: '5.2',
    url: `${PM_BASE}/interface-issues-n10-009/`,
  },
  routingIssues: {
    id: 'routingIssues',
    title: 'Routing and IP Issues',
    section: '5.3',
    url: `${PM_BASE}/routing-and-ip-issues-n10-009/`,
  },
  performance: {
    id: 'performance',
    title: 'Performance Issues',
    section: '5.4',
    url: `${PM_BASE}/performance-issues-n10-009/`,
  },
  wirelessIssues: {
    id: 'wirelessIssues',
    title: 'Wireless Issues',
    section: '5.4',
    url: `${PM_BASE}/wireless-issues-n10-009/`,
  },
  softwareTools: {
    id: 'softwareTools',
    title: 'Software Tools',
    section: '5.5',
    url: `${PM_BASE}/software-tools-n10-009/`,
  },
  commandLine: {
    id: 'commandLine',
    title: 'Command Line Tools',
    section: '5.5',
    url: `${PM_BASE}/command-line-tools-n10-009/`,
  },
  hardwareTools: {
    id: 'hardwareTools',
    title: 'Hardware Tools',
    section: '5.5',
    url: `${PM_BASE}/hardware-tools-n10-009/`,
  },
};

const CONCEPT_RESOURCES: Partial<Record<ConceptId, string[]>> = {
  ethernet: ['devices'],
  mac: ['devices'],
  switch: ['devices', 'vlans', 'stp'],
  ip: ['ipIntro', 'ipv4', 'ipv6'],
  dhcp: ['dhcp', 'dhcpConfig'],
  subnet: ['subnetMasks', 'subnetCalc'],
  router: ['routingTech', 'nat'],
  gateway: ['routingTech', 'redundancy'],
  routes: ['staticRouting', 'dynamicRouting', 'routingTech'],
  ospf: ['dynamicRouting'],
  bgp: ['dynamicRouting'],
  icmp: ['protocols', 'commandLine'],
  tcp: ['ipIntro', 'ports'],
  udp: ['ports', 'communication'],
  ports: ['ports'],
  firewall: ['securityRules', 'securityConcepts'],
  tls: ['securityConcepts', 'ports'],
  vpn: ['vpn'],
  dns: ['dnsOverview', 'dnsRecords'],
  http: ['ports'],
  loadbalancer: ['functions'],
};

const RULES: { test: RegExp; ids: string[] }[] = [
  { test: /\bdns records?\b|\baaaa\b|\bcname\b|\bmx\b|\bptr\b|\bsoa\b|\btxt\b|\bspf\b|\bns\b/i, ids: ['dnsRecords', 'dnsOverview'] },
  { test: /\bdns\b|name resolution|hostname|fqdn|recursive|reverse lookup/i, ids: ['dnsOverview', 'dnsRecords'] },
  { test: /\bdhcp\b|\bdora\b|lease|scope|relay|helper-address|apipa/i, ids: ['dhcp', 'dhcpConfig'] },
  { test: /\bipv6\b|\bslaac\b|\bnat64\b/i, ids: ['ipv6', 'slaac'] },
  { test: /\bsubnet|cidr|\/\d{1,2}|mask|usable hosts/i, ids: ['subnetMasks', 'subnetCalc'] },
  { test: /\bport\b|ssh|smtp|http|https|rdp|ldap|smb|snmp|ntp|tftp|ftp|imap|pop3/i, ids: ['ports'] },
  { test: /\btcp\b|\budp\b|transport|handshake|connection-oriented/i, ids: ['ipIntro', 'ports'] },
  { test: /\bicmp\b|ping|traceroute|tracert/i, ids: ['protocols', 'commandLine'] },
  { test: /\bospf\b|\bbgp\b|routing protocol|dynamic routing/i, ids: ['dynamicRouting'] },
  { test: /\bstatic route|routing table|longest prefix|gateway of last resort/i, ids: ['staticRouting', 'routingTech'] },
  { test: /\bnat\b|\bpat\b|overload/i, ids: ['nat'] },
  { test: /\bvlan\b|trunk|802\.1q/i, ids: ['vlans'] },
  { test: /\bstp\b|spanning tree|bpdu|switching loop/i, ids: ['stp'] },
  { test: /\blacp\b|link aggregation|mtu|jumbo|duplex/i, ids: ['interfaces', 'interfaceIssues'] },
  { test: /\bwi-?fi\b|wireless|ssid|channel|802\.11|wpa|wep/i, ids: ['wirelessTech', 'wirelessDesign', 'wirelessEncryption'] },
  { test: /\bfiber|single-mode|multimode|lc|sc|st|otdr|transceiver|sfp/i, ids: ['fiber', 'transceivers', 'hardwareTools'] },
  { test: /\bcable|copper|rj45|coax|termination|crc|crosstalk/i, ids: ['copper', 'cableIssues'] },
  { test: /\bsnmp\b|trap|poll|oid|nms/i, ids: ['snmp'] },
  { test: /\bnetflow\b|\bipfix\b|syslog|siem|logs|baseline/i, ids: ['logs'] },
  { test: /\bbackup|rpo|rto|disaster|replication/i, ids: ['disaster'] },
  { test: /\bhsrp\b|\bvrrp\b|\bglbp\b|redundant gateway|fhrp/i, ids: ['redundancy'] },
  { test: /\bvpn\b|split tunnel|remote access/i, ids: ['vpn', 'remoteAccess'] },
  { test: /\bradius\b|ldap|saml|802\.1x|aaa|authentication/i, ids: ['authentication'] },
  { test: /\bdmz\b|acl|firewall|security zone|segmentation/i, ids: ['securityRules', 'segmentation'] },
  { test: /\bdos\b|ddos|amplification|syn flood/i, ids: ['dos'] },
  { test: /\bmac flooding|cam table/i, ids: ['macFlooding'] },
  { test: /\barp poisoning|dns poisoning|on-path|man-in-the-middle/i, ids: ['poisoning'] },
  { test: /\bevil twin|rogue dhcp|rogue ap|rogue service/i, ids: ['rogue'] },
  { test: /\bmethodology|document|preventive measures|theory of probable cause/i, ids: ['methodology'] },
  { test: /\bwireshark|nmap|nslookup|dig|netstat|arp -a|tcpdump/i, ids: ['softwareTools', 'commandLine'] },
  { test: /\btoner|cable tester|loopback plug|tap|port mirror|span|vfl/i, ids: ['hardwareTools'] },
  { test: /\blatency|jitter|packet loss|congestion|bottleneck|qos|shaping|policing/i, ids: ['performance', 'functions'] },
  { test: /\bcloud|vpc|vnet|sase|sd-wan|sdn|vxlan/i, ids: ['cloud', 'sdn', 'zeroTrust'] },
];

export function lectureResourcesForQuestion(q: QuizQuestion, limit = 3): LectureResource[] {
  const text = [q.topic, q.question, ...q.choices].join(' ');
  const ids: string[] = [];

  for (const rule of RULES) {
    if (rule.test.test(text)) ids.push(...rule.ids);
  }

  if (q.conceptId) {
    ids.push(...(CONCEPT_RESOURCES[q.conceptId] ?? []));
  }

  const seen = new Set<string>();
  return ids
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id) => R[id])
    .filter((r): r is LectureResource => Boolean(r))
    .slice(0, limit);
}
