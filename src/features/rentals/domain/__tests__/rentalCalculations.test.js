import { describe, it, expect } from 'vitest';
import {
  calcOT,
  calcOTCost,
  calculateItemDetail,
  calculateRentalTotals,
  calculatePartialReturn,
  formatOvertimeStrings
} from '../rentalCalculations';

const SD = { code: 'SD', name: 'Scooter Dewasa', priceHour: 50000, priceOT30: 25000, priceOT60: 50000 };
const ST = { code: 'ST', name: 'Stroller', priceHour: 30000, priceOT30: 10000, priceOT60: 20000 };

describe('Rental Calculations Domain - Overtime Boundary Invariants', () => {
  it('0–10m59s past 60 min limit is strictly free (0 OT)', () => {
    expect(calcOT(60, 60)).toEqual({ otFull: 0, otHalf: 0 });
    expect(calcOT(70, 60)).toEqual({ otFull: 0, otHalf: 0 });
    // 10 menit 58 detik (70.966 min)
    expect(calcOT(70 + 58 / 60, 60)).toEqual({ otFull: 0, otHalf: 0 });
    // 10 menit 59 detik (70.983 min)
    expect(calcOT(70 + 59 / 60, 60)).toEqual({ otFull: 0, otHalf: 0 });
  });

  it('exactly 11 minutes (71 min) triggers half-hour overtime', () => {
    expect(calcOT(71, 60)).toEqual({ otFull: 0, otHalf: 1 });
    // 11 menit 1 detik (71.016 min)
    expect(calcOT(71 + 1 / 60, 60)).toEqual({ otFull: 0, otHalf: 1 });
  });

  it('11–40 minutes past limit gives half-hour rate', () => {
    expect(calcOT(71, 60)).toEqual({ otFull: 0, otHalf: 1 });
    expect(calcOT(90, 60)).toEqual({ otFull: 0, otHalf: 1 });
    expect(calcOT(100, 60)).toEqual({ otFull: 0, otHalf: 1 });
  });

  it('41–60 minutes past limit gives full-hour rate', () => {
    expect(calcOT(101, 60)).toEqual({ otFull: 1, otHalf: 0 });
    expect(calcOT(120, 60)).toEqual({ otFull: 1, otHalf: 0 });
  });

  it('second hour has 10m59s grace before triggering 1.5h OT', () => {
    // 120 min (60 min over limit) -> 1 full
    expect(calcOT(120, 60)).toEqual({ otFull: 1, otHalf: 0 });
    // 130 min (70 min over limit) -> still 1 full (in second grace)
    expect(calcOT(130, 60)).toEqual({ otFull: 1, otHalf: 0 });
    // 131 min (71 min over limit) -> 1 full + 1 half
    expect(calcOT(131, 60)).toEqual({ otFull: 1, otHalf: 1 });
    // 161 min (101 min over limit) -> 2 full
    expect(calcOT(161, 60)).toEqual({ otFull: 2, otHalf: 0 });
  });
});

describe('Rental Calculations Domain - Partial Return Split Billing', () => {
  it('full return: all items returned, 0 remaining items', () => {
    const sessionItems = [
      { code: 'SD', qty: 2 },
      { code: 'ST', qty: 1 }
    ];
    const itemsCalc = [
      { code: 'SD', returnQty: 2 },
      { code: 'ST', returnQty: 1 }
    ];

    const result = calculatePartialReturn(sessionItems, itemsCalc);
    expect(result.itemStr).toBe('SD×2, ST×1');
    expect(result.remainingItems).toEqual([]);
  });

  it('partial return single item: 2 rented, 1 returned -> 1 remaining', () => {
    const sessionItems = [{ code: 'SD', qty: 2 }];
    const itemsCalc = [{ code: 'SD', returnQty: 1 }];

    const result = calculatePartialReturn(sessionItems, itemsCalc);
    expect(result.itemStr).toBe('SD×1');
    expect(result.remainingItems).toEqual([{ code: 'SD', qty: 1 }]);
  });

  it('partial return multi-item: return 1 of 2 types', () => {
    const sessionItems = [
      { code: 'SD', qty: 2 },
      { code: 'ST', qty: 2 }
    ];
    const itemsCalc = [
      { code: 'SD', returnQty: 2 },
      { code: 'ST', returnQty: 0 } // ST not returned yet
    ];

    const result = calculatePartialReturn(sessionItems, itemsCalc);
    expect(result.itemStr).toBe('SD×2');
    expect(result.remainingItems).toEqual([{ code: 'ST', qty: 2 }]);
  });

  it('partial return mixed quantities: partial across both types', () => {
    const sessionItems = [
      { code: 'SD', qty: 3 },
      { code: 'ST', qty: 2 }
    ];
    const itemsCalc = [
      { code: 'SD', returnQty: 1 },
      { code: 'ST', returnQty: 1 }
    ];

    const result = calculatePartialReturn(sessionItems, itemsCalc);
    expect(result.itemStr).toBe('SD×1, ST×1');
    expect(result.remainingItems).toEqual([
      { code: 'SD', qty: 2 },
      { code: 'ST', qty: 1 }
    ]);
  });
});

describe('Rental Calculations Domain - Item Details and Totals', () => {
  it('calculateItemDetail properly formats cost and OT counts', () => {
    const item = { code: 'SD', qty: 2 };
    // 71 min -> 11 min over limit -> 1 half hour (25,000 per qty)
    const detail = calculateItemDetail(item, SD, 71, 2);

    expect(detail.baseCost).toBe(100000); // 50000 * 2
    expect(detail.otFullCount).toBe(0);
    expect(detail.otHalfCount).toBe(1);
    expect(detail.otCost).toBe(50000); // 25000 * 2
  });

  it('calculateRentalTotals aggregates baseSum, otSum, and return quantities', () => {
    const itemsCalc = [
      { baseCost: 100000, otCost: 50000, returnQty: 2 },
      { baseCost: 30000, otCost: 0, returnQty: 1 }
    ];
    const totals = calculateRentalTotals(itemsCalc);

    expect(totals.baseSum).toBe(130000);
    expect(totals.otSum).toBe(50000);
    expect(totals.grandOT).toBe(50000);
    expect(totals.totalReturnQty).toBe(3);
  });

  it('formatOvertimeStrings outputs correct human-readable breakdown', () => {
    const itemsCalc = [
      { code: 'SD', returnQty: 1, otFullCount: 1, otHalfCount: 1 },
      { code: 'ST', returnQty: 1, otFullCount: 0, otHalfCount: 0 }
    ];
    const { otStr, otDurStr } = formatOvertimeStrings(itemsCalc);

    expect(otStr).toBe('SD(1×1j+1×½j)');
    expect(otDurStr).toBe('SD:90m');
  });
});

describe('calculatePartialReturn metadata preservation', () => {
  it('preserves startTime, payAwal, and priceBase on remainingItems', () => {
    const sessionItems = [
      { code: 'STROLLER', qty: 1, startTime: 1000000, payAwal: 'cash', priceBase: 40000 },
      { code: 'SCOOTER', qty: 2, startTime: 1000300, payAwal: 'qris', priceBase: 30000 }
    ];
    const itemsCalc = [
      { code: 'STROLLER', returnQty: 1 },
      { code: 'SCOOTER', returnQty: 1 }
    ];

    const result = calculatePartialReturn(sessionItems, itemsCalc);
    expect(result.itemStr).toBe('STROLLER×1, SCOOTER×1');
    expect(result.remainingItems).toEqual([
      { code: 'SCOOTER', qty: 1, startTime: 1000300, payAwal: 'qris', priceBase: 30000 }
    ]);
  });
});

describe('calculateItemDetail with per-item start timing', () => {
  it('calculates overtime accurately for independent item elapsed minutes', () => {
    const it = { code: 'SCOOTER', qty: 1, startTime: 1000300 };
    const def = { priceHour: 30000, priceOT30: 15000, priceOT60: 30000, isPackage: false, packageHours: 1 };
    
    // 75 minutes elapsed for scooter (15m OT -> falls in 11..40 half hour rate)
    const calc = calculateItemDetail(it, def, 75);
    expect(calc.otHalfCount).toBe(1);
    expect(calc.otFullCount).toBe(0);
    expect(calc.otCost).toBe(15000);
    expect(calc.baseCost).toBe(30000);
  });
});
