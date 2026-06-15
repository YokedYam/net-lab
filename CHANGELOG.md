# Changelog

A plain-language history of Net+ Visual Lab, newest first. Dates are when the work
landed. This file is reconstructed from the git history plus the notes kept in
`docs/troubleshooting/`, so it goes back as far as the first commit.

## Unreleased

New study modes and a friendlier shell around them.

### Added
- **OSI Model** mode: a two-tower sender and receiver view that animates a packet
  going down the stack (encapsulation), across the wire as bits, and back up the
  other side (de-encapsulation). Play, step forward, step back, and replay at your
  own pace. Shows how the seven OSI layers map onto the four TCP/IP groups, lists
  the classic mnemonics, and deep-links to the matching PBQs.
- **Troubleshoot** mode: the CompTIA seven-step methodology as a clickable scenario,
  a reference for the eight CLI tools the exam covers, and a simulated traceroute and
  ARP table so you can practice reading real output.
- **Match** game: a Quizlet-style timed matching game across five curated sets (Ports,
  OSI layers, Protocols, Tools, Addressing) plus a mixed set, 45 pairs in all. It
  times each round and counts your misses so you can race your own best run. Every
  pair mirrors a flashcard.
- **Session timer** in the top right that tracks how long you have been studying.
  Start it when you sit down; it resets on a fresh visit.
- **Hidable top tabs**: collapse the section nav for a cleaner screen. Your choice is
  remembered between visits.
- **Mobile and responsive support**: the layout now scales from a wide desktop down to
  a phone, with a short notice on very small screens.

### Changed
- PBQs are now grouped by exam domain (1.0 through 5.0) so the screen does not get
  crowded, and the bank grew to 19 questions across six formats (match, categorize,
  subnet, order, recall, teach-back).
- Side panels and toolbars scale with the viewport so the canvas stays usable on big
  Mac displays and on Windows, with consistent thin scrollbars across platforms.
- Selected matching tiles now glow blue instead of purple.

### Fixed
- Header overflow: at narrow widths the top-right controls used to overlap the section
  nav and intercept clicks, which made Match and the timer appear broken and could kick
  you out of a game. The top bar now wraps to two rows and never overlaps.
- NAT flashcard wording corrected so it describes NAT (maps private IPs to public IPs)
  rather than PAT.

## 0.2.0 (2026-06-13)

The guided-learning release: hand-holding missions that check your real work.

### Added
- **Guided** missions: ten hands-on walkthroughs grouped by category (Fundamentals,
  Subnetting, Topology & Routing, Protocols). The screen dims, a coach bubble points at
  the exact control, and each step only advances once the app sees you actually do it.
- Protocol missions with on-canvas sequence diagrams: Ports and protocols, DHCP (DORA),
  DNS resolution, the TCP three-way handshake, and the TLS handshake.
- Manual IP configuration in the lab: switch any host from DHCP to static and type its
  IP, mask, and gateway by hand. The device label shows the configured address, and the
  ping engine produces the real, specific failure for a bad mask, missing gateway, or
  duplicate IP.
- AI practice (button-triggered, never automatic): generate a similar quiz question or a
  similar PBQ on demand through an Azure Function proxy, with rate limits and strict
  validation.
- Social preview card: Open Graph and Twitter meta with a branded image.
- Copilot and agent handoff docs (`.github/copilot-instructions.md`, `AGENTS.md`).

### Changed
- PBQs expanded across all five exam domains and gained two type-it-in formats.
- Header centered and the copy rewritten in a plain, human voice.

## 0.1.0 (2026-06-10)

The first public build.

### Added
- **Visual Lab**: an interactive mini Packet Tracer in the browser. Place devices, cable
  them, and ping; a glowing packet hops the path while the event log narrates each hop.
  Scroll to zoom, drag to pan.
- **Learn** mode: guided demos of all 21 concepts in the networking chain, each a
  scripted topology with narration, on-canvas callouts, and a "Try it yourself" task.
- **Quiz** and **Flashcards**: a scenario-style question bank and pre-made cards focused
  on the highest-yield and most commonly confused topics.
- Content integrity and subnet-math test suites (Vitest).
- README with the live URL, deploy script, and credit to the original inspiration.
