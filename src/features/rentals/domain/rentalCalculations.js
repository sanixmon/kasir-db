/**
 * Pure deterministic rental & overtime calculations.
 * Completely free of React, DOM, and API dependencies.
 */

/**
 * Calculate Overtime intervals based on Evren House rules:
 * - 0 to 10m59s past limit (floor(actualOver) < 11): Free grace period (0 OT)
 * - 11 to 40 min past limit: Half-hour rate (otHalf = 1)
 * - 41 to 60 min past limit: Full-hour rate (otFull += 1)
 * - Cascades similarly for subsequent overtime hours.
 *
 * @param {number} elapsedMin - total elapsed minutes
 * @param {number} limitMin - free limit in minutes (60 for standard 1h, packageHours * 60 for packages)
 * @returns {{ otFull: number, otHalf: number }}
 */
export function calcOT(elapsedMin, limitMin) {
  const actualOver = elapsedMin - limitMin;
  if (actualOver < 0 || Math.floor(actualOver) < 11) {
    return { otFull: 0, otHalf: 0 };
  }

  let otFull = Math.floor(actualOver / 60);
  let otHalf = 0;

  const floorRem = Math.floor(actualOver % 60);

  if (floorRem >= 11 && floorRem <= 40) {
    otHalf = 1;
  } else if (floorRem > 40) {
    otFull += 1;
  }

  return { otFull, otHalf };
}

/**
 * Calculate total OT cost in IDR for an item.
 * @param {number} elapsedMin
 * @param {number} limitMin
 * @param {{ priceOT30: number, priceOT60: number, priceOT50?: number, priceHour?: number }} def
 * @param {number} [qty=1]
 * @returns {number}
 */
export function calcOTCost(elapsedMin, limitMin, def, qty = 1) {
  const { otFull, otHalf } = calcOT(elapsedMin, limitMin);
  const price60 = def.priceOT60 || def.priceOT50 || def.priceHour || 0;
  const price30 = def.priceOT30 || 0;
  return (otFull * price60 + otHalf * price30) * qty;
}

/**
 * Calculate single item calculation object for CalculateRentalModal.
 * @param {Object} it - item from session { code, qty }
 * @param {Object} def - definition from ITEMS catalog
 * @param {number} elapsedMin - elapsed duration in minutes
 * @param {number} [customReturnQty] - custom return quantity
 */
export function calculateItemDetail(it, def, elapsedMin, customReturnQty) {
  const defaultDef = { priceHour: 0, priceOT30: 0, priceOT60: 0, isPackage: false, packageHours: 1 };
  const d = def || defaultDef;
  const limitMin = d.isPackage ? d.packageHours * 60 : 60;
  const price60 = d.priceOT60 || d.priceOT50 || d.priceHour || 0;
  const price30 = d.priceOT30 || 0;

  const { otFull, otHalf } = calcOT(elapsedMin, limitMin);
  const returnQty = customReturnQty !== undefined ? customReturnQty : (it?.qty || 1);

  const baseCost = (d.priceHour || 0) * returnQty;
  const otCost = (otFull * price60 + otHalf * price30) * returnQty;

  return {
    ...it,
    def: d,
    limitMin,
    returnQty,
    baseCost,
    otFullCount: otFull,
    otHalfCount: otHalf,
    otCost
  };
}

/**
 * Calculate summary amounts across all items in rental modal.
 * @param {Array<Object>} itemsCalc
 * @returns {{ baseSum: number, otSum: number, grandOT: number, totalReturnQty: number }}
 */
export function calculateRentalTotals(itemsCalc = []) {
  const baseSum = itemsCalc.reduce((sum, it) => sum + (it.baseCost || 0), 0);
  const otSum = itemsCalc.reduce((sum, it) => sum + (it.otCost || 0), 0);
  const grandOT = Math.max(0, otSum);
  const totalReturnQty = itemsCalc.reduce((sum, it) => sum + (it.returnQty || 0), 0);

  return {
    baseSum,
    otSum,
    grandOT,
    totalReturnQty
  };
}

/**
 * Calculate partial vs returned item split and format string.
 * @param {Array<Object>} sessionItems - original items in session [{ code, qty }]
 * @param {Array<Object>} itemsCalc - items with returnQty from calculation
 * @returns {{ itemStr: string, remainingItems: Array<Object> }}
 */
export function calculatePartialReturn(sessionItems = [], itemsCalc = []) {
  const itemStr = itemsCalc
    .filter((it) => it.returnQty > 0)
    .map((it) => `${it.code}×${it.returnQty}`)
    .join(', ');

  const remainingItems = sessionItems
    .map((orig) => {
      const calc = itemsCalc.find((it) => it.code === orig.code);
      const returned = calc ? calc.returnQty : 0;
      return {
        ...orig,
        qty: orig.qty - returned
      };
    })
    .filter((it) => it.qty > 0);

  return {
    itemStr,
    remainingItems
  };
}

/**
 * Format string descriptions for overtime periods.
 * @param {Array<Object>} itemsCalc
 * @returns {{ otStr: string, otDurStr: string }}
 */
export function formatOvertimeStrings(itemsCalc = []) {
  const otItems = itemsCalc.filter(
    (it) => it.returnQty > 0 && (it.otFullCount > 0 || it.otHalfCount > 0)
  );

  const otStr = otItems
    .map(
      (it) =>
        `${it.code}(${it.otFullCount > 0 ? it.otFullCount + '×1j' : ''}${
          it.otHalfCount > 0 ? (it.otFullCount > 0 ? '+' : '') + it.otHalfCount + '×½j' : ''
        })`
    )
    .join(', ');

  const otDurStr = otItems
    .map((it) => `${it.code}:${it.otFullCount * 60 + it.otHalfCount * 30}m`)
    .join(', ');

  return {
    otStr: otStr || '-',
    otDurStr: otDurStr || '-'
  };
}

/**
 * Get local date string YYYY-MM-DD from timestamp.
 * @param {number} [ts]
 * @returns {string}
 */
export function localDateStr(ts) {
  const d = ts ? new Date(ts) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}
