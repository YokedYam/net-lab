import type { Device, DeviceConfig, NetInfo } from '../model';
import { DEVICE_COLOR, DEVICE_LABEL, effectiveAddr, ipToInt, isHost, parseMask } from '../model';

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
  onConfig,
}: {
  device: Device | null;
  net: NetInfo;
  onToggleIcmp: (id: string, blocked: boolean) => void;
  onConfig: (id: string, patch: DeviceConfig) => void;
}) {
  return (
    <div className="panel details">
      <div className="panel-title">Device details</div>
      {!device ? (
        <div className="muted pad">
          Click a device (with the Select tool) to inspect its MAC, IP, subnet and gateway.
        </div>
      ) : (
        <Details device={device} net={net} onToggleIcmp={onToggleIcmp} onConfig={onConfig} />
      )}
    </div>
  );
}

function HostAddressing({
  d,
  net,
  onConfig,
}: {
  d: Device;
  net: NetInfo;
  onConfig: (id: string, patch: DeviceConfig) => void;
}) {
  const isStatic = d.ipMode === 'static';
  const addrs = net.addrs.get(d.id) ?? [];
  const segOf = (segId: string) => net.segments.find((s) => s.id === segId);

  const ipOk = !d.staticIp || ipToInt(d.staticIp) !== null;
  const maskOk = !d.staticMask || parseMask(d.staticMask) !== null;
  const gwOk = !d.staticGateway?.trim() || ipToInt(d.staticGateway) !== null;
  const eff = isStatic ? effectiveAddr(d, net) : null;
  const network =
    eff && !eff.invalid && ipToInt(eff.ip) !== null
      ? (() => {
          const ai = ipToInt(eff.ip)!;
          const m = eff.cidr <= 0 ? 0 : (0xffffffff << (32 - eff.cidr)) >>> 0;
          const nw = (ai & m) >>> 0;
          return `${[(nw >>> 24) & 255, (nw >>> 16) & 255, (nw >>> 8) & 255, nw & 255].join('.')}/${eff.cidr}`;
        })()
      : null;

  return (
    <div className="addr-block" data-coach="addressing">
      <div className="seg-toggle">
        <button
          className={!isStatic ? 'seg on' : 'seg'}
          onClick={() => onConfig(d.id, { ipMode: 'auto' })}
          data-coach="ipmode-auto"
        >
          Auto (DHCP)
        </button>
        <button
          className={isStatic ? 'seg on' : 'seg'}
          onClick={() => onConfig(d.id, { ipMode: 'static' })}
          data-coach="ipmode-static"
        >
          Static
        </button>
      </div>

      {!isStatic ? (
        addrs.length === 0 ? (
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
            <p className="blurb">IP auto-assigned for this LAN. Think “DHCP did it for me”.</p>
          </>
        )
      ) : (
        <div className="ipform">
          <label className={ipOk ? 'ipf' : 'ipf bad'}>
            <span>IP address</span>
            <input
              value={d.staticIp ?? ''}
              placeholder="192.168.1.10"
              spellCheck={false}
              data-coach="static-ip"
              onChange={(e) => onConfig(d.id, { staticIp: e.target.value })}
            />
          </label>
          <label className={maskOk ? 'ipf' : 'ipf bad'}>
            <span>Subnet mask</span>
            <input
              value={d.staticMask ?? ''}
              placeholder="255.255.255.0 or 24"
              spellCheck={false}
              data-coach="static-mask"
              onChange={(e) => onConfig(d.id, { staticMask: e.target.value })}
            />
          </label>
          <label className={gwOk ? 'ipf' : 'ipf bad'}>
            <span>Default gateway</span>
            <input
              value={d.staticGateway ?? ''}
              placeholder="192.168.1.1 (optional)"
              spellCheck={false}
              data-coach="static-gateway"
              onChange={(e) => onConfig(d.id, { staticGateway: e.target.value })}
            />
          </label>
          {network ? (
            <p className="blurb">
              This puts {d.name} in <b>{network}</b>. Anything outside it has to go through the gateway.
            </p>
          ) : (
            <p className="blurb warn-text">Enter a valid IP and mask. A host can’t talk until both parse.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Details({
  device: d,
  net,
  onToggleIcmp,
  onConfig,
}: {
  device: Device;
  net: NetInfo;
  onToggleIcmp: (id: string, blocked: boolean) => void;
  onConfig: (id: string, patch: DeviceConfig) => void;
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
      {isHost(d.type) && <HostAddressing d={d} net={net} onConfig={onConfig} />}
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
    </div>
  );
}
