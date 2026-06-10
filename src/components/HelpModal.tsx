export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>How this lab works</h2>
          <button className="btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <p>
          A tiny Cisco Packet Tracer. Place devices, cable them together, then ping and watch the
          packet hop the path while the event log narrates what every device is doing. Scroll to
          zoom, drag the background to pan.
        </p>
        <p>
          <b>Two modes:</b> the <b>Build</b> tab is the free sandbox below. The <b>Learn</b> tab
          plays guided demos of all 21 concepts from the networking chain. Ethernet to load
          balancer: each ending with a “Try it yourself” hands-on task.
        </p>
        <ol>
          <li>
            <b>Place</b>: pick a device in the left bar, click the canvas to drop it.
          </li>
          <li>
            <b>Cable</b>: click two devices to connect them. Hosts have one NIC; use a switch to
            fan out.
          </li>
          <li>
            <b>Inspect</b>: Select tool, click a device: MAC, IP, subnet, gateway. IPs are
            auto-assigned per LAN (pretend DHCP). Glowing bubbles show each subnet.
          </li>
          <li>
            <b>Ping</b>: click source, then destination. Same subnet goes straight through the
            switch; different subnets must use the default gateway (a router).
          </li>
        </ol>
        <h3>Try these</h3>
        <ol>
          <li>
            <b>Ping across networks:</b> on the demo, ping Laptop-1 → Server-1. Read the log: gateway
            decision, router hop, firewall inspection.
          </li>
          <li>
            <b>Break it:</b> select Firewall-1, check “Block ICMP”, ping again: watch the packet die
            at the wall.
          </li>
          <li>
            <b>Build your own:</b> Clear the canvas. Two laptops + a switch = one LAN (ping works
            with no router!). Add a second LAN and join them with a router.
          </li>
        </ol>
        <h3>Cheat sheet</h3>
        <ul className="gloss">
          <li>
            <b>MAC address</b>: burned-in hardware ID; only used inside the local network.
          </li>
          <li>
            <b>IP address</b>: logical address that can cross networks.
          </li>
          <li>
            <b>Switch (L2)</b>: forwards frames by MAC within one LAN; has no IP.
          </li>
          <li>
            <b>Router (L3)</b>: joins networks and forwards packets by IP.
          </li>
          <li>
            <b>Default gateway</b>: the router IP your device uses when the target is off-subnet.
          </li>
          <li>
            <b>Firewall</b>: allows or blocks traffic by rule (here: an ICMP toggle).
          </li>
        </ul>
        <p className="muted">Esc returns to the Select tool at any time.</p>
      </div>
    </div>
  );
}
