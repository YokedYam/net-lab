import { describe, expect, it } from 'vitest';
import type { Device, Link } from './model';
import { computeNetworks, effectiveAddr, parseMask, planPing, randMac } from './model';

let n = 0;
const dev = (type: Device['type'], over: Partial<Device> = {}): Device => ({
  id: `d${n++}`,
  type,
  name: over.name ?? `${type}-${n}`,
  mac: randMac(),
  x: 0,
  y: 0,
  blockIcmp: false,
  ipMode: 'auto',
  ...over,
});
const link = (a: Device, b: Device): Link => ({ id: `l${n++}`, a: a.id, b: b.id });

const ping = (src: Device, dst: Device, devices: Device[], links: Link[]) =>
  planPing(src.id, dst.id, devices, links, computeNetworks(devices, links));

describe('parseMask', () => {
  it('accepts dotted, CIDR, and slash forms', () => {
    expect(parseMask('255.255.255.0')).toBe(24);
    expect(parseMask('24')).toBe(24);
    expect(parseMask('/24')).toBe(24);
    expect(parseMask('255.255.0.0')).toBe(16);
    expect(parseMask('255.255.255.192')).toBe(26);
  });
  it('rejects non-contiguous and out-of-range masks', () => {
    expect(parseMask('255.0.255.0')).toBeNull();
    expect(parseMask('33')).toBeNull();
    expect(parseMask('hello')).toBeNull();
  });
});

describe('effectiveAddr', () => {
  it('uses the static config when set', () => {
    const d = dev('laptop', { ipMode: 'static', staticIp: '10.1.1.5', staticMask: '24', staticGateway: '10.1.1.1' });
    const eff = effectiveAddr(d, computeNetworks([d], []));
    expect(eff).toMatchObject({ ip: '10.1.1.5', cidr: 24, gateway: '10.1.1.1', source: 'static' });
  });
  it('flags an invalid static IP', () => {
    const d = dev('laptop', { ipMode: 'static', staticIp: '999.1.1.1', staticMask: '24' });
    expect(effectiveAddr(d, computeNetworks([d], []))?.invalid).toBe('ip');
  });
});

describe('planPing with manual addressing', () => {
  it('succeeds for two correctly-configured hosts on one switch', () => {
    const a = dev('laptop', { ipMode: 'static', staticIp: '192.168.1.10', staticMask: '24' });
    const b = dev('server', { ipMode: 'static', staticIp: '192.168.1.20', staticMask: '24' });
    const sw = dev('switch');
    const devices = [a, b, sw];
    const links = [link(a, sw), link(b, sw)];
    const res = ping(a, b, devices, links);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.plan.outcome).toBe('success');
  });

  it('fails when the host has no default gateway for an off-subnet destination', () => {
    const a = dev('laptop', { ipMode: 'static', staticIp: '192.168.1.10', staticMask: '24' });
    const b = dev('server', { ipMode: 'static', staticIp: '192.168.2.10', staticMask: '24' });
    const r = dev('router');
    const devices = [a, b, r];
    const links = [link(a, r), link(r, b)];
    const res = ping(a, b, devices, links);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.msgs[0].text).toMatch(/no default gateway/i);
  });

  it('fails when a too-wide mask makes the host think a routed destination is local', () => {
    const a = dev('laptop', { ipMode: 'static', staticIp: '192.168.1.10', staticMask: '255.255.0.0', staticGateway: '192.168.1.1' });
    const b = dev('server', { ipMode: 'static', staticIp: '192.168.2.10', staticMask: '24' });
    const r = dev('router');
    const devices = [a, b, r];
    const links = [link(a, r), link(r, b)];
    const res = ping(a, b, devices, links);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.msgs[0].text).toMatch(/thinks .* local/i);
  });

  it('fails when two hosts share a wire but sit in different subnets', () => {
    const a = dev('laptop', { ipMode: 'static', staticIp: '192.168.1.10', staticMask: '24', staticGateway: '192.168.1.1' });
    const b = dev('server', { ipMode: 'static', staticIp: '10.0.0.5', staticMask: '24', staticGateway: '10.0.0.1' });
    const sw = dev('switch');
    const devices = [a, b, sw];
    const links = [link(a, sw), link(b, sw)];
    const res = ping(a, b, devices, links);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.msgs[0].text).toMatch(/different subnets/i);
  });

  it('still works with default auto addressing across a router', () => {
    const a = dev('laptop');
    const b = dev('server');
    const r = dev('router');
    const devices = [a, b, r];
    const links = [link(a, r), link(r, b)];
    const res = ping(a, b, devices, links);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.plan.outcome).toBe('success');
  });
});
