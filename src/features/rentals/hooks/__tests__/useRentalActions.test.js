import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRentalActions } from '../useRentalActions';
import * as api from '../../../../api';
import * as swal from '../../../../lib/swal';

vi.mock('../../../../api', () => ({
  addSession: vi.fn(),
  editSession: vi.fn(),
  claimSession: vi.fn()
}));

vi.mock('../../../../lib/swal', () => ({
  swalSuccess: vi.fn(),
  swalError: vi.fn(),
  swalWarning: vi.fn()
}));

describe('useRentalActions Hook Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('startRental calls API and updates activeSessions and localStorage queue', async () => {
    const setActiveSessions = vi.fn();
    const onSessionStarted = vi.fn();

    api.addSession.mockResolvedValue({
      session: {
        id: 's-new1',
        queueNo: 5,
        nama: 'Budi',
        items: [{ code: 'SA', qty: 1 }],
        startTime: 1700000000000,
        tanggal: '2026-08-25',
        payAwal: 'cash'
      }
    });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        onSessionStarted
      })
    );

    let startRes;
    await act(async () => {
      startRes = await result.current.startRental('Budi', [{ code: 'SA', qty: 1 }], 'cash');
    });

    expect(startRes.success).toBe(true);
    expect(api.addSession).toHaveBeenCalledTimes(1);
    expect(setActiveSessions).toHaveBeenCalledTimes(1);
    expect(onSessionStarted).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's-new1', queueNo: 5, nama: 'Budi' })
    );
    expect(localStorage.getItem('kw_shiftQNo')).toBe('5');
  });

  it('editRental calls editSession API and updates activeSessions in place', async () => {
    const setActiveSessions = vi.fn();
    const onEditSaved = vi.fn();

    api.editSession.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        onEditSaved
      })
    );

    const updatedSession = {
      id: 's-edit1',
      queueNo: 2,
      nama: 'Budi Edit',
      items: [{ code: 'SA', qty: 2 }],
      startTime: 1700000000000,
      tanggal: '2026-08-25',
      payAwal: 'qris'
    };

    let editRes;
    await act(async () => {
      editRes = await result.current.editRental(updatedSession);
    });

    expect(editRes.success).toBe(true);
    expect(api.editSession).toHaveBeenCalledWith(updatedSession);
    expect(setActiveSessions).toHaveBeenCalledTimes(1);
    expect(swal.swalSuccess).toHaveBeenCalledWith('Sesi Diperbarui!');
    expect(onEditSaved).toHaveBeenCalledWith(updatedSession);
  });

  it('claimRental (full return) calls claimSession, removes active session, and adds transaction', async () => {
    const setActiveSessions = vi.fn();
    const setTransactions = vi.fn();
    const onPaymentFinalized = vi.fn();

    api.claimSession.mockResolvedValue({
      success: true,
      transaction: {
        id: 't-s-full1',
        no: 10,
        nama: 'Ahmad',
        totalAll: 50000
      }
    });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        setTransactions,
        currentShiftUser: 'Kasir 1',
        onPaymentFinalized
      })
    );

    const activePaymentData = {
      session: {
        id: 's-full1',
        queueNo: 3,
        nama: 'Ahmad',
        tanggal: '2026-08-25',
        startTime: 1700000000000,
        payAwal: 'cash',
        items: [{ code: 'SA', qty: 1 }]
      },
      itemsCalc: [{ code: 'SA', returnQty: 1, baseCost: 50000, otCost: 0 }],
      base: 50000,
      ot: 0,
      tol: 0,
      grand: 0,
      otStr: '-',
      otDurStr: '-',
      endTime: 1700003600000
    };

    let claimRes;
    await act(async () => {
      claimRes = await result.current.claimRental(activePaymentData, 50000, 0);
    });

    expect(claimRes.success).toBe(true);
    expect(api.claimSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 's-full1',
        items: 'SA×1',
        remainingItems: [],
        shift: 'Kasir 1'
      })
    );
    expect(setTransactions).toHaveBeenCalledTimes(1);
    expect(setActiveSessions).toHaveBeenCalledTimes(1);
    expect(onPaymentFinalized).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't-s-full1', no: 10 })
    );
  });

  it('claimRental assigns current shift date (todayStr) to transaction even if session started on previous shift date', async () => {
    const setActiveSessions = vi.fn();
    const setTransactions = vi.fn();
    api.claimSession.mockResolvedValue({
      success: true,
      transaction: { id: 't-cross', no: 15 }
    });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        setTransactions,
        todayStr: () => '2026-08-26'
      })
    );

    const activePaymentData = {
      session: {
        id: 's-cross1',
        queueNo: 8,
        nama: 'Caca',
        tanggal: '2026-08-25',
        startTime: 1700000000000,
        payAwal: 'cash',
        items: [{ code: 'SA', qty: 1 }]
      },
      itemsCalc: [{ code: 'SA', returnQty: 1, baseCost: 35000, otCost: 0 }],
      base: 35000,
      ot: 0,
      tol: 0,
      grand: 0,
      endTime: 1700003600000
    };

    await act(async () => {
      await result.current.claimRental(activePaymentData, 35000, 0);
    });

    expect(api.claimSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 's-cross1',
        tanggal: '2026-08-26'
      })
    );
  });

  it('claimRental (partial return) updates active session with leftover items', async () => {
    const setActiveSessions = vi.fn();
    const setTransactions = vi.fn();

    api.claimSession.mockResolvedValue({
      success: true,
      transaction: {
        id: 't-s-part1',
        no: 11,
        nama: 'Doni'
      }
    });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        setTransactions
      })
    );

    const activePaymentData = {
      session: {
        id: 's-part1',
        queueNo: 4,
        nama: 'Doni',
        tanggal: '2026-08-25',
        startTime: 1700000000000,
        payAwal: 'cash',
        items: [{ code: 'SA', qty: 2 }] // 2 rented
      },
      itemsCalc: [{ code: 'SA', returnQty: 1, baseCost: 50000, otCost: 0 }], // 1 returned
      base: 50000,
      ot: 0,
      tol: 0,
      grand: 0,
      otStr: '-',
      otDurStr: '-',
      endTime: 1700003600000
    };

    let claimRes;
    await act(async () => {
      claimRes = await result.current.claimRental(activePaymentData, 50000, 0);
    });

    expect(claimRes.success).toBe(true);
    expect(claimRes.remainingItems).toEqual([{ code: 'SA', qty: 1 }]);
    expect(api.claimSession).toHaveBeenCalledWith(
      expect.objectContaining({
        remainingItems: [{ code: 'SA', qty: 1 }]
      })
    );
  });

  it('addItemsToRental appends items with individual startTime and payAwal, calling editSession', async () => {
    const setActiveSessions = vi.fn();
    const onAdditionalAdded = vi.fn();

    api.editSession.mockResolvedValue({ success: true });

    const mockSession = {
      id: 's-test',
      queueNo: 1,
      nama: 'Budi',
      startTime: 1000000,
      payAwal: 'cash',
      items: [{ code: 'STROLLER', qty: 1, startTime: 1000000, payAwal: 'cash', priceBase: 40000 }]
    };

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        onAdditionalAdded
      })
    );

    const newItems = [{ code: 'SCOOTER', qty: 1, priceBase: 30000 }];
    let res;
    await act(async () => {
      res = await result.current.addItemsToRental(mockSession, newItems, 'qris');
    });

    expect(res.success).toBe(true);
    expect(api.editSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's-test',
        items: expect.arrayContaining([
          expect.objectContaining({ code: 'STROLLER', qty: 1 }),
          expect.objectContaining({ code: 'SCOOTER', qty: 1, payAwal: 'qris' })
        ])
      })
    );
    expect(setActiveSessions).toHaveBeenCalledTimes(1);
    expect(swal.swalSuccess).toHaveBeenCalledWith('Item Tambahan Berhasil Ditambahkan!');
    expect(onAdditionalAdded).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's-test' }),
      expect.arrayContaining([
        expect.objectContaining({ code: 'SCOOTER', qty: 1, payAwal: 'qris' })
      ]),
      'qris'
    );
  });

  it('addItemsToRental handles API rejection, calling swalError and returning success: false', async () => {
    const setActiveSessions = vi.fn();
    const onAdditionalAdded = vi.fn();
    api.editSession.mockRejectedValue(new Error('Network error'));

    const mockSession = {
      id: 's-test',
      queueNo: 1,
      nama: 'Budi',
      startTime: 1000000,
      items: [{ code: 'STROLLER', qty: 1 }]
    };

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        onAdditionalAdded
      })
    );

    let res;
    await act(async () => {
      res = await result.current.addItemsToRental(mockSession, [{ code: 'SCOOTER', qty: 1 }], 'cash');
    });

    expect(res.success).toBe(false);
    expect(swal.swalError).toHaveBeenCalledWith('Gagal Tambah Item', 'Periksa koneksi ke server.');
    expect(setActiveSessions).not.toHaveBeenCalled();
    expect(onAdditionalAdded).not.toHaveBeenCalled();
  });

  it('editRental handles API logical failure (success: false), calling swalError without updating sessions or calling onEditSaved', async () => {
    const setActiveSessions = vi.fn();
    const onEditSaved = vi.fn();
    api.editSession.mockResolvedValue({ success: false, error: 'Database locked' });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        onEditSaved
      })
    );

    const updatedSession = { id: 's-edit1', nama: 'Budi' };
    let res;
    await act(async () => {
      res = await result.current.editRental(updatedSession);
    });

    expect(res.success).toBe(false);
    expect(swal.swalError).toHaveBeenCalledWith('Gagal Memperbarui', 'Periksa koneksi ke server.');
    expect(setActiveSessions).not.toHaveBeenCalled();
    expect(onEditSaved).not.toHaveBeenCalled();
  });

  it('claimRental handles API logical failure (success: false), calling swalError without updating transactions or calling onPaymentFinalized', async () => {
    const setActiveSessions = vi.fn();
    const setTransactions = vi.fn();
    const onPaymentFinalized = vi.fn();
    api.claimSession.mockResolvedValue({ success: false, error: 'Session already claimed' });

    const { result } = renderHook(() =>
      useRentalActions({
        setActiveSessions,
        setTransactions,
        onPaymentFinalized
      })
    );

    const activePaymentData = {
      session: { id: 's-fail1', nama: 'Fail' },
      itemsCalc: [],
      base: 0,
      ot: 0,
      tol: 0,
      grand: 0,
      endTime: 1700000000000
    };

    let res;
    await act(async () => {
      res = await result.current.claimRental(activePaymentData, 0, 0);
    });

    expect(res.success).toBe(false);
    expect(swal.swalError).toHaveBeenCalledWith('Gagal Proses Pembayaran', 'Periksa koneksi ke server.');
    expect(setActiveSessions).not.toHaveBeenCalled();
    expect(setTransactions).not.toHaveBeenCalled();
    expect(onPaymentFinalized).not.toHaveBeenCalled();
  });
});


