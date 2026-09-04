# Penambahan Barang Sewa Sesi Berjalan & Penggabungan/Pemisahan Bill Akhir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur penambahan barang sewa ke sesi aktif berjalan bagi kasir (dengan pencatatan jam mulai mandiri, pembayaran di muka, struk ber-header `*** ADDITIONAL ORDER ***`) dan fleksibilitas checkout pengembalian dalam 1 bill gabungan atau bill terpisah.

**Architecture:** Memperkaya objek `session.items` agar menyimpan metadata per-item (`startTime`, `payAwal`, `priceBase`) secara backward-compatible. Menyediakan modal khusus `AddItemModal` langsung dari kartu sesi aktif di POS tanpa password admin, memperluas perhitungan domain di `rentalCalculations.js` agar menghitung overtime per-item secara adil serta melestarikan metadata saat partial return, dan menambahkan templat struk `generateAdditionalReceiptHTML`.

**Tech Stack:** React 18, Vite, Bootstrap 5 Icons & CSS, Node.js SQLite backend, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-04-additional-rental-items-and-split-merge-billing-design.md`

## Global Constraints

- Semua fungsi pembantu domain di `src/features/rentals/domain/rentalCalculations.js` harus bersifat murni (pure function), deterministik, tanpa dependensi DOM/React.
- Normalizer di `src/lib/utils.js` harus mempertahankan kompatibilitas mundur dengan data sesi lama (string item atau objek tanpa `startTime`).
- Struk tambahan wajib memiliki teks `*** ADDITIONAL ORDER ***` di baris paling atas sebelum informasi toko.
- Penambahan item tidak boleh mewajibkan password admin (dapat diakses langsung oleh kasir).
- Seluruh pengujian dijalankan dengan `npm test` menggunakan Vitest dan wajib 100% lulus.

---

### Task 1: Data Normalization & Schema Extension (`src/lib/utils.js`)

**Files:**
- Modify: `src/lib/utils.js:61-75`
- Modify: `src/__tests__/utils.test.js`

**Interfaces:**
- Consumes: Array of item objects / strings from database or user input.
- Produces: `normalizeItems(val)` returning array of `{ code: string, qty: number, startTime?: number, payAwal?: string, priceBase?: number }`.

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian di `src/__tests__/utils.test.js`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/utils.test.js`  
Expected: FAIL karena `startTime`, `payAwal`, dan `priceBase` terbuang oleh implementasi saat ini.

- [ ] **Step 3: Write minimal implementation**

Ubah fungsi `normalizeItems` di `src/lib/utils.js`:

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/utils.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.js src/__tests__/utils.test.js
git commit -m "feat(utils): preserve per-item metadata in normalizeItems"
```

---

### Task 2: Rental Domain Calculations (`src/features/rentals/domain/rentalCalculations.js`)

**Files:**
- Modify: `src/features/rentals/domain/rentalCalculations.js:59-82,109-127`
- Modify: `src/features/rentals/domain/__tests__/rentalCalculations.test.js`

**Interfaces:**
- Consumes: `sessionItems` array with per-item `startTime`, `payAwal`, `priceBase`.
- Produces: 
  - `calculateItemDetail(it, def, elapsedMin, customReturnQty)` where `elapsedMin` can be item-specific.
  - `calculatePartialReturn(sessionItems, itemsCalc)` preserving all metadata in `remainingItems`.

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian di `src/features/rentals/domain/__tests__/rentalCalculations.test.js`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/rentals/domain/__tests__/rentalCalculations.test.js`  
Expected: FAIL karena `remainingItems` saat ini hanya mengembalikan `{ code, qty }` tanpa properti lain.

- [ ] **Step 3: Write minimal implementation**

Perbarui `calculatePartialReturn` di `src/features/rentals/domain/rentalCalculations.js`:

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/rentals/domain/__tests__/rentalCalculations.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rentals/domain/rentalCalculations.js src/features/rentals/domain/__tests__/rentalCalculations.test.js
git commit -m "feat(rentals): preserve item metadata in calculatePartialReturn"
```

---

### Task 3: Additional Order Receipt Template & Printer Hook (`src/features/receipts/`)

**Files:**
- Modify: `src/features/receipts/receiptTemplates.js`
- Modify: `src/features/receipts/hooks/useReceiptPrinter.js`
- Modify: `src/features/receipts/__tests__/receiptTemplates.test.js`

**Interfaces:**
- Produces: `generateAdditionalReceiptHTML(session, addedItems, payMethod, currentShiftUser, itemsCatalog)`
- Produces: `printAdditional(session, addedItems, payMethod)` in `useReceiptPrinter`.

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian di `src/features/receipts/__tests__/receiptTemplates.test.js`:

```javascript
describe('generateAdditionalReceiptHTML', () => {
  it('generates HTML containing *** ADDITIONAL ORDER *** at the very top', () => {
    const session = {
      id: 's-123',
      queueNo: 5,
      nama: 'Budi'
    };
    const addedItems = [{ code: 'SCOOTER', qty: 1 }];
    const html = generateAdditionalReceiptHTML(session, addedItems, 'cash', 'Kasir A');

    expect(html).toContain('*** ADDITIONAL ORDER ***');
    expect(html.indexOf('*** ADDITIONAL ORDER ***')).toBeLessThan(html.indexOf('EVREN HOUSE'));
    expect(html).toContain('Queue Number: #5');
    expect(html).toContain('Budi');
    expect(html).toContain('Kasir A');
    expect(html).toContain('SCOOTER');
    expect(html).toContain('CASH');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/receipts/__tests__/receiptTemplates.test.js`  
Expected: FAIL karena `generateAdditionalReceiptHTML` belum didefinisikan.

- [ ] **Step 3: Write minimal implementation**

Tambahkan `generateAdditionalReceiptHTML` di `src/features/receipts/receiptTemplates.js`:

```javascript
export function generateAdditionalReceiptHTML(
  session,
  addedItems = [],
  payMethod = 'cash',
  currentShiftUser = '-',
  itemsCatalog = ITEMS
) {
  if (!session) return '';

  const now = Date.now();
  const itemsText = addedItems
    .map((i) => {
      const d = itemsCatalog.find((item) => item.code === i.code);
      if (!d) return `${i.code} x${i.qty}`;
      return `${i.code} - ${d.name} x${i.qty}  ${fmtRp(d.priceHour * i.qty)}`;
    })
    .join('\n');

  const total = addedItems.reduce((s, i) => {
    const d = itemsCatalog.find((item) => item.code === i.code);
    return s + (d ? d.priceHour * i.qty : 0);
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
```

Dan tambahkan `printAdditional` di `src/features/receipts/hooks/useReceiptPrinter.js`:
```javascript
  const printAdditional = (session, addedItems, payMethod) => {
    const html = generateAdditionalReceiptHTML(session, addedItems, payMethod, currentShiftUser);
    const trackUrl = getTrackUrl(session.id);
    printReceiptContent(html, trackUrl);
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/receipts/__tests__/receiptTemplates.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/receipts/receiptTemplates.js src/features/receipts/hooks/useReceiptPrinter.js src/features/receipts/__tests__/receiptTemplates.test.js
git commit -m "feat(receipts): add generateAdditionalReceiptHTML with ADDITIONAL ORDER header"
```

---

### Task 4: Rental Action Hook Extension (`useRentalActions.js`)

**Files:**
- Modify: `src/features/rentals/hooks/useRentalActions.js`
- Modify: `src/features/rentals/hooks/__tests__/useRentalActions.test.js`

**Interfaces:**
- Produces: `addItemsToRental(session, newItems, payAwal)` in `useRentalActions`.
- Calls: `editSession` API and optimistically updates `activeSessions`.

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian di `src/features/rentals/hooks/__tests__/useRentalActions.test.js`:

```javascript
describe('addItemsToRental', () => {
  it('appends additional items with their own startTime and payAwal to active session', async () => {
    const mockSession = {
      id: 's-test',
      queueNo: 1,
      nama: 'Budi',
      startTime: 1000000,
      payAwal: 'cash',
      items: [{ code: 'STROLLER', qty: 1, startTime: 1000000, payAwal: 'cash', priceBase: 40000 }]
    };

    let updatedSession = null;
    const setActiveSessions = vi.fn((updater) => {
      const prev = [mockSession];
      updatedSession = updater(prev).find(s => s.id === 's-test');
    });

    const onAdditionalAdded = vi.fn();

    const { addItemsToRental } = useRentalActions({
      setActiveSessions,
      onAdditionalAdded
    });

    const newItems = [{ code: 'SCOOTER', qty: 1, priceBase: 30000 }];
    const res = await addItemsToRental(mockSession, newItems, 'qris');

    expect(res.success).toBe(true);
    expect(updatedSession.items.length).toBe(2);
    expect(updatedSession.items[1].code).toBe('SCOOTER');
    expect(updatedSession.items[1].payAwal).toBe('qris');
    expect(updatedSession.items[1].startTime).toBeDefined();
    expect(onAdditionalAdded).toHaveBeenCalledWith(updatedSession, newItems, 'qris');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/rentals/hooks/__tests__/useRentalActions.test.js`  
Expected: FAIL karena `addItemsToRental` belum ada di `useRentalActions`.

- [ ] **Step 3: Write minimal implementation**

Di `src/features/rentals/hooks/useRentalActions.js`, tambahkan fungsi `addItemsToRental`:

```javascript
  const addItemsToRental = async (session, newItems = [], additionalPayAwal = 'cash') => {
    if (!session || !session.id) return { success: false, error: 'Sesi tidak valid' };
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return { success: false, error: 'Item tambahan kosong' };
    }

    const now = Date.now();
    const enrichedNewItems = newItems.map(item => ({
      code: item.code,
      qty: Number(item.qty || 1),
      startTime: now,
      payAwal: additionalPayAwal,
      priceBase: item.priceBase
    }));

    const existingItems = Array.isArray(session.items) ? session.items : [];
    const mergedItems = [...existingItems, ...enrichedNewItems];

    const updatedSession = {
      ...session,
      items: mergedItems
    };

    try {
      await editSession(updatedSession);
      if (typeof setActiveSessions === 'function') {
        setActiveSessions((prev) =>
          prev.map((s) => (s.id === session.id ? normalizeSession(updatedSession) : s))
        );
      }
      swalSuccess('Item Tambahan Berhasil Ditambahkan!');
      if (typeof options.onAdditionalAdded === 'function') {
        options.onAdditionalAdded(normalizeSession(updatedSession), enrichedNewItems, additionalPayAwal);
      }
      return { success: true, session: normalizeSession(updatedSession) };
    } catch (e) {
      console.error('Failed to add items to rental:', e);
      swalError('Gagal Tambah Item', 'Periksa koneksi ke server.');
      return { success: false, error: e };
    }
  };
```
Return `addItemsToRental` di object return `useRentalActions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/rentals/hooks/__tests__/useRentalActions.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rentals/hooks/useRentalActions.js src/features/rentals/hooks/__tests__/useRentalActions.test.js
git commit -m "feat(rentals): add addItemsToRental action in useRentalActions"
```

---

### Task 5: Add Item Modal Component (`AddItemModal.jsx`)

**Files:**
- Create: `src/features/rentals/components/AddItemModal.jsx`
- Create: `src/features/rentals/components/__tests__/AddItemModal.test.jsx`

**Interfaces:**
- Props:
  - `session`: active session object `{ id, nama, queueNo, ... }`
  - `onClose`: callback function
  - `onSave`: `async (selectedItems, payAwal) => void`
  - `itemsCatalog`: array of catalog items (defaults to `ITEMS`)

- [ ] **Step 1: Write the failing test**

Buat file test `src/features/rentals/components/__tests__/AddItemModal.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddItemModal from '../AddItemModal';

const mockCatalog = [
  { code: 'SCOOTER', name: 'Scooter Anak', priceHour: 30000 },
  { code: 'STROLLER', name: 'Stroller Bayi', priceHour: 40000 }
];

describe('AddItemModal', () => {
  it('renders customer name, queue number and calculates additional subtotal correctly', () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    expect(screen.getByText(/Antrian #7/i)).toBeInTheDocument();
    expect(screen.getByText(/Anita/i)).toBeInTheDocument();

    // Initially total is Rp 0 and submit is disabled
    const saveBtn = screen.getByRole('button', { name: /Simpan & Cetak/i });
    expect(saveBtn).toBeDisabled();

    // Click + on Scooter
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(plusButtons[0]);

    // Now total should show Rp 30.000 and save button enabled
    expect(screen.getByText(/Rp 30\.000/i)).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();
  });

  it('submits selected items and payment method on save click', async () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue({ success: true });

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    // Add 1 Scooter
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(plusButtons[0]);

    // Select QRIS
    const qrisRadio = screen.getByLabelText(/QRIS/i);
    fireEvent.click(qrisRadio);

    // Click submit
    const saveBtn = screen.getByRole('button', { name: /Simpan & Cetak/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      [{ code: 'SCOOTER', qty: 1, priceBase: 30000 }],
      'qris'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/rentals/components/__tests__/AddItemModal.test.jsx`  
Expected: FAIL karena file `AddItemModal.jsx` belum ada.

- [ ] **Step 3: Write minimal implementation**

Buat `src/features/rentals/components/AddItemModal.jsx`:

```jsx
import React, { useState } from 'react';
import { ITEMS } from '../../../lib/items';
import { fmtRp } from '../../../lib/utils';
import { swalWarning } from '../../../lib/swal';

function AddItemModal({ session, onClose, onSave, itemsCatalog = ITEMS }) {
  const [selectedQty, setSelectedQty] = useState({});
  const [payAwal, setPayAwal] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChgQty = (code, delta) => {
    setSelectedQty(prev => {
      const current = prev[code] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [code]: next };
    });
  };

  const totalAdditional = itemsCatalog.reduce((sum, item) => {
    const q = selectedQty[item.code] || 0;
    return sum + (q * (item.priceHour || 0));
  }, 0);

  const cashNum = Number(cashGiven) || 0;
  const changeAmt = Math.max(0, cashNum - totalAdditional);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    const itemsToAdd = itemsCatalog
      .filter(item => (selectedQty[item.code] || 0) > 0)
      .map(item => ({
        code: item.code,
        qty: selectedQty[item.code],
        priceBase: item.priceHour || 0
      }));

    if (itemsToAdd.length === 0) {
      swalWarning('Pilih Item', 'Silakan pilih minimal 1 item tambahan!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(itemsToAdd, payAwal);
    } catch (err) {
      console.error('Error adding items:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle-fill me-2 clr-cyan"></i>
              Tambah Barang Sewa
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting}></button>
          </div>
          <div className="modal-body p-3">
            <div className="info-box mb-3 p-2 border rounded">
              <div className="lbl small text-secondary">Penyewa</div>
              <div className="val name fw-bold">
                {Number(session?.queueNo) > 0 && (
                  <span className="badge bg-primary me-2">Antrian #{session.queueNo}</span>
                )}
                {session?.nama || 'Penyewa'}
              </div>
            </div>

            <div className="small text-secondary mb-2 fw-bold">Pilih Barang Tambahan</div>
            <div className="edit-sesi-items mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {itemsCatalog.map(item => {
                const qty = selectedQty[item.code] || 0;
                return (
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom" key={item.code}>
                    <div>
                      <span className="fw-bold clr-yellow me-2">{item.code}</span>
                      <span>{item.name}</span>
                      <div className="small text-secondary">{fmtRp(item.priceHour)} / jam</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => handleChgQty(item.code, -1)}
                        disabled={qty <= 0}
                      >−</button>
                      <span className="fw-bold" style={{ minWidth: '24px', textAlign: 'center' }}>{qty}</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => handleChgQty(item.code, 1)}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border rounded mb-3 bg-dark-subtle d-flex justify-content-between align-items-center">
              <span className="fw-bold">Total Sewa Pokok Tambahan:</span>
              <span className="fw-bold fs-5 clr-cyan">{fmtRp(totalAdditional)}</span>
            </div>

            <div className="mb-3">
              <div className="small text-secondary mb-2 fw-bold">Metode Pembayaran Tambahan</div>
              <div className="d-flex gap-2">
                <label className={`flex-fill border p-2 rounded text-center cursor-pointer ${payAwal === 'cash' ? 'border-primary bg-primary-subtle' : ''}`}>
                  <input 
                    type="radio" 
                    name="addPayAwal" 
                    value="cash" 
                    checked={payAwal === 'cash'} 
                    onChange={() => setPayAwal('cash')}
                    className="me-1" 
                  />
                  💵 Cash
                </label>
                <label className={`flex-fill border p-2 rounded text-center cursor-pointer ${payAwal === 'qris' ? 'border-primary bg-primary-subtle' : ''}`}>
                  <input 
                    type="radio" 
                    name="addPayAwal" 
                    value="qris" 
                    checked={payAwal === 'qris'} 
                    onChange={() => setPayAwal('qris')}
                    className="me-1" 
                  />
                  📱 QRIS
                </label>
              </div>
            </div>

            {payAwal === 'cash' && totalAdditional > 0 && (
              <div className="mb-3">
                <label className="small text-secondary mb-1">Jumlah Uang Diterima (Opsional)</label>
                <input 
                  type="number" 
                  className="form-control form-control-sm" 
                  placeholder={`Contoh: ${totalAdditional}`}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                />
                {cashNum > totalAdditional && (
                  <div className="small text-success mt-1 d-flex justify-content-between">
                    <span>Kembalian:</span>
                    <strong>{fmtRp(changeAmt)}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn btn-secondary flex-fill py-2" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
              <button 
                type="button" 
                className="btn btn-primary flex-fill py-2" 
                onClick={handleSave} 
                disabled={isSubmitting || totalAdditional <= 0}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Cetak Struk'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/rentals/components/__tests__/AddItemModal.test.jsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rentals/components/AddItemModal.jsx src/features/rentals/components/__tests__/AddItemModal.test.jsx
git commit -m "feat(rentals): create AddItemModal component"
```

---

### Task 6: Per-Item Overtime Calculation in Checkout (`CalculateRentalModal.jsx`)

**Files:**
- Modify: `src/features/rentals/components/CalculateRentalModal.jsx:21-44`
- Test: Existing test suite & unit verification

**Interfaces:**
- Consumes: `session.items` with individual `it.startTime`.
- Produces: Overtime per item calculated based on each item's actual elapsed duration, allowing full return (1 bill) or selective partial return (pisah bill).

- [ ] **Step 1: Write test or verification check**

Tambahkan pengujian di `src/features/rentals/domain/__tests__/rentalCalculations.test.js`:

```javascript
describe('multi-item different start time overtime calculation', () => {
  it('calculates 0 OT for newly added item while initial item has overtime', () => {
    const now = 1725454000000; // 66.6 minutes after initial item
    const item1Start = now - (66 * 60 * 1000); // 66 min elapsed (limit 60 -> over 6 min -> inside 10m59s grace period, so 0 OT)
    const item1OvertimeStart = now - (75 * 60 * 1000); // 75 min elapsed (limit 60 -> over 15 min -> 1 half OT)
    const item2AddedRecent = now - (10 * 60 * 1000); // only 10 min elapsed (0 OT)

    const def = { priceHour: 30000, priceOT30: 15000, priceOT60: 30000, isPackage: false, packageHours: 1 };

    const item1Calc = calculateItemDetail({ code: 'STROLLER', qty: 1 }, def, 75);
    const item2Calc = calculateItemDetail({ code: 'SCOOTER', qty: 1 }, def, 10);

    expect(item1Calc.otHalfCount).toBe(1);
    expect(item1Calc.otCost).toBe(15000);

    expect(item2Calc.otHalfCount).toBe(0);
    expect(item2Calc.otCost).toBe(0);

    const totals = calculateRentalTotals([item1Calc, item2Calc]);
    expect(totals.baseSum).toBe(60000);
    expect(totals.otSum).toBe(15000);
    expect(totals.grandOT).toBe(15000);
  });
});
```

- [ ] **Step 2: Run test to verify domain logic passes**

Run: `npx vitest run src/features/rentals/domain/__tests__/rentalCalculations.test.js`  
Expected: PASS

- [ ] **Step 3: Modify CalculateRentalModal to compute elapsed duration per-item**

Di `src/features/rentals/components/CalculateRentalModal.jsx`:

Ganti mapping initial items di `useEffect`:
```javascript
    const now = Date.now();
    const initial = (Array.isArray(session?.items) ? session.items : []).map(it => {
      if (!it) return null;
      const def = ITEMS.find(item => item.code === it.code) || { priceHour: 0, priceOT30: 0, priceOT60: 0 };
      const itemStart = (it.startTime && Number(it.startTime) > 1577836800000)
        ? Number(it.startTime)
        : safeStart;
      const itemElMin = Math.max(0, Math.floor((now - itemStart) / 1000) / 60);
      return {
        ...calculateItemDetail(it, def, itemElMin),
        itemStartTime: itemStart
      };
    }).filter(Boolean);
    setItemsCalc(initial);
```

Dan perbarui `handleReturnQtyChange`:
```javascript
  const handleReturnQtyChange = (idx, delta) => {
    const now = Date.now();
    setItemsCalc(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const newReturnQty = Math.max(0, Math.min(it.qty || 1, (it.returnQty || 1) + delta));
      const itemStart = (it.itemStartTime && Number(it.itemStartTime) > 1577836800000)
        ? Number(it.itemStartTime)
        : safeStart;
      const itemElMin = Math.max(0, Math.floor((now - itemStart) / 1000) / 60);
      return {
        ...calculateItemDetail(it, it.def, itemElMin, newReturnQty),
        itemStartTime: itemStart
      };
    }));
  };
```

- [ ] **Step 4: Run all tests to verify integration**

Run: `npx vitest run`  
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/rentals/components/CalculateRentalModal.jsx src/features/rentals/domain/__tests__/rentalCalculations.test.js
git commit -m "feat(rentals): support per-item start timing in CalculateRentalModal"
```

---

### Task 7: POS Dashboard Integration & UI Button (`DashboardTab.jsx` & `App.jsx`)

**Files:**
- Modify: `src/components/DashboardTab.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Connects `LiveSessionTimer` footer with `+ Item` button (`onAddItem`).
- Connects `App.jsx` state `activeAddItemSession` to render `AddItemModal`.
- Triggers `addItemsToRental` and `printAdditional` on save.

- [ ] **Step 1: Write UI integration test in `src/__tests__/AppRouting.test.jsx` or component test**

Verifikasi `DashboardTab` memiliki tombol `+ Item` dan memanggil handler `onAddItem`:

```jsx
it('renders "+ Item" button on active session card and triggers onAddItem', () => {
  const session = {
    id: 's-test',
    queueNo: 1,
    nama: 'Budi',
    startTime: Date.now(),
    payAwal: 'cash',
    items: [{ code: 'STROLLER', qty: 1 }]
  };
  const onAddItem = vi.fn();
  render(
    <LiveSessionTimer 
      session={session} 
      onSelesaiSewa={vi.fn()} 
      onShowQR={vi.fn()} 
      onPrintSesi={vi.fn()} 
      onEditSesi={vi.fn()}
      onAddItem={onAddItem}
    />
  );

  const addBtn = screen.getByTitle(/Tambah Item/i);
  expect(addBtn).toBeInTheDocument();
  fireEvent.click(addBtn);
  expect(onAddItem).toHaveBeenCalledWith(session);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL karena tombol `+ Item` belum dirender di `LiveSessionTimer`.

- [ ] **Step 3: Modify `LiveSessionTimer`, `DashboardTab.jsx` and `App.jsx`**

1. Di `src/components/DashboardTab.jsx`:
   - Tambahkan prop `onAddItem` ke `LiveSessionTimer` dan `DashboardTab`.
   - Di `LiveSessionTimer` footer (sebelah tombol Edit):
     ```jsx
     <button 
       className="btn-qr-aktif" 
       style={{ background: 'var(--bg-sec)', color: 'var(--green)', border: '1px solid var(--green)' }} 
       onClick={() => onAddItem(session)} 
       title="Tambah Item"
     >
       <i className="bi bi-plus-circle-fill"></i>
     </button>
     ```
2. Di `src/App.jsx`:
   - Tambahkan state: `const [activeAddItemSession, setActiveAddItemSession] = useState(null);`
   - Ambil `addItemsToRental` dari `useRentalActions`.
   - Teruskan `onAddItem={(sess) => setActiveAddItemSession(sess)}` ke `DashboardTab`.
   - Render `AddItemModal` jika `activeAddItemSession` tidak null:
     ```jsx
     {activeAddItemSession && (
       <AddItemModal
         session={activeAddItemSession}
         onClose={() => setActiveAddItemSession(null)}
         onSave={async (newItems, payAwal) => {
           const res = await addItemsToRental(activeAddItemSession, newItems, payAwal);
           if (res.success) {
             if (printMulai) {
               handlePrintAdditional(activeAddItemSession, newItems, payAwal);
             }
             setActiveAddItemSession(null);
           }
         }}
       />
     )}
     ```

- [ ] **Step 4: Run full test suite and build check**

Run: `npm test && npm run build`  
Expected: All tests pass, build succeeds with zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardTab.jsx src/App.jsx
git commit -m "feat(pos): integrate AddItemModal and quick + Item button in Dashboard"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 
  - Penambahan barang berjalan dengan start time mandiri -> Task 1, Task 2, Task 4.
  - Pembayaran di muka & struk dengan `*** ADDITIONAL ORDER ***` -> Task 3, Task 5.
  - Akses langsung kasir tanpa password admin -> Task 5, Task 7.
  - Gabung bill (default checkout) vs pisah bill (partial checkout) -> Task 2, Task 6.
- [x] **Placeholder scan:** Tidak ada TODO, TBD, atau instruksi ambigu. Semua kode, perintah terminal, dan file target didefinisikan secara eksplisit.
- [x] **Type consistency:** Semua fungsi menggunakan signature yang seragam (`code`, `qty`, `startTime`, `payAwal`, `priceBase`).
