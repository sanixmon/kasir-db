# Design Spec: Penambahan Barang Sewa Sesi Berjalan & Penggabungan/Pemisahan Bill Akhir

**Tanggal:** 2026-09-04  
**Status:** Validated Design  
**Author:** Pair Programming Antigravity & User  

---

## 1. Problem Statement & Latar Belakang

Pada operasional rental mainan/stroller (*Evren House*), sering terjadi kasus:
* Seorang penyewa datang dan menyewa 1 item (misalnya: Stroller) pukul 10:00.
* 5 menit kemudian (10:05), penyewa yang sama datang kembali ingin menyewa item lain (misalnya: Skuter).
* **Masalah:** Sistem sebelumnya tidak memiliki tombol penambahan item cepat di sesi berjalan bagi kasir biasa (hanya ada *Edit Sesi* yang memerlukan password Admin dan tidak menagih uang sewa pokok tambahan). Akibatnya, kasir terpaksa membuat sesi sewa baru yang menghasilkan nomor antrian terpisah, dua kartu timer, dan dua bill terpisah.
* **Tujuan:** 
  1. Menyediakan tombol cepat **`+ Tambah Item`** langsung di kartu sesi aktif yang bisa diakses langsung oleh kasir biasa (tanpa password admin).
  2. Menerima pembayaran tarif sewa pokok barang tambahan (Cash/QRIS).
  3. Mencetak struk penambahan yang memiliki teks **`*** ADDITIONAL ORDER ***`** di bagian paling atas.
  4. Mencatat jam mulai (*start time*) independen untuk barang tambahan tersebut agar perhitungan durasi dan overtimenya adil.
  5. Memberikan fleksibilitas saat pengembalian (checkout): penyewa dapat menyelesaikan **semua barang sekaligus dalam satu bill/struk gabungan**, atau **menyelesaikan barang tertentu lebih awal (pisah bill)** jika barang lain masih dipakai.

---

## 2. Arsitektur & Perubahan Data Model

### 2.1 Skema Item dalam Sesi (`session.items`)
Struktur objek item di dalam array `session.items` diperkaya untuk menyimpan metadata per-item:

```json
[
  {
    "code": "STROLLER",
    "qty": 1,
    "startTime": 1725450000000,
    "payAwal": "cash",
    "priceBase": 40000
  },
  {
    "code": "SCOOTER",
    "qty": 1,
    "startTime": 1725450300000,
    "payAwal": "qris",
    "priceBase": 30000
  }
]
```

#### Kompatibilitas Mundur (Backward Compatibility):
Jika item tidak memiliki `startTime` (data sesi lama), sistem *fallback* ke `session.startTime`.  
Jika item tidak memiliki `payAwal`, sistem *fallback* ke `session.payAwal`.

### 2.2 Normalisasi Data (`src/lib/utils.js`)
* Fungsi `normalizeItems(val)` diperbarui agar tidak menghapus atribut `startTime`, `payAwal`, dan `priceBase` saat memproses item bertipe objek.
* String format parser (`"STROLLERx1, SCOOTERx1"`) tetap menghasilkan format objek valid.

### 2.3 Pelestarian Metadata pada Partial Return (`src/features/rentals/domain/rentalCalculations.js`)
* Fungsi `calculatePartialReturn(sessionItems, itemsCalc)` diperbaiki agar item yang tersisa (`remainingItems`) tetap mempertahankan seluruh properti aslinya:
  ```javascript
  const remainingItems = sessionItems
    .map((orig) => {
      const calc = itemsCalc.find((it) => it.code === orig.code);
      const returned = calc ? calc.returnQty : 0;
      return { ...orig, qty: orig.qty - returned };
    })
    .filter((it) => it.qty > 0);
  ```

---

## 3. Komponen UI & Alur Kasir

### 3.1 Kartu Sesi Aktif (`DashboardTab.jsx` / `LiveSessionTimer`)
* Di bagian footer kartu sesi aktif (`aktif-footer`), tambahkan tombol cepat **`+ Item`** (`btn-add-item`, dengan icon `bi bi-plus-circle-fill`).
* Tombol ini langsung memicu pembukaan `AddItemModal` untuk sesi tersebut.
* Tidak memerlukan eskalasi password admin.

### 3.2 Modal Tambah Item (`AddItemModal.jsx`)
Komponen modal baru: `src/features/rentals/components/AddItemModal.jsx`
* **Header:** Menampilkan `+ Tambah Barang Sewa - Antrian #{queueNo} ({nama})`.
* **Katalog Item:** Menampilkan daftar item dari `ITEMS` dengan tombol `+` dan `-` untuk memilih barang tambahan dan kuantitasnya.
* **Ringkasan Tagihan Pokok Tambahan:** Menghitung total biaya sewa pokok barang tambahan (`fmtRp(totalAdditional)`).
* **Pilihan Pembayaran:** Radio selector `Cash` vs `QRIS`.
  * Jika Cash: input jumlah uang diterima dan kalkulasi kembalian otomatis.
* **Aksi:** Tombol `Batal` dan `Simpan & Cetak Struk`.
* **Disabilitas & Proteksi:** Tombol simpan dinonaktifkan jika belum ada item tambahan yang dipilih (`qty <= 0`) atau saat proses mutasi sedang berlangsung (`isSubmitting`).

### 3.3 Templat Struk Tambahan (`generateAdditionalReceiptHTML`)
Lokasi: `src/features/receipts/receiptTemplates.js`
* Di bagian paling atas struk (sebelum nama toko/brand), dicetak teks penanda tebal:
  ```html
  <div class="receipt-mono">
    <div class="rc rb" style="font-size:14px;letter-spacing:1px;padding:3px 0;border-bottom:1px dashed #000;margin-bottom:6px">
      *** ADDITIONAL ORDER ***
    </div>
    <div class="rc rb" style="font-size:13px">EVREN HOUSE</div>
    <div class="rc">Scooter &amp; Stroller</div>
    <div class="rc">Struk Tambahan Sewa</div>
    <hr>
    <div>Queue Number: #${session.queueNo || 0}</div>
    <div>Tgl: ${dateStr(Date.now())} | ${timeStr(Date.now())}</div>
    <div>Nama: ${session.nama || ''}</div>
    <div>Shift: ${currentShiftUser || '-'}</div>
    <hr>
    <pre style="font-size:11px;margin:0">${addedItemsText}</pre>
    <hr>
    <div class="rr rb"><span>Total Tambahan:</span><span>${fmtRp(totalAdditional)} (${payMethod.toUpperCase()})</span></div>
    <hr>
    <div class="rc" style="margin:5px 0">
      <div id="printQrCode" style="display:inline-block;background:#fff;padding:5px"></div>
      <div style="font-size:9px;margin-top:4px">Scan QR untuk Cek Sisa Waktu</div>
    </div>
    <hr>
    <div class="rc" style="font-size:10px">Terima kasih!</div>
  </div>
  ```

---

## 4. Alur Checkout: Kalkulasi Overtime, Gabung Bill vs Pisah Bill

### 4.1 Perhitungan Overtime Per-Item (`CalculateRentalModal.jsx` & `rentalCalculations.js`)
* Saat modal hitung sewa dibuka:
  * Untuk setiap item di `session.items`, durasi dihitung berdasarkan jam mulainya masing-masing:
    ```javascript
    const itemStart = (it.startTime && it.startTime > 1577836800000) ? it.startTime : safeStart;
    const itemElapsedMin = Math.max(0, (now - itemStart) / 60000);
    ```
  * Overtime tiap item dihitung berdasarkan limit barang tersebut (`calcOT(itemElapsedMin, limitMin)`).
  * Dengan demikian, barang yang disewa susulan tidak terkena penalti overtime dari jam sewa barang pertama.

### 4.2 Opsi Selesai: Digabung (1 Bill) vs Masing-masing (Pisah Bill)
* **Kasus 1 — Digabung (1 Bill Gabungan):**
  * Secara default, semua item diatur `returnQty = it.qty`.
  * Total sewa pokok mencakup seluruh item (`baseSum`).
  * Total overtime mencakup seluruh overtime dari semua item.
  * Kasir memproses pelunasan (jika ada OT) -> Transaksi tunggal dicatat di tabel `transactions`, dan sesi di `active_sessions` selesai/dihapus. Struk akhir memuat seluruh item dalam satu tagihan.
* **Kasus 2 — Masing-masing / Pisah Bill (Partial Return):**
  * Kasir menurunkan `returnQty` menjadi 0 untuk item yang belum kembali (atau yang ingin ditagih di struk terpisah).
  * Sistem hanya memproses item yang `returnQty > 0`.
  * Item yang tersisa tetap hidup di `active_sessions` dengan `startTime` aslinya.
  * Saat item kedua dikembalikan kemudian, kasir klik "Selesai" lagi untuk item tersebut dan menerbitkan bill kedua.

---

## 5. Rencana Pengujian (Test-Driven Development / TDD)

Sesuai instruksi pengguna, implementasi dilakukan dengan disiplin TDD dan unit test komprehensif:

1. **Unit Test `src/features/rentals/domain/__tests__/rentalCalculations.test.js`:**
   * Test kalkulasi overtime ketika satu sesi memiliki item dengan `startTime` berbeda.
   * Test `calculatePartialReturn` memastikan properti `startTime`, `payAwal`, dan `priceBase` tidak terbuang saat partial return.
2. **Unit Test `src/lib/__tests__/utils.test.js`:**
   * Test `normalizeItems` mempertahankan objek item dengan `startTime` dan `payAwal`.
3. **Unit Test `src/features/receipts/__tests__/receiptTemplates.test.js`:**
   * Test `generateAdditionalReceiptHTML` memuat banner teks `*** ADDITIONAL ORDER ***` di baris paling atas.
   * Test format item, nominal tambahan, dan metode bayar pada struk tambahan.
4. **Integration/Hook Test `src/features/rentals/hooks/__tests__/useRentalActions.test.js`:**
   * Test aksi penambahan item ke sesi berjalan (`addItemsToRental`).
   * Test mutasi state dan pemanggilan print struk tambahan.
5. **UI Component Test `src/features/rentals/components/__tests__/AddItemModal.test.jsx`:**
   * Render modal dengan list item.
   * Interaksi penambahan kuantitas dan kalkulasi total tambahan.
   * Validasi submit dan trigger callback.
