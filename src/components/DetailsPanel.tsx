import type { Device, NetInfo } from '../model';
import { DEVICE_COLOR, DEVICE_LABEL, isHost } from '../model';

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="row">
      <span className="row-k">{k}</span>
      <span className={warn ? 'row-v warn' : 'row-v'}>{v}</span>
    </div>
  );
}

export function DetailsPanel({
  device,
  net,
  onToggleIcmp,
}: {
  device: Device | null;
  net: NetInfo;
  onToggleIcmp: (id: string, blocked: boolean) => void;
}) {
  return (
    <div className="panel details">
      <div className="panel-title">Device details</div>
      {!device ? (
        <div className="muted pad">
          Click a device (with the Select tool) to inspect its MAC, IP, subnet and gateway.
        </div>
      ) : (
        <Details device={device} net={net} onToggleIcmp={onToggleIcmp} />
      )}
    </div>
  );
}

function Details({
  device: d,
  net,
  onToggleIcmp,
}: {
  device: Device;
  net: NetInfo;
  onToggleIcmp: (id: string, blocked: boolean) => void;
}) {
  const addrs = net.addrs.get(d.id) ?? [];
  const segOf = (segId: string) => net.segments.find((s) => s.id === segId);
  return (
    <div className="pad">
      <div className="dev-head">
        <span className="chip" style={{ background: DEVICE_COLOR[d.type] }} />
        <div>
          <div className="dev-head-name">{d.name}</div>
          <div className="dev-head-type">{DEVICE_LABEL[d.type]}</div>
        </div>
      </div>
      <Row k="MAC" v={d.mac} />
      {isHost(d.type) &&
        (addrs.length === 0 ? (
          <Row k="IP" v="none: cable me to a network" warn />
        ) : (
          <>
            <Row k="IP" v={addrs[0].ip} />
            <Row k="Subnet" v={segOf(addrs[0].segId)?.subnet ?? ''} />
            <Row
              k="Gateway"
              v={segOf(addrs[0].segId)?.gatewayIp ?? 'none: add a router to leave this LAN'}
              warn={!segOf(addrs[0].segId)?.gatewayIp}
            />
          </>
        ))}
      {d.type === 'router' &&
        (addrs.length === 0 ? (
          <Row k="Interfaces" v="none: cable networks to me" warn />
        ) : (
          addrs.map((a, i) => (
            <Row key={a.segId} k={`eth${i}`} v={`${a.ip} · ${segOf(a.segId)?.subnet ?? ''}`} />
          ))
        ))}
      {d.type === 'switch' && (
        <p className="blurb">
          Layer 2 switch: no IP address. It forwards Ethernet frames using its MAC address table,
          inside one network only.
        </p>
      )}
      {d.type === 'router' && (
        <p className="blurb">
          Layer 3 router: it owns the “.1” gateway address on each network it touches and routes
          packets between them.
        </p>
      )}
      {d.type === 'firewall' && (
        <>
          <p className="blurb">
            Inline (transparent) firewall: traffic on this cable run must pass through it, and its
            rules decide what gets by.
          </p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={d.blockIcmp}
              onChange={(e) => onToggleIcmp(d.id, e.target.checked)}
            />
            <span>Block ICMP (ping)</span>
          </label>
        </>
      )}
      {isHost(d.type) && addrs.length > 0 && (
        <p className="blurb">IP auto-assigned for this LAN. Think “DHCP did it for me”.</p>
      )}
    </div>
  );
}
