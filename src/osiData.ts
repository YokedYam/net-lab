// The OSI + TCP/IP encapsulation model as data. The component renders it; the
// content test scans it for em dashes. Keep every string in the human voice.

export type ChipKind = 'data' | 'port' | 'ip' | 'mac' | 'fcs';

export interface Chip {
  kind: ChipKind;
  label: string;
}

export interface OsiLayer {
  n: number; // 7 (top) down to 1 (bottom)
  name: string;
  tcpip: string; // TCP/IP model group this OSI layer maps to
  pdu: string; // protocol data unit name at this layer
  job: string; // one-line "what it does"
  examples: string; // real protocols or gear that live here
}

// Stored top down so the towers render 7..1 the way the model is drawn.
export const OSI_LAYERS: OsiLayer[] = [
  { n: 7, name: 'Application', tcpip: 'Application', pdu: 'Data', job: 'The stuff you actually use: web, email, name lookups.', examples: 'HTTP, DNS, SMTP' },
  { n: 6, name: 'Presentation', tcpip: 'Application', pdu: 'Data', job: 'Formats, encodes, and encrypts so both sides agree.', examples: 'TLS, JPEG, ASCII' },
  { n: 5, name: 'Session', tcpip: 'Application', pdu: 'Data', job: 'Opens, keeps, and closes the conversation.', examples: 'RPC, NetBIOS' },
  { n: 4, name: 'Transport', tcpip: 'Transport', pdu: 'Segment', job: 'Adds a port so the data reaches the right app. Reliable (TCP) or fast (UDP).', examples: 'TCP, UDP' },
  { n: 3, name: 'Network', tcpip: 'Internet', pdu: 'Packet', job: 'Adds IP addresses so routers can move it between networks.', examples: 'IP, ICMP, routers' },
  { n: 2, name: 'Data Link', tcpip: 'Link', pdu: 'Frame', job: 'Adds MAC addresses for the next hop and a trailer to catch errors.', examples: 'Ethernet, switches, MAC' },
  { n: 1, name: 'Physical', tcpip: 'Link', pdu: 'Bits', job: 'Turns the frame into raw bits on the wire, fiber, or air.', examples: 'cables, hubs, radio' },
];

// TCP/IP groups, top to bottom, with the OSI layers each one folds together.
export interface TcpIpGroup {
  name: string;
  spans: number[]; // OSI layer numbers
  note: string;
}

export const TCPIP_GROUPS: TcpIpGroup[] = [
  { name: 'Application', spans: [7, 6, 5], note: 'OSI layers 5-7 collapse into one.' },
  { name: 'Transport', spans: [4], note: 'Same as OSI Layer 4. Ports live here.' },
  { name: 'Internet', spans: [3], note: 'OSI Layer 3. IP addressing and routing.' },
  { name: 'Link', spans: [2, 1], note: 'OSI layers 1-2 together. Also called Network Access.' },
];

export type Phase = 'send' | 'wire' | 'recv';

export interface JourneyStep {
  side: Phase;
  layer: number; // active OSI layer (1 for wire)
  pdu: string;
  chips: Chip[];
  bits: boolean; // render raw bits instead of header chips
  note: string;
}

const DATA: Chip = { kind: 'data', label: 'Data' };
const PORT: Chip = { kind: 'port', label: 'Port' };
const IP: Chip = { kind: 'ip', label: 'IP' };
const MAC: Chip = { kind: 'mac', label: 'MAC' };
const FCS: Chip = { kind: 'fcs', label: 'FCS' };

const dataOnly: Chip[] = [DATA];
const segment: Chip[] = [PORT, DATA];
const packet: Chip[] = [IP, PORT, DATA];
const frame: Chip[] = [MAC, IP, PORT, DATA, FCS];

// One trip: down the sender stack (encapsulation), across the wire as bits,
// up the receiver stack (de-encapsulation). The data that arrives is the data
// that left.
export const OSI_JOURNEY: JourneyStep[] = [
  { side: 'send', layer: 7, pdu: 'Data', chips: dataOnly, bits: false, note: 'Application makes the message: a web request, an email, a DNS lookup. Right now it is just data.' },
  { side: 'send', layer: 6, pdu: 'Data', chips: dataOnly, bits: false, note: 'Presentation formats it and can encrypt it. This is where TLS sits. Still data, just dressed for travel.' },
  { side: 'send', layer: 5, pdu: 'Data', chips: dataOnly, bits: false, note: 'Session opens the conversation with the other host and keeps track of it. The data has not changed yet.' },
  { side: 'send', layer: 4, pdu: 'Segment', chips: segment, bits: false, note: 'Transport wraps the data with a port number so the far side knows which app gets it. Now it is a segment.' },
  { side: 'send', layer: 3, pdu: 'Packet', chips: packet, bits: false, note: 'Network adds source and destination IP addresses so routers can carry it across networks. Now it is a packet.' },
  { side: 'send', layer: 2, pdu: 'Frame', chips: frame, bits: false, note: 'Data Link adds MAC addresses for the next hop and an FCS trailer to catch errors. Now it is a frame.' },
  { side: 'send', layer: 1, pdu: 'Bits', chips: frame, bits: true, note: 'Physical turns the whole frame into raw bits and pushes them onto the wire.' },
  { side: 'wire', layer: 1, pdu: 'Bits', chips: frame, bits: true, note: 'The bits cross the medium as electrical pulses, light, or radio. No addresses out here, just signal.' },
  { side: 'recv', layer: 1, pdu: 'Bits', chips: frame, bits: true, note: 'The receiver Physical layer picks the bits back up off the wire.' },
  { side: 'recv', layer: 2, pdu: 'Packet', chips: packet, bits: false, note: 'Data Link rebuilds the frame, checks the FCS and the destination MAC, then strips its header and trailer.' },
  { side: 'recv', layer: 3, pdu: 'Segment', chips: segment, bits: false, note: 'Network confirms the destination IP is for this host, then strips the IP header.' },
  { side: 'recv', layer: 4, pdu: 'Data', chips: dataOnly, bits: false, note: 'Transport reads the port, lines it up with the right app, then strips its header.' },
  { side: 'recv', layer: 5, pdu: 'Data', chips: dataOnly, bits: false, note: 'Session matches it to the open conversation.' },
  { side: 'recv', layer: 6, pdu: 'Data', chips: dataOnly, bits: false, note: 'Presentation decrypts and decodes it back into something readable.' },
  { side: 'recv', layer: 7, pdu: 'Data', chips: dataOnly, bits: false, note: 'Application hands over the original message. Same data that started up top. Wrapping on the way down is encapsulation; peeling on the way up is de-encapsulation.' },
];

export interface Mnemonic {
  order: string;
  phrase: string;
  hint: string;
}

export const OSI_MNEMONICS: Mnemonic[] = [
  { order: 'Layer 1 up to 7', phrase: 'Please Do Not Throw Sausage Pizza Away', hint: 'Physical, Data Link, Network, Transport, Session, Presentation, Application' },
  { order: 'Layer 7 down to 1', phrase: 'All People Seem To Need Data Processing', hint: 'Application, Presentation, Session, Transport, Network, Data Link, Physical' },
];

export const CHIP_LABEL: Record<ChipKind, string> = {
  data: 'Payload',
  port: 'Port (L4)',
  ip: 'IP (L3)',
  mac: 'MAC (L2)',
  fcs: 'FCS trailer',
};
