import { fmtRp, fmtDur } from '../../lib/utils';
import { ITEMS } from '../../lib/items';

const dateStr = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const timeStr = (ts) => {
  if (!ts) return '';
  return new Date(ts).toTimeString().slice(0, 5);
};

export function getTrackUrl(id) {
  if (typeof window === 'undefined' || !window.location) {
    return `#track/${id || ''}`;
  }
  return window.location.href.split('#')[0] + '#track/' + (id || '');
}

/**
 * Generate Struk Mulai Sewa HTML template.
 * Pure function: No DOM manipulation, no React hooks.
 */
export function generateStartReceiptHTML(session, currentShiftUser = '-', itemsCatalog = ITEMS) {
  if (!session) return '';

  const itemsList = Array.isArray(session.items) ? session.items : [];
  const itemsText = itemsList
    .map((i) => {
      const d = itemsCatalog.find((item) => item.code === i.code);
      if (!d) return `${i.code} x${i.qty}`;
      return `${i.code} - ${d.name} x${i.qty}  ${fmtRp(d.priceHour * i.qty)}`;
    })
    .join('\n');

  const total = itemsList.reduce((s, i) => {
    const d = itemsCatalog.find((item) => item.code === i.code);
    return s + (d ? d.priceHour * i.qty : 0);
  }, 0);

  return `
      <div class="receipt-mono">
        <div class="rc rb" style="font-size:13px">EVREN HOUSE</div>
        <div class="rc">Scooter &amp; Stroller</div>
        <div class="rc">Struk Mulai Sewa</div>
        <hr>
        <div>Queue Number: ${session.queueNo || 0}</div>
        <div>Tgl: ${dateStr(session.startTime)} | ${timeStr(session.startTime)}</div>
        <div>Nama: ${session.nama || ''}</div>
        <div>Shift: ${currentShiftUser || '-'}</div>
        <hr>
        <pre style="font-size:11px;margin:0">${itemsText}</pre>
        <hr>
        <div class="rr rb"><span>Total Pokok:</span><span>${fmtRp(total)}</span></div>
        <hr>
        <div class="rc" style="margin:5px 0">
          <div id="printQrCode" style="display:inline-block;background:#fff;padding:5px"></div>
          <div style="font-size:9px;margin-top:4px">Scan QR untuk Cek Sisa Waktu</div>
        </div>
        <hr>
        <div class="rc" style="font-size:10px">Terima kasih!</div>
      </div>`;
}

/**
 * Generate Struk Selesai Sewa HTML template.
 * Pure function: No DOM manipulation, no React hooks.
 */
export function generateFinishReceiptHTML(txn) {
  if (!txn) return '';

  const durSec = Math.floor(((txn.endTime || 0) - (txn.startTime || 0)) / 1000);
  const payAwalStr = (txn.payAwal || 'cash').toUpperCase();

  return `
      <div class="receipt-mono">
        <div class="rc rb" style="font-size:13px">EVREN HOUSE</div>
        <div class="rc">Scooter &amp; Stroller</div>
        <div class="rc">Struk Selesai Sewa</div>
        <hr>
        <div>Queue Number: ${txn.queueNo || 0}</div>
        <div>No: ${txn.no || 0} | ${dateStr(txn.endTime)}</div>
        <div>Nama: ${txn.nama || ''}</div>
        <div>Shift: ${txn.shift || '-'}</div>
        <div style="font-size:11px">Mulai: ${timeStr(txn.startTime)} | Selesai: ${timeStr(txn.endTime)}</div>
        <div style="font-size:11px">Durasi: ${fmtDur(durSec)}</div>
        <hr>
        <div style="font-size:11px">Item: ${txn.items || ''}</div>
        ${txn.ot && txn.ot !== '-' ? `<div style="font-size:11px">OT: ${txn.ot}</div>` : ''}
        <hr>
        <div class="rr"><span>Sewa Pokok:</span><span>${fmtRp(txn.totalBase || 0)} (${payAwalStr})</span></div>
        ${Number(txn.totalOT) > 0 ? `<div class="rr"><span>Overtime:</span><span>${fmtRp(txn.totalOT)}</span></div>` : ''}
        <hr>
        <div class="rr rb"><span>TOTAL:</span><span>${fmtRp(txn.totalAll || 0)}</span></div>
        ${Number(txn.cash) > 0 ? `<div class="rr"><span>Cash:</span><span>${fmtRp(txn.cash)}</span></div>` : ''}
        ${Number(txn.qris) > 0 ? `<div class="rr"><span>QRIS:</span><span>${fmtRp(txn.qris)}</span></div>` : ''}
        <hr>
        <div class="rc" style="margin:5px 0">
          <div id="printQrCode" style="display:inline-block;background:#fff;padding:5px"></div>
          <div style="font-size:9px;margin-top:4px">Scan QR untuk Struk Digital</div>
        </div>
        <hr>
        <div class="rc" style="font-size:10px">Terima kasih telah berkunjung!</div>
      </div>`;
}

/**
 * Generate Struk Tambahan Sewa HTML template.
 * Pure function: No DOM manipulation, no React hooks.
 */
export function generateAdditionalReceiptHTML(
  session,
  addedItems = [],
  payMethod = 'cash',
  currentShiftUser = '-',
  itemsCatalog = ITEMS
) {
  if (!session) return '';

  const now = Date.now();
  const itemsText = (Array.isArray(addedItems) ? addedItems : [])
    .map((i) => {
      const d = itemsCatalog.find((item) => item.code === i.code);
      if (!d) return `${i.code} x${i.qty || 1}`;
      return `${i.code} - ${d.name} x${i.qty || 1}  ${fmtRp(d.priceHour * (i.qty || 1))}`;
    })
    .join('\n');

  const total = (Array.isArray(addedItems) ? addedItems : []).reduce((s, i) => {
    const d = itemsCatalog.find((item) => item.code === i.code);
    return s + (d ? d.priceHour * (i.qty || 1) : 0);
  }, 0);

  const payStr = String(payMethod || 'cash').toUpperCase();

  return `
      <div class="receipt-mono">
        <div class="rc rb" style="font-size:14px;letter-spacing:1px;padding:3px 0;border-bottom:1px dashed #000;margin-bottom:6px">*** ADDITIONAL ORDER ***</div>
        <div class="rc rb" style="font-size:13px">EVREN HOUSE</div>
        <div class="rc">Scooter &amp; Stroller</div>
        <div class="rc">Struk Tambahan Sewa</div>
        <hr>
        <div>Queue Number: #${session.queueNo || 0}</div>
        <div>Tgl: ${dateStr(now)} | ${timeStr(now)}</div>
        <div>Nama: ${session.nama || ''}</div>
        <div>Shift: ${currentShiftUser || '-'}</div>
        <hr>
        <pre style="font-size:11px;margin:0">${itemsText}</pre>
        <hr>
        <div class="rr rb"><span>Total Tambahan:</span><span>${fmtRp(total)} (${payStr})</span></div>
        <hr>
        <div class="rc" style="margin:5px 0">
          <div id="printQrCode" style="display:inline-block;background:#fff;padding:5px"></div>
          <div style="font-size:9px;margin-top:4px">Scan QR untuk Cek Sisa Waktu</div>
        </div>
        <hr>
        <div class="rc" style="font-size:10px">Terima kasih!</div>
      </div>`;
}

