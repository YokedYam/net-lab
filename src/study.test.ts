import { describe, it, expect } from 'vitest';
import { subnetFacts, sameIp, sameNum, CIDR_TABLE, DOMAINS, domainName, domainColor } from './study';

describe('subnetFacts', () => {
  it('computes a /26 correctly', () => {
    const f = subnetFacts('192.168.10.50', 26);
    expect(f.mask).toBe('255.255.255.192');
    expect(f.network).toBe('192.168.10.0');
    expect(f.broadcast).toBe('192.168.10.63');
    expect(f.firstHost).toBe('192.168.10.1');
    expect(f.lastHost).toBe('192.168.10.62');
    expect(f.hostCount).toBe(62);
    expect(f.cidr).toBe(26);
  });

  it('computes a /24 (254 usable hosts)', () => {
    const f = subnetFacts('10.0.0.5', 24);
    expect(f.mask).toBe('255.255.255.0');
    expect(f.network).toBe('10.0.0.0');
    expect(f.broadcast).toBe('10.0.0.255');
    expect(f.firstHost).toBe('10.0.0.1');
    expect(f.lastHost).toBe('10.0.0.254');
    expect(f.hostCount).toBe(254);
  });

  it('computes a /30 (2 usable hosts, point-to-point link)', () => {
    const f = subnetFacts('172.16.5.9', 30);
    expect(f.mask).toBe('255.255.255.252');
    expect(f.network).toBe('172.16.5.8');
    expect(f.broadcast).toBe('172.16.5.11');
    expect(f.firstHost).toBe('172.16.5.9');
    expect(f.lastHost).toBe('172.16.5.10');
    expect(f.hostCount).toBe(2);
  });

  it('computes a /16', () => {
    const f = subnetFacts('172.20.30.40', 16);
    expect(f.mask).toBe('255.255.0.0');
    expect(f.network).toBe('172.20.0.0');
    expect(f.broadcast).toBe('172.20.255.255');
    expect(f.hostCount).toBe(65534);
  });

  it('returns n/a hosts for /31 and /32 (no usable host range)', () => {
    const p2p = subnetFacts('10.0.0.1', 31);
    expect(p2p.hostCount).toBe(0);
    expect(p2p.firstHost).toBe('n/a');
    expect(p2p.lastHost).toBe('n/a');

    const host = subnetFacts('10.0.0.1', 32);
    expect(host.hostCount).toBe(0);
    expect(host.firstHost).toBe('n/a');
    expect(host.lastHost).toBe('n/a');
    expect(host.mask).toBe('255.255.255.255');
  });

  it('handles /0 (whole address space)', () => {
    const f = subnetFacts('8.8.8.8', 0);
    expect(f.mask).toBe('0.0.0.0');
    expect(f.network).toBe('0.0.0.0');
    expect(f.broadcast).toBe('255.255.255.255');
    expect(f.hostCount).toBe(Math.pow(2, 32) - 2);
  });
});

describe('sameIp', () => {
  it('matches exact and whitespace-padded values', () => {
    expect(sameIp('192.168.1.0', '192.168.1.0')).toBe(true);
    expect(sameIp(' 192.168.1.0 ', '192.168.1.0')).toBe(true);
  });
  it('rejects different addresses', () => {
    expect(sameIp('192.168.1.1', '192.168.1.0')).toBe(false);
  });
});

describe('sameNum', () => {
  it('parses plain and comma/space-formatted numbers', () => {
    expect(sameNum('254', 254)).toBe(true);
    expect(sameNum('65,534', 65534)).toBe(true);
    expect(sameNum(' 62 ', 62)).toBe(true);
  });
  it('rejects wrong or non-numeric input', () => {
    expect(sameNum('253', 254)).toBe(false);
    expect(sameNum('abc', 254)).toBe(false);
    expect(sameNum('', 0)).toBe(false);
  });
});

describe('CIDR_TABLE', () => {
  it('covers /16 through /30', () => {
    expect(CIDR_TABLE[0].cidr).toBe(16);
    expect(CIDR_TABLE[CIDR_TABLE.length - 1].cidr).toBe(30);
    expect(CIDR_TABLE).toHaveLength(15);
  });
  it('has correct mask + usable host counts for key rows', () => {
    const c24 = CIDR_TABLE.find((r) => r.cidr === 24)!;
    expect(c24.mask).toBe('255.255.255.0');
    expect(c24.hosts).toBe(254);

    const c30 = CIDR_TABLE.find((r) => r.cidr === 30)!;
    expect(c30.mask).toBe('255.255.255.252');
    expect(c30.hosts).toBe(2);
  });
});

describe('DOMAINS', () => {
  it('weights sum to 100 (N10-009)', () => {
    const total = DOMAINS.reduce((s, d) => s + d.weight, 0);
    expect(total).toBe(100);
  });
  it('domainName and domainColor resolve known ids', () => {
    expect(domainName('1.0')).toBe('Networking Concepts');
    expect(domainColor('1.0')).toMatch(/^#/);
  });
});
