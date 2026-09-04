import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fmtRp, fmtDur, safeSetItem, normalizeItems } from '../App';

// ─── fmtRp ───────────────────────────────────────────────────────────────────

describe('fmtRp', () => {
  it('formats zero', () => {
    expect(fmtRp(0)).toBe('Rp 0');
  });

  it('formats falsy values as Rp 0', () => {
    expect(fmtRp(null)).toBe('Rp 0');
    expect(fmtRp(undefined)).toBe('Rp 0');
  });

  it('formats thousands correctly (id-ID locale)', () => {
    expect(fmtRp(20000)).toBe('Rp 20.000');
    expect(fmtRp(50000)).toBe('Rp 50.000');
    expect(fmtRp(1000000)).toBe('Rp 1.000.000');
  });

  it('rounds before formatting', () => {
    expect(fmtRp(20000.7)).toBe('Rp 20.001');
    expect(fmtRp(19999.4)).toBe('Rp 19.999');
  });
});

// ─── fmtDur ──────────────────────────────────────────────────────────────────

describe('fmtDur', () => {
  it('formats zero as 00:00:00', () => {
    expect(fmtDur(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(fmtDur(45)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(fmtDur(90)).toBe('00:01:30');
  });

  it('formats hours, minutes, seconds', () => {
    expect(fmtDur(3661)).toBe('01:01:01');
  });

  it('pads single digits with zero', () => {
    expect(fmtDur(3600)).toBe('01:00:00');
    expect(fmtDur(60)).toBe('00:01:00');
    expect(fmtDur(9)).toBe('00:00:09');
  });
});

// ─── safeSetItem ─────────────────────────────────────────────────────────────

describe('safeSetItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores value normally', () => {
    safeSetItem('kw_test', 'hello');
    expect(localStorage.getItem('kw_test')).toBe('hello');
  });

  it('prunes kw_txns and retries when QuotaExceededError is thrown', () => {
    // Fill kw_txns with 300 fake transactions
    const txns = Array.from({ length: 300 }, (_, i) => ({ id: String(i), no: i, _synced: true }));
    localStorage.setItem('kw_txns', JSON.stringify(txns));

    // Mock localStorage.setItem to throw QuotaExceededError on first call
    let callCount = 0;
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      return original(key, value);
    });

    safeSetItem('kw_other', '"data"');

    // kw_txns should have been pruned to 200
    const remaining = JSON.parse(localStorage.getItem('kw_txns'));
    expect(remaining.length).toBe(200);
    // The last 200 should be items 100–299
    expect(remaining[0].no).toBe(100);

    vi.restoreAllMocks();
  });
});

// ─── normalizeItems ──────────────────────────────────────────────────────────

describe('normalizeItems with per-item metadata', () => {
  it('preserves startTime, payAwal, and priceBase if present on item object', () => {
    const raw = [
      { code: 'STROLLER', qty: 1, startTime: 1725450000000, payAwal: 'cash', priceBase: 40000 },
      { code: 'SCOOTER', qty: 2, startTime: 1725450300000, payAwal: 'qris', priceBase: 30000 }
    ];
    const normalized = normalizeItems(raw);
    expect(normalized).toEqual([
      { code: 'STROLLER', qty: 1, startTime: 1725450000000, payAwal: 'cash', priceBase: 40000 },
      { code: 'SCOOTER', qty: 2, startTime: 1725450300000, payAwal: 'qris', priceBase: 30000 }
    ]);
  });

  it('handles legacy object items without startTime cleanly', () => {
    const raw = [{ code: 'STROLLER', qty: 1 }];
    const normalized = normalizeItems(raw);
    expect(normalized).toEqual([{ code: 'STROLLER', qty: 1 }]);
    expect(normalized[0].startTime).toBeUndefined();
  });
});
