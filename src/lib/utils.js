import { getShiftDate } from './shift';

// ─── Formatting ───────────────────────────────────────────────────────────────

export const fmtRp = n => n ? 'Rp ' + Math.round(n).toLocaleString('id-ID') : 'Rp 0';

export const fmtDur = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

export const generateShortId = (prefix = 's') => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// ─── LocalStorage ─────────────────────────────────────────────────────────────

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError' && key !== 'kw_txns') {
      try {
        const txns = JSON.parse(localStorage.getItem('kw_txns') || '[]');
        const pruned = txns.slice(-200);
        console.warn('localStorage quota exceeded, pruning old transactions...');
        localStorage.setItem('kw_txns', JSON.stringify(pruned));
      } catch (_) {}
      localStorage.setItem(key, value);
    } else {
      throw e;
    }
  }
}

// ─── Data Normalization ───────────────────────────────────────────────────────

export function normalizeItems(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(it => {
      if (!it) return null;
      if (typeof it === 'string') {
        const m = it.trim().match(/^(.+?)(?:[x\xD7](\d+))?$/i);
        return m ? { code: m[1].trim(), qty: Number(m[2] || 1) } : { code: it.trim(), qty: 1 };
      }
      if (typeof it === 'object') {
        const res = {
          code: String(it.code || 'ITEM'),
          qty: Number(it.qty || 1)
        };
        if (it.startTime !== undefined && !isNaN(Number(it.startTime))) {
          res.startTime = Number(it.startTime);
        }
        if (it.payAwal) {
          res.payAwal = String(it.payAwal).toLowerCase();
        }
        if (it.priceBase !== undefined && !isNaN(Number(it.priceBase))) {
          res.priceBase = Number(it.priceBase);
        }
        return res;
      }
      return null;
    }).filter(Boolean);
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return normalizeItems(parsed);
    } catch(e) {}
    return val.split(',').map(part => {
      const p = part.trim();
      const m = p.match(/^(.+?)(?:[x\xD7](\d+))?$/i);
      return m ? { code: m[1].trim(), qty: Number(m[2] || 1) } : { code: p, qty: 1 };
    }).filter(Boolean);
  }
  return [];
}

export function normalizeSession(s) {
  if (!s || typeof s !== 'object') return null;
  const startMs = Number(s.startTime);
  const validStart = (!isNaN(startMs) && startMs > 1577836800000) ? startMs : Date.now();
  return {
    ...s,
    id: String(s.id || generateShortId('s')),
    nama: String(s.nama || 'Penyewa'),
    items: normalizeItems(s.items),
    startTime: validStart,
    tanggal: String(s.tanggal || getShiftDate(validStart)),
    queueNo: Number(s.queueNo || 0),
    payAwal: String(s.payAwal || 'cash').toLowerCase(),
    _synced: s._synced !== undefined ? Boolean(s._synced) : true
  };
}

export function normalizeTxn(t) {
  if (!t || typeof t !== 'object') return null;
  const startMs = Number(t.startTime);
  const validStart = (!isNaN(startMs) && startMs > 1577836800000) ? startMs : Date.now();
  const endMs = Number(t.endTime);
  const validEnd = (!isNaN(endMs) && endMs > 1577836800000) ? endMs : validStart;
  return {
    ...t,
    id: String(t.id || generateShortId('t')),
    no: Number(t.no || Date.now()),
    queueNo: Number(t.queueNo || 0),
    nama: String(t.nama || 'Penyewa'),
    tanggal: String(t.tanggal || getShiftDate(validStart)),
    startTime: validStart,
    endTime: validEnd,
    items: typeof t.items === 'string' ? t.items : normalizeItems(t.items),
    ot: String(t.ot || '-'),
    otDur: String(t.otDur || '-'),
    totalBase: Number(t.totalBase || 0),
    totalOT: Number(t.totalOT || 0),
    totalTol: Number(t.totalTol || 0),
    grandTotal: Number(t.grandTotal || 0),
    totalAll: Number(t.totalAll || 0),
    payAwal: String(t.payAwal || 'cash').toLowerCase(),
    cash: Number(t.cash || 0),
    qris: Number(t.qris || 0),
    shift: String(t.shift || '-'),
    _synced: t._synced !== undefined ? Boolean(t._synced) : true
  };
}
