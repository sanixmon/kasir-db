import { describe, it, expect } from 'vitest';
import { generateStartReceiptHTML, generateFinishReceiptHTML, generateAdditionalReceiptHTML, getTrackUrl } from '../receiptTemplates';

describe('Receipt Templates Unit Tests', () => {
  it('getTrackUrl formats URL containing session or txn ID', () => {
    const url = getTrackUrl('s-abc1234');
    expect(url).toContain('#track/s-abc1234');
  });

  describe('generateStartReceiptHTML', () => {
    it('returns empty string for null session', () => {
      expect(generateStartReceiptHTML(null)).toBe('');
    });

    it('generates complete start receipt HTML preserving layout and fields', () => {
      const mockSession = {
        id: 's-test01',
        queueNo: 3,
        nama: 'Ahmad Pelanggan',
        startTime: 1700000000000,
        items: [
          { code: 'SA', qty: 2 },
          { code: 'UNKNOWN_CODE', qty: 1 }
        ]
      };

      const html = generateStartReceiptHTML(mockSession, 'Kasir 1');

      expect(html).toContain('EVREN HOUSE');
      expect(html).toContain('Struk Mulai Sewa');
      expect(html).toContain('Queue Number: 3');
      expect(html).toContain('Nama: Ahmad Pelanggan');
      expect(html).toContain('Shift: Kasir 1');
      expect(html).toContain('SA - Scooter Anak x2');
      expect(html).toContain('UNKNOWN_CODE x1');
      expect(html).toContain('Total Pokok:');
      expect(html).toContain('id="printQrCode"');
      expect(html).toContain('Scan QR untuk Cek Sisa Waktu');
      expect(html).toContain('Terima kasih!');
    });
  });

  describe('generateFinishReceiptHTML', () => {
    it('returns empty string for null txn', () => {
      expect(generateFinishReceiptHTML(null)).toBe('');
    });

    it('generates complete finish receipt HTML with breakdown, overtime, and payment mode', () => {
      const mockTxn = {
        id: 't-test01',
        queueNo: 3,
        no: 12,
        nama: 'Ahmad Pelanggan',
        shift: 'Kasir 1',
        startTime: 1700000000000,
        endTime: 1700005400000, // 1.5 jam
        items: 'SA x2, ST1 x1',
        ot: '30m',
        totalBase: 70000,
        totalOT: 35000,
        totalAll: 105000,
        payAwal: 'cash',
        cash: 105000,
        qris: 0
      };

      const html = generateFinishReceiptHTML(mockTxn);

      expect(html).toContain('EVREN HOUSE');
      expect(html).toContain('Struk Selesai Sewa');
      expect(html).toContain('Queue Number: 3');
      expect(html).toContain('No: 12');
      expect(html).toContain('Nama: Ahmad Pelanggan');
      expect(html).toContain('Shift: Kasir 1');
      expect(html).toContain('Item: SA x2, ST1 x1');
      expect(html).toContain('OT: 30m');
      expect(html).toContain('Sewa Pokok:');
      expect(html).toContain('Overtime:');
      expect(html).toContain('TOTAL:');
      expect(html).toContain('Cash:');
      expect(html).toContain('id="printQrCode"');
      expect(html).toContain('Scan QR untuk Struk Digital');
      expect(html).toContain('Terima kasih telah berkunjung!');
    });

    it('omits OT line when ot is "-" or totalOT is 0', () => {
      const mockTxnNoOT = {
        id: 't-test02',
        queueNo: 4,
        no: 13,
        nama: 'Budi Santoso',
        shift: 'Kasir 2',
        startTime: 1700000000000,
        endTime: 1700003600000,
        items: 'SA x1',
        ot: '-',
        totalBase: 35000,
        totalOT: 0,
        totalAll: 35000,
        payAwal: 'qris',
        cash: 0,
        qris: 35000
      };

      const html = generateFinishReceiptHTML(mockTxnNoOT);
      expect(html).not.toContain('Overtime:');
      expect(html).not.toContain('OT: -');
      expect(html).toContain('QRIS:');
    });
  });

  describe('generateAdditionalReceiptHTML', () => {
    it('generates HTML containing *** ADDITIONAL ORDER *** at the very top before brand name', () => {
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
});
