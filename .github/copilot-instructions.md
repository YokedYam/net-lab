# Net+ Visual Lab — agent handoff (read this first)

You are continuing work on an all-in-one **CompTIA Network+ (N10-009)** study tool: a dark-mode
mini Packet Tracer plus guided tutorials, quizzes, flashcards, and performance-based questions.
A previous agent built the foundation; your job is to extend it without breaking the voice,
look, or quality bar. Read this whole file before writing code.

## Run / build / test / deploy

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest (must stay green: 38+ tests)
npm run build      # tsc (strict, noUnusedLocals) + vite build — must pass clean
npm run deploy     # builds + ships dist/ to Azure Static Web Apps (needs `az login`)
```

- TypeScript is strict: no unused locals/imports, no implicit any. `npm run build` is the gate.
- Pushing to GitHub `main` does **NOT** deploy. The live site updates only via `npm run deploy`.
- Live URL: https://black-plant-0cfd8ca10.7.azurestaticapps.net

## Hard rules (do not break these)

1. **Human voice.** Write everything (UI copy, mission text, PBQ wording) like a smart friend
   explaining over coffee. Contractions. Short, varied sentences. Plain words over jargon.
2. **No em dashes anywhere.** Not in copy, not in comments. Use a colon, period, or "to"/"and".
   There is a regression test (`content.test.ts`) that scans user-facing data for em dashes and
   fails the build. Use `-`, `:`, or rephrase.
3. **De-personalize.** This is a public site. No references to any specific person, job, school,
   game, or homelab. Keep examples generic (example.com, a client, a server).
4. **Accuracy first.** Ground every networking fact in reality. Foundational concepts (OSI, TCP,
   subnetting, ports) do not need web search; specific evolving tools do. When unsure, do not
   invent numbers (ports, 802.11 bands, etc.).
5. **Verify visually with Playwright before claiming done** (see below). Screenshots catch the
   layout/timing bugs that typecheck cannot.

## Architecture (where things live)

React 19 + TypeScript + Vite, hand-rolled SVG, no backend except one Azure Function for AI
generation. Five top sections in `src/App.tsx`: **Visual Lab**, **Guided**, **Quiz**,
**Flashcards**, **PBQs**.

- `src/model.ts` — the network sim. Devices, links, `computeNetworks` (auto-subnets), `planPing`
  (config-aware: surfaces the real failure for wrong mask / no gateway / same-wire-different-
  subnet / duplicate IP), IPv4 helpers (`effectiveAddr`, `parseMask`, `sameSubnet`). Tests in
  `model.test.ts`.
- `src/App.tsx` — canvas, tools, camera, mission wiring. Static IPs are configured in the
  details panel; the canvas label shows the **effective** address.
- `src/missions.ts` — all guided missions as DATA. A mission is `teach`/`do` steps. Build
  missions use `setup`/`check` (action-gated against live state). Protocol missions set
  `diagram` (sequence diagram) and each step's `reveal` count. Optional `pbq` cross-links to a
  PBQ. Helpers: `byName`, `countType`, `canPing`, `connected`, `inSubnet`.
- `src/components/Guided.tsx` — the coach overlay. **Adaptive dimming, never a full blackout**:
  teach steps show a warm centered (or bottom-docked) lesson card over a soft vignette; do
  steps show a light wash + a glowing spotlight on the `data-coach` target with an anchored
  coach bubble; passing a check fires a green celebration. `GuidedHome` groups missions into
  collapsible categories with Beginner/Intermediate/Advanced badges and a completion tracker.
- `src/components/SequenceDiagram.tsx` — bright UML ladder diagram (lifelines + diagonal
  arrows) for protocol missions (TCP, TLS, DHCP, DNS, ports). Reuse this for any new protocol.
- `src/pbqData.ts` + `src/components/PbqMode.tsx` — six PBQ kinds: `match`, `categorize`,
  `subnet`, `order`, `recall` (type the answer), `teachback` (write the explanation, graded on
  key points, reveals a model answer). PBQs deep-link to/from guided missions.
- `src/quizData.ts`, `src/flashcardData.ts`, `src/concepts.ts` (21 Learn-mode demos).

## How to add content (the common cases)

- **New protocol explainer** → add a mission to `missions.ts` with a `diagram` + `reveal` per
  step. No new component needed. Look at `tcp-handshake`, `dhcp-dora`, `dns-resolution`.
- **New hands-on lab** → a build mission with `setup` (seed devices) + `check` predicates that
  read live `ctx`. Tag any UI control you spotlight with `data-coach="..."`.
- **New PBQ** → add to `PBQS` in `pbqData.ts`. Match the existing shapes exactly. Use `recall`
  for pure memory facts and `teachback` for "say it out loud" concepts. Set `domain` and keep
  `resources` pointing at real concept ids.
- **Cross-link** a mission to its PBQ via `Mission.pbq = '<pbq-id>'` (shows a "Practice it"
  button on the last step that deep-links into that PBQ).

## Playwright: verify your UI before handing back

Playwright is installed (`devDependency` + Chromium). A reusable script is at `scripts/shoot.mjs`
(`npm run shoot`) that drives the running dev server and writes PNGs to `/tmp/netshots/`. For a
targeted check, write a short ESM script **inside the project** (so it resolves `playwright`),
run it, then delete it:

```js
// scripts/_check.mjs  (run: node scripts/_check.mjs, then delete it)
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Guided' }).click();
await p.getByText('Your mission title').click();
await p.waitForSelector('.coach-stage, .coach-lesson, .coach-bubble');
await p.screenshot({ path: '/tmp/netshots/check.png' });
// assert real state instead of eyeballing where possible:
console.log(await p.locator('.coach-stepn').textContent());
await b.close();
```

Workflow: make a change → dev server hot-reloads → run a Playwright script → open the PNG and
confirm it looks right (spacing, dimming, the spotlight landing on the correct control, the
celebration firing) → only then say it is done. Prefer asserting DOM/text state (counts,
labels) over screenshots when you can; screenshots are for layout and "does the overlay read
as bright vs dark" judgments.

## Roadmap (what is left, by exam weight)

Done: Fundamentals (build a network, configure IPs), Subnetting (the /24 vs /26 boundary),
Topology & Routing (star/redundancy/STP, two-subnet routing), Protocols (Ports, DHCP DORA, DNS,
TCP 3-way, TLS), the **OSI + TCP/IP + encapsulation visualizer** (the `OSI Model` section:
`src/osiData.ts` + `src/components/OsiModel.tsx`, a two-tower sender/receiver 7-layer stack that
wraps the packet on the way down and strips it on the way up, links to `pbq-osi` and
`pbq-osi-teachback`), the **Troubleshooting domain** (the `Troubleshoot` section:
`src/troubleshootData.ts` + `src/components/Troubleshoot.tsx`, a clickable 7-step methodology
flow, a "what each tool proves" CLI grid with a terminal readout, a live traceroute hop visual,
and an arp -a table, links to `pbq-cli-tools`, `pbq-troubleshoot`, `pbq-tshoot-recall`), the
**Matching mini game** (the `Match` section: `src/matchData.ts` + `src/components/MatchGame.tsx`,
a Quizlet-style timed tile match with 5 curated sets plus a Mixed pool, wrong-tap penalties, and
best-time-per-set saved to localStorage), a **per-session timer** in the top-right
(`src/components/SessionTimer.tsx`, counts up from 0 and restarts fresh on every refresh/return),
plus PBQs across all 5 domains including the two type-it-in formats.

Next, highest value first:

1. **Security missions** — firewall ACL/rules (extend the existing firewall device), and an
   ARP spoofing / on-path attack as a `SequenceDiagram` mission (cheap, reuses the engine).
2. **Implementation** — VLANs (needs port-tagging in the model), NAT/PAT (needs an internet/
   cloud node), 802.11 wireless (needs a new Access Point device type: icon, NIC rules,
   addressing). `pbq-wifi` and `pbq-cabling` exist to link to.
3. Add `Mission.pbq` links to the remaining missions where a matching PBQ exists.

## Definition of done for any change

`npm run build` clean, `npm test` green, no em dashes, copy in the human voice, de-personalized,
and a Playwright screenshot that confirms the UI actually looks right. Then `npm run deploy`
only when asked (it goes to the live site).
