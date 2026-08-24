/**
 * changelog.ts - version history for the "What's new" drawer.
 *
 * Single source of truth for the app's version and release notes, mirroring
 * the same pattern used on johnnynguyen.cloud. Bump CURRENT_VERSION and
 * prepend a new entry to `changelog` whenever a meaningful set of changes
 * ships. The What's New drawer and the version pill in the top bar both read
 * from here.
 *
 * Keep entries newest-first and keep each change line short and plain. Tag
 * every change so the drawer can group it:
 *   "added"   - new feature or surface
 *   "changed" - behavior or content change
 *   "fixed"   - bug fix
 *   "infra"   - hosting / deploy / pipeline work
 */

export type ChangeType = 'added' | 'changed' | 'fixed' | 'infra';

export interface Change {
  type: ChangeType;
  text: string;
}

export interface Release {
  /** Semantic version, e.g. "0.5.1". */
  version: string;
  /** Channel label shown next to the version, e.g. "Beta". */
  label?: string;
  /** ISO date the release shipped. */
  date: string;
  /** One-line headline for the release. */
  title: string;
  changes: Change[];
}

/** What the version pill renders, e.g. "v0.5.1 Beta". */
export const CURRENT_VERSION = {
  version: '0.6.0',
  label: 'Beta',
  display: 'v0.6.0 Beta',
} as const;

export const CHANGE_LABELS: Record<ChangeType, string> = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  infra: 'Infra',
};

export const changelog: Release[] = [
  {
    version: '0.6.0',
    label: 'Beta',
    date: '2026-08-23',
    title: 'Exam-accurate simulations and fair answer shuffling',
    changes: [
      {
        type: 'added',
        text: 'Network Troubleshooting Sim: a full performance-based item built to look like the real CompTIA simulation. Click devices on the floor plan to open draggable windows, type real commands at a working prompt (ipconfig, ping, nslookup, tracert, arp), open the router to read its interfaces and access control list, and delete the rule causing the outage.',
      },
      {
        type: 'added',
        text: 'That sim runs a real ACL engine. Every command and every page load is evaluated against the live rule list, top down, first match wins. Ping and DNS keep working while the browser fails, because a filter on TCP 80 and 443 does not touch ICMP or UDP 53. Delete the wrong rules and you can see what breaks.',
      },
      {
        type: 'added',
        text: 'Firewall Rule Builder Sim: an empty rule table and three business requirements. Write the rules yourself with dropdowns for protocol, source, destination, ports and action, instead of flipping permit or deny on rules somebody else wrote.',
      },
      {
        type: 'added',
        text: 'T568A / T568B Wiring Sim: drag or click to reorder the pairs on both ends of a crossover cable, graded pin by pin.',
      },
      {
        type: 'changed',
        text: 'The three new sims drop the dark site theme and use the light exam chrome instead, so practice looks like test day.',
      },
      {
        type: 'changed',
        text: 'The PBQ home is now grouped by what you actually do in each task (exam simulations, diagram placement, configuration, troubleshooting, subnetting, matching and sorting, written recall) instead of by exam domain. Every tile still shows the domain it covers.',
      },
      {
        type: 'fixed',
        text: 'Answer choices are now shuffled every time a question is served. The banks as written parked the correct answer in choice B 65% of the time in the exam sim and choice A 75% of the time in the quiz, which was a pattern you could pass on without knowing the material.',
      },
      {
        type: 'fixed',
        text: 'Question selection now tracks what it has already served you. Every question in a bank gets used once before any of them repeat, so back to back attempts stop recycling the same items.',
      },
    ],
  },
  {
    version: '0.5.1',
    label: 'Beta',
    date: '2026-08-23',
    title: 'Exam bank scope audit and version tracking',
    changes: [
      {
        type: 'changed',
        text: 'Audited all 275 questions against the official CompTIA N10-009 exam objectives. Removed 8 that tested material beyond the exam, including KRACK, T568B pin colors, APC connector tints, and backup set counts, all of which CompTIA cut in the 008 to 009 revision.',
      },
      {
        type: 'changed',
        text: 'Rewrote 9 questions to test the concept instead of the trivia. The DNS amplification question no longer demands exact byte figures, the QoS question dropped CBWFQ, and DMZ became screened subnet to match current CompTIA wording.',
      },
      {
        type: 'changed',
        text: 'Replaced 3 questions whose correct answers were off-objective: pretexting became tailgating, Dynamic ARP Inspection became 802.1X, and OTDR became Wi-Fi analyzer.',
      },
      {
        type: 'added',
        text: 'Version pill in the top bar plus a release notes drawer, so you can see which build you are studying on and exactly what changed in it.',
      },
    ],
  },
  {
    version: '0.5.0',
    label: 'Beta',
    date: '2026-06-25',
    title: 'Exam simulator, subnetting guide, and six PBQ drills',
    changes: [
      {
        type: 'added',
        text: 'Simulated exam review flow: sit a full timed practice exam, then walk your answers with reasoning on every question.',
      },
      {
        type: 'added',
        text: 'Subnetting guide plus a CIDR sizing drill that has you pick the right block for a given host count.',
      },
      {
        type: 'added',
        text: 'Five new performance-based drills: subnet design, visual topology, VLAN port assignment, troubleshooting console, screened subnet topology, firewall ACL, and wireless channel planning.',
      },
      {
        type: 'added',
        text: 'Quiz levels (easy and medium) and acronym study helpers built from the official N10-009 acronym list.',
      },
      {
        type: 'added',
        text: 'Lecture links on missed quiz concepts, so a wrong answer points straight at the video that covers it.',
      },
      {
        type: 'changed',
        text: 'PBQ drills are now grouped by exam domain so the screen stays readable as the bank grows.',
      },
    ],
  },
  {
    version: '0.4.0',
    label: 'Beta',
    date: '2026-06-15',
    title: 'OSI, Troubleshoot, and Match modes',
    changes: [
      {
        type: 'added',
        text: 'OSI Model mode: a sender and receiver view that animates a packet going down the stack, across the wire as bits, and back up the other side. Play, step, and replay at your own pace.',
      },
      {
        type: 'added',
        text: 'Troubleshoot mode: the CompTIA seven-step methodology as a clickable scenario, a reference for the eight CLI tools the exam covers, and simulated traceroute and ARP output to practice reading.',
      },
      {
        type: 'added',
        text: 'Match game: a timed matching game across five curated sets plus a mixed set, 45 pairs in all, timed and scored so you can race your own best run.',
      },
      {
        type: 'added',
        text: 'Session timer in the top right, hidable top tabs, and full mobile and responsive support.',
      },
      {
        type: 'added',
        text: 'Johnny Nguyen branding and trailer tooling.',
      },
      {
        type: 'fixed',
        text: 'Header overflow at narrow widths, where the top-right controls used to overlap the section tabs.',
      },
      {
        type: 'infra',
        text: 'Added a test that guards the whole src tree against em dashes, keeping the writing voice consistent.',
      },
    ],
  },
  {
    version: '0.3.0',
    label: 'Beta',
    date: '2026-06-13',
    title: 'Guided mode and protocol sequence diagrams',
    changes: [
      {
        type: 'added',
        text: 'Guided learning: six missions with an adaptive coach, screen-darkening spotlight steps, and a categorized mission home.',
      },
      {
        type: 'added',
        text: 'Manual static IP configuration on devices, with the canvas showing each configured address and pings failing realistically when the config is wrong.',
      },
      {
        type: 'added',
        text: 'Animated sequence diagrams for DHCP (DORA), DNS resolution, and the TLS handshake.',
      },
      {
        type: 'added',
        text: 'Performance-based questions across all five exam domains, including two type-it-in formats.',
      },
      {
        type: 'changed',
        text: 'Guided missions now deep-link into the matching PBQs so practice follows the lesson.',
      },
    ],
  },
  {
    version: '0.2.2',
    label: 'Beta',
    date: '2026-06-11',
    title: 'AI practice questions and social preview',
    changes: [
      {
        type: 'added',
        text: 'Generate similar questions and PBQs on demand, so a concept you keep missing can be drilled from fresh angles.',
      },
      {
        type: 'added',
        text: 'Branded social preview card with Open Graph and Twitter meta.',
      },
    ],
  },
  {
    version: '0.2.1',
    label: 'Beta',
    date: '2026-06-10',
    title: 'Network+ study hub',
    changes: [
      {
        type: 'added',
        text: 'Study hub with quiz mode, flashcards, and the first performance-based questions.',
      },
      {
        type: 'changed',
        text: 'Rewrote the copy in a plainer voice and added on-canvas demo callouts.',
      },
      { type: 'fixed', text: 'Bubble drag on the canvas.' },
    ],
  },
  {
    version: '0.2.0',
    label: 'Beta',
    date: '2026-06-10',
    title: 'Learn mode with 21 concept demos',
    changes: [
      {
        type: 'added',
        text: 'Learn mode: 21 animated demos covering the networking concepts from the Diego course, each with hands-on tasks.',
      },
      { type: 'added', text: 'Zoom and pan on the canvas.' },
      {
        type: 'infra',
        text: 'Deployed to Azure Static Web Apps on the Free tier.',
      },
    ],
  },
  {
    version: '0.1.0',
    label: 'Beta',
    date: '2026-06-10',
    title: 'The first mini Packet Tracer',
    changes: [
      {
        type: 'added',
        text: 'Interactive canvas where you drop devices, run cables between them, and watch packets move across the topology.',
      },
    ],
  },
];
