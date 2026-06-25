import type { TopologyScenario } from './TopologyBoard';

// ---------------------------------------------------------------------------
// Office network. Same content as the original drill, now expressed as data.
// All x/y/w/h are percentages of the diagram box.
// ---------------------------------------------------------------------------
export const OFFICE: TopologyScenario = {
  statusTag: 'office device placement',
  mapLabel: 'Company A office diagram',
  title: 'Company A office network diagram',
  brief:
    'Fill the empty device slots. The internet should hit security first, building A should route VLANs, building B needs its own access layer, and wireless users need WAP coverage.',
  devices: [
    { id: 'firewall', label: 'Firewall', short: 'FW', detail: 'filters edge traffic', glyph: 'firewall' },
    { id: 'router', label: 'Router', short: 'RTR', detail: 'WAN handoff option', glyph: 'router' },
    { id: 'l3switch', label: 'Layer 3 switch', short: 'L3', detail: 'routes VLANs', glyph: 'switch' },
    { id: 'poeswitch', label: 'PoE switch', short: 'SW', detail: 'powers APs and cameras', glyph: 'switch' },
    { id: 'wap', label: 'Wireless access point', short: 'AP', detail: 'wireless coverage', glyph: 'wap' },
    { id: 'server', label: 'Server', short: 'SRV', detail: 'internal services', glyph: 'server' },
  ],
  zones: [
    { id: 'internet', label: 'Internet', x: 4, y: 6, w: 12, h: 15, tint: '#f8fafc', circle: true, icon: 'internet' },
    { id: 'telco', label: 'Telco cage', x: 6.5, y: 39, w: 15, h: 34, tint: '#fef3c7', dashed: true },
    { id: 'mdf', label: 'Building A MDF', x: 22, y: 39, w: 15.5, h: 34, tint: 'rgba(226, 232, 240, 0.7)', dashed: true },
    { id: 'exec', label: 'Floor 2: Executive offices', x: 37, y: 6, w: 56, h: 40, tint: 'rgba(239, 246, 255, 0.72)' },
    { id: 'server', label: 'Server room', x: 38, y: 58, w: 21, h: 28, tint: 'rgba(219, 234, 254, 0.78)' },
    { id: 'buildingb', label: 'Building B offices', x: 61, y: 50, w: 37, h: 44, tint: 'rgba(220, 252, 231, 0.74)' },
  ],
  slots: [
    {
      id: 'edge',
      label: 'Edge security',
      zone: 'Telco cage',
      x: 14,
      y: 58,
      correct: 'firewall',
      why: 'The firewall belongs between the ISP handoff and the inside network so policy is enforced before traffic reaches either building.',
    },
    {
      id: 'core',
      label: 'Core gateway',
      zone: 'Building A MDF',
      x: 30,
      y: 58,
      correct: 'l3switch',
      why: 'A Layer 3 switch is a strong fit for internal VLAN routing and fast switching between office segments.',
    },
    {
      id: 'exec-access',
      label: 'Floor 2 access',
      zone: 'Executive offices',
      x: 46,
      y: 27,
      correct: 'poeswitch',
      why: 'The floor access switch connects workstations, printer, and the WAP uplink.',
    },
    {
      id: 'exec-ap',
      label: 'Executive WAP',
      zone: 'Executive offices',
      x: 80,
      y: 24,
      correct: 'wap',
      why: 'A WAP belongs in the office area where wireless clients need coverage.',
    },
    {
      id: 'server-room',
      label: 'Private services',
      zone: 'Server room',
      x: 47,
      y: 73,
      correct: 'server',
      why: 'Internal services belong inside the trusted network, behind the firewall.',
    },
    {
      id: 'building-b-access',
      label: 'Building B access',
      zone: 'Building B IDF',
      x: 71,
      y: 66,
      correct: 'poeswitch',
      why: 'Building B needs an access switch to connect local users and access points back to the routed core.',
    },
    {
      id: 'building-b-ap',
      label: 'Building B WAP',
      zone: 'Building B offices',
      x: 89,
      y: 63,
      correct: 'wap',
      why: 'A second WAP gives the remote building wireless coverage instead of forcing clients to reach building A.',
    },
  ],
  endpoints: [
    { id: 'printer', kind: 'printer', label: 'Printer', x: 62, y: 19, output: 'printer' },
    { id: 'exec-pc', kind: 'pc', label: 'Executive-PC', x: 63, y: 38, output: 'exec1' },
    { id: 'sales', kind: 'laptop', label: 'Sales laptop', x: 71, y: 85, output: 'sales1' },
    { id: 'camera', kind: 'camera', label: 'Camera', x: 89, y: 85, output: 'camera' },
  ],
  lines: [
    'M9 20 C5 27 4 33 4 43 L4 55 C4 57 5 58 8 58', // internet -> edge (down the left margin)
    'M14 58 L30 58', // edge -> core
    'M30 58 C34 57 37 56 38 54 C42 44 44 33 46 27', // core -> floor 2 access (exit MDF right, then up)
    'M30 58 C34 66 40 72 47 73', // core -> private services (under the Server room label)
    'M30 58 C36 63 45 65 53 65 C60 65 66 65 71 66', // core -> building B access (below the labels)
    'M46 27 C52 23 56 21 62 19', // floor 2 -> printer
    'M46 27 C52 31 57 35 63 38', // floor 2 -> executive PC
    'M46 27 C58 24 70 23 80 24', // floor 2 -> executive WAP
    'M71 66 L71 85', // building B -> sales laptop
    'M71 66 C78 65 84 64 89 63', // building B -> building B WAP
    'M71 66 C76 74 83 81 89 85', // building B -> camera
  ],
  outputs: {
    exec1: {
      tab: 'Executive-PC',
      title: 'Executive-PC ipconfig',
      body: [
        'IPv4 Address . . . . . . . . . . : 192.168.10.68',
        'Subnet Mask . . . . . . . . . . : 255.255.255.224',
        'Default Gateway . . . . . . . . : 192.168.10.65',
        '',
        'Hint: /27 block. Gateway .65 means this host belongs in 192.168.10.64/27.',
      ],
    },
    sales1: {
      tab: 'Sales-Laptop',
      title: 'Sales-Laptop ipconfig',
      body: [
        'IPv4 Address . . . . . . . . . . : 192.168.20.44',
        'Subnet Mask . . . . . . . . . . : 255.255.255.192',
        'Default Gateway . . . . . . . . : 192.168.20.1',
        '',
        'Hint: building B users need a routed path back to building A.',
      ],
    },
    camera: {
      tab: 'Camera',
      title: 'Cable test: camera closet uplink',
      body: ['Result: PASS', 'Length: 48 m', 'Pairs: OK', 'PoE requested: 15.4 W', '', 'Hint: cameras and WAPs can be fed by PoE switches.'],
    },
    printer: {
      tab: 'Printer',
      title: 'Printer status',
      body: [
        'Model: LaserJet Pro M404n',
        'IP: 192.168.10.70 (DHCP)',
        'Subnet Mask: 255.255.255.224',
        'Gateway: 192.168.10.65',
        'Queue: 0 jobs',
        '',
        'Hint: same /27 subnet as Executive-PC.',
        'Connected via: Floor 2 access switch port Fa0/4',
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Screened subnet (DMZ). Internet -> perimeter firewall -> DMZ public servers
// -> internal firewall -> trusted LAN. Tests where each device belongs.
// ---------------------------------------------------------------------------
export const DMZ: TopologyScenario = {
  statusTag: 'DMZ / screened subnet design',
  mapLabel: 'Screened subnet (DMZ) diagram',
  title: 'Design a screened subnet (DMZ)',
  brief:
    'This company hosts public services and must keep them off the trusted LAN. Place each device so the internet hits a firewall first, public-facing servers sit in the DMZ, a second firewall guards the inside, and sensitive servers stay on the internal network.',
  devices: [
    { id: 'firewall', label: 'Firewall', short: 'FW', detail: 'filters between zones', glyph: 'firewall' },
    { id: 'switch', label: 'Switch', short: 'SW', detail: 'Layer 2 aggregation', glyph: 'switch' },
    { id: 'web', label: 'Web server', short: 'WEB', detail: 'public web app (443)', glyph: 'server' },
    { id: 'mail', label: 'Mail server', short: 'MAIL', detail: 'inbound email (25)', glyph: 'server' },
    { id: 'dns', label: 'Public DNS', short: 'DNS', detail: 'resolves your domain', glyph: 'server' },
    { id: 'db', label: 'Database server', short: 'DB', detail: 'sensitive customer data', glyph: 'server' },
  ],
  zones: [
    { id: 'internet', label: 'Internet', x: 5, y: 5, w: 13, h: 16, tint: '#f8fafc', circle: true, icon: 'internet' },
    { id: 'dmz', label: 'Screened subnet', x: 18, y: 31, w: 74, h: 22, tint: '#fef3c7', dashed: true },
    { id: 'lan', label: 'Internal LAN (trusted)', x: 18, y: 67, w: 56, h: 24, tint: 'rgba(220, 252, 231, 0.74)', labelRight: true },
  ],
  slots: [
    {
      id: 'ext-fw',
      label: 'Perimeter firewall',
      zone: 'Edge',
      x: 12,
      y: 28,
      correct: 'firewall',
      why: 'The perimeter firewall faces the internet and enforces policy before any traffic reaches the DMZ or the inside.',
    },
    {
      id: 'dmz-sw',
      label: 'DMZ switch',
      zone: 'Screened subnet',
      x: 26,
      y: 46,
      correct: 'switch',
      why: 'A Layer 2 switch aggregates the public servers inside the DMZ.',
    },
    {
      id: 'web',
      label: 'Public web app',
      zone: 'Screened subnet',
      x: 50,
      y: 40,
      correct: 'web',
      why: 'The web app must be reachable from the internet, so it lives in the DMZ, never on the trusted LAN.',
    },
    {
      id: 'mail',
      label: 'Inbound mail',
      zone: 'Screened subnet',
      x: 67,
      y: 40,
      correct: 'mail',
      why: 'The mail server receives inbound SMTP from the internet, so it belongs in the DMZ alongside the other public services.',
    },
    {
      id: 'dns',
      label: 'Public name server',
      zone: 'Screened subnet',
      x: 83,
      y: 40,
      correct: 'dns',
      why: 'Public DNS resolves your domain for internet clients, so it sits in the DMZ, not the internal network.',
    },
    {
      id: 'int-fw',
      label: 'Internal firewall',
      zone: 'Inside edge',
      x: 14,
      y: 60,
      correct: 'firewall',
      why: 'A second firewall guards the trusted LAN. Only the DMZ can reach it, and the internet never can. Two firewalls around the public servers is what makes it a screened subnet.',
    },
    {
      id: 'core-sw',
      label: 'Core switch',
      zone: 'Internal LAN',
      x: 26,
      y: 78,
      correct: 'switch',
      why: 'A Layer 2 switch fans out the trusted internal network behind the inside firewall.',
    },
    {
      id: 'db',
      label: 'Customer database',
      zone: 'Internal LAN',
      x: 48,
      y: 78,
      correct: 'db',
      why: 'The database holds sensitive data and must stay on the internal LAN, never in the DMZ. The web server reaches it through the inside firewall on a single allowed port.',
    },
  ],
  endpoints: [{ id: 'pcs', kind: 'pc', label: 'Employee PCs', x: 65, y: 80, output: 'fw' }],
  lines: [
    'M12 18 L12 28', // internet -> perimeter firewall
    'M12 28 C13 36 18 44 26 46', // perimeter fw -> DMZ switch
    'M26 46 C34 44 42 41 50 40', // dmz switch -> web
    'M26 46 C40 45 54 41 67 40', // dmz switch -> mail
    'M26 46 C46 46 66 41 83 40', // dmz switch -> public DNS
    'M26 46 C24 50 20 56 14 60', // dmz switch -> internal firewall
    'M14 60 C14 68 18 75 26 78', // internal fw -> core switch
    'M26 78 C34 77 41 78 48 78', // core switch -> database
    'M26 78 C40 78 54 79 65 80', // core switch -> employee PCs
  ],
  outputs: {
    web: {
      tab: 'Web',
      title: 'curl from the internet',
      body: [
        '$ curl -I https://shop.example.com',
        '',
        'HTTP/2 200',
        'server: nginx',
        'served by: DMZ web host 203.0.113.10',
        '',
        'Public users reach the web server in the DMZ.',
      ],
    },
    dns: {
      tab: 'DNS',
      title: 'Public DNS records',
      body: [
        '$ dig +short shop.example.com',
        '203.0.113.10',
        '',
        '$ dig +short db.internal',
        '(no record)',
        '',
        'Only DMZ hosts get a public record. The database does not.',
      ],
    },
    dbscan: {
      tab: 'DB scan',
      title: 'Port scan from the internet',
      body: [
        '$ nmap -Pn db.internal',
        '',
        'All 1000 scanned ports are filtered.',
        'Host seems down (no route from outside).',
        '',
        'The database is unreachable from the internet by design.',
      ],
    },
    fw: {
      tab: 'Firewall',
      title: 'Firewall policy summary',
      body: [
        'internet -> DMZ    tcp/443   ALLOW',
        'internet -> DMZ    tcp/25    ALLOW',
        'internet -> inside           DENY',
        'DMZ      -> inside tcp/5432  ALLOW (web to db)',
        'inside   -> any              ALLOW',
        '',
        'The internet never touches the inside, only the DMZ does.',
      ],
    },
  },
};
