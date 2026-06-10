# Net+ Visual Lab

An all-in-one, beginner-friendly CompTIA Network+ (N10-009) study hub built around a tiny,
dark-mode Cisco Packet Tracer. Place devices, cable them together, and ping: a glowing packet
hops the path while the event log narrates what every switch, router, and firewall is doing.
Then quiz yourself, drill flashcards, and work performance-based questions, all in the browser.

Plain language, real-world analogies, and resource jumps throughout so non-technical people can
ease in. Visuals inspired by Tech With Diego's "Every Networking Concept Explained."

**Live:** https://black-plant-0cfd8ca10.7.azurestaticapps.net

## Modes

- **Visual Lab** has two sub-modes:
  - **Build** is a free sandbox: place, cable, inspect, and ping. Scroll to zoom, drag the
    background to pan.
  - **Learn** plays guided demos of all 21 concepts from the networking chain (Ethernet, MAC,
    Switch, IP, DHCP, Subnet, Router, Gateway, Routes, OSPF, BGP, ICMP, TCP, UDP, Ports,
    Firewall, TLS, VPN, DNS, HTTP, Load balancer). Each demo runs a scripted topology with
    narration plus on-canvas callouts that point things out as they happen, and ends with a
    "Try it yourself" task. Deep-linkable: `?c=ospf`.
- **Quiz** is an iterable practice bank of 45 scenario, "best answer" questions in the style the
  real exam uses. Plain-English explanations with analogies. Get one wrong and it points you to
  the matching Learn demo so you can fix the gap, then keep going.
- **Flashcards** are 67 pre-made cards focused on the highest-yield and most commonly confused
  topics, with 3D flip, self-rating, and a link to the related demo.
- **PBQs** are 9 performance-based questions in four exam-like formats: match (port to protocol),
  categorize (sort devices or terms into buckets), subnet (calculate addressing), and order
  (sequence troubleshooting steps). Each is graded deterministically in the browser with
  per-item feedback, a generated insight on submit, and resource links.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5173

## Test it

```sh
npm test          # run the suite once (Vitest)
npm run test:watch
```

Coverage includes the subnet and IP math (`study.test.ts`) plus content integrity for the quiz,
flashcards, and PBQs (`content.test.ts`): valid answer indices, every resource link points to a
real demo, PBQ answers are internally consistent, and a regression guard that keeps em dashes out
of all user-facing copy.

## Deploy

```sh
npm run deploy   # builds + pushes dist/ to Azure Static Web Apps (needs az login)
```

## What it teaches (CompTIA Network+ N10-009)

Content spans all five exam domains (Networking Concepts, Network Implementation, Network
Operations, Network Security, Network Troubleshooting). Highlights from the Visual Lab:

- **MAC vs IP:** every device gets a MAC; only Layer 3 capable devices get IPs
- **Switches are Layer 2:** no IP, forward frames by MAC table, one LAN only
- **Routers join networks:** each LAN bubble gets its own /24; the router owns `.1` (default gateway)
- **Subnets are visual:** glowing colored bubbles drawn live around each Layer 2 segment
- **Same-subnet vs cross-subnet pings:** direct frame vs "send to the default gateway"
- **Firewalls:** toggle "Block ICMP" on a firewall and watch the ping die mid-path
- **Hosts have one NIC:** try to cable a laptop twice and the app explains why you need a switch

## Stack

React 19 + TypeScript + Vite, hand-rolled SVG (no diagram library). No backend, no state outside
the browser tab. Tested with Vitest.

## Credit

Visual style inspired by [Every Networking Concept Explained](https://youtu.be/bdeV_TjNfFA)
by [Tech With Diego](https://www.youtube.com/@diegoarias-tech). Go watch the original.
