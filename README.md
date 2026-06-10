# Net+ Visual Lab

A tiny, dark-mode Cisco Packet Tracer for learning networking — inspired by Tech With Diego's
"Network Lab 101" visuals. Place devices, cable them together, and ping: a glowing packet hops
the path while the event log narrates what every switch, router, and firewall is doing.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5173

## What it teaches (CompTIA Network+ Domain 1.0)

- **MAC vs IP** — every device gets a MAC; only L3-capable devices get IPs
- **Switches are Layer 2** — no IP, forward frames by MAC table, one LAN only
- **Routers join networks** — each LAN bubble gets its own /24; the router owns `.1` (default gateway)
- **Subnets are visual** — glowing colored bubbles drawn live around each L2 segment
- **Same-subnet vs cross-subnet pings** — direct frame vs "send to default gateway"
- **Firewalls** — toggle "Block ICMP" on a firewall and watch the ping die mid-path
- **Hosts have one NIC** — try to cable a laptop twice and the app explains why you need a switch

## Stack

React 19 + TypeScript + Vite, hand-rolled SVG (no diagram library). No backend, no state outside
the browser tab.

## Roadmap

- Phase 2: concept sidebar (click a Net+ concept → guided diagram), per the vault plan
- Phase 3: deploy to Azure Static Web Apps + portfolio card
