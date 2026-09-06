import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionActions } from '../useTransactionActions';
import * as api from '../../../../api';
import * as swal from '../../../../lib/swal';

vi.mock('../../../../api', () => ({
  deleteTxn: vi.fn(),
  clearAllTxns: vi.fn(),
  addDeletionLog: vi.fn(),
  getDeletionLogs: vi.fn(),
  clearEscalationToken: vi.fn()
}));

vi.mock('../../../../lib/swal', () => ({
  swalConfirm: vi.fn(),
  swalWarning: vi.fn()
}));

describe('useTransactionActions Hook Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteTransaction', () => {
    it('successfully deletes transaction with optimistic update and log entry', async () => {
      swal.swalConfirm.mockResolvedValue(true);
      api.deleteTxn.mockResolvedValue({ success: true });
      api.addDeletionLog.mockResolvedValue({ success: true });

      const setTransactions = vi.fn();
      const setDeletionLogs = vi.fn();

      const { result } = renderHook(() =>
        useTransactionActions({
          setTransactions,
          setDeletionLogs,
          currentShiftUser: 'Kasir A'
        })
      );

      const txn = { id: 't-1', no: 1, nama: 'Budi', tanggal: '2026-08-25', totalAll: 50000 };

      let res;
      await act(async () => {
        res = await result.current.deleteTransaction(txn);
      });

      expect(res.success).toBe(true);
      expect(swal.swalConfirm).toHaveBeenCalledTimes(1);
      expect(setTransactions).toHaveBeenCalledTimes(1);
      expect(setDeletionLogs).toHaveBeenCalledTimes(1);
      expect(api.deleteTxn).toHaveBeenCalledWith({ id: 't-1', no: 1 });
      expect(api.addDeletionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          txnId: 't-1',
          txnNo: 1,
          txnNama: 'Budi',
          deletedBy: 'Kasir A'
        })
      );
      expect(api.clearEscalationToken).toHaveBeenCalledTimes(1);
    });

    it('cancels deletion when user clicks cancel on confirm dialog', async () => {
      swal.swalConfirm.mockResolvedValue(false);

      const setTransactions = vi.fn();
      const { result } = renderHook(() =>
        useTransactionActions({ setTransactions })
      );

      let res;
      await act(async () => {
        res = await result.current.deleteTransaction({ id: 't-1', no: 1 });
      });

      expect(res.cancelled).toBe(true);
      expect(setTransactions).not.toHaveBeenCalled();
      expect(api.deleteTxn).not.toHaveBeenCalled();
    });

    it('rolls back via loadData when API delete fails', async () => {
      swal.swalConfirm.mockResolvedValue(true);
      api.deleteTxn.mockRejectedValue(new Error('Network error on delete'));

      const setTransactions = vi.fn();
      const setDeletionLogs = vi.fn();
      const loadData = vi.fn();

      const { result } = renderHook(() =>
        useTransactionActions({
          setTransactions,
          setDeletionLogs,
          loadData
        })
      );

      let res;
      await act(async () => {
        res = await result.current.deleteTransaction({ id: 't-1', no: 1 });
      });

      expect(res.success).toBe(false);
      expect(loadData).toHaveBeenCalledTimes(1);
      expect(api.clearEscalationToken).toHaveBeenCalledTimes(1);
    });

    it('rolls back via loadData when API delete returns logical failure (success: false)', async () => {
      swal.swalConfirm.mockResolvedValue(true);
      api.deleteTxn.mockResolvedValue({ success: false, error: 'Unauthorized' });

      const setTransactions = vi.fn();
      const setDeletionLogs = vi.fn();
      const loadData = vi.fn();

      const { result } = renderHook(() =>
        useTransactionActions({
          setTransactions,
          setDeletionLogs,
          loadData
        })
      );

      let res;
      await act(async () => {
        res = await result.current.deleteTransaction({ id: 't-1', no: 1 });
      });

      expect(res.success).toBe(false);
      expect(loadData).toHaveBeenCalledTimes(1);
      expect(api.clearEscalationToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearHistory', () => {
    it('shows warning and does nothing when transactions array is empty', async () => {
      const { result } = renderHook(() =>
        useTransactionActions({ transactions: [] })
      );

      let res;
      await act(async () => {
        res = await result.current.clearHistory();
      });

      expect(res.error).toBe('empty');
      expect(swal.swalWarning).toHaveBeenCalledWith(
        'Riwayat Kosong',
        expect.any(String)
      );
      expect(api.clearAllTxns).not.toHaveBeenCalled();
    });

    it('clears all transactions optimistically on confirm and calls API', async () => {
      swal.swalConfirm.mockResolvedValue(true);
      api.clearAllTxns.mockResolvedValue({ success: true });

      const setTransactions = vi.fn();
      const { result } = renderHook(() =>
        useTransactionActions({
          transactions: [{ id: 't-1' }],
          setTransactions
        })
      );

      let res;
      await act(async () => {
        res = await result.current.clearHistory();
      });

      expect(res.success).toBe(true);
      expect(setTransactions).toHaveBeenCalledWith([]);
      expect(api.clearAllTxns).toHaveBeenCalledTimes(1);
    });

    it('rolls back via loadData when clearAllTxns API fails', async () => {
      swal.swalConfirm.mockResolvedValue(true);
      api.clearAllTxns.mockRejectedValue(new Error('Clear API failed'));

      const setTransactions = vi.fn();
      const loadData = vi.fn();

      const { result } = renderHook(() =>
        useTransactionActions({
          transactions: [{ id: 't-1' }],
          setTransactions,
          loadData
        })
      );

      let res;
      await act(async () => {
        res = await result.current.clearHistory();
      });

      expect(res.success).toBe(false);
      expect(loadData).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadDeletionLogs', () => {
    it('fetches deletion logs and updates state', async () => {
      const mockLogs = [{ id: 1, txnNama: 'Budi' }];
      api.getDeletionLogs.mockResolvedValue({ logs: mockLogs });

      const setDeletionLogs = vi.fn();
      const { result } = renderHook(() =>
        useTransactionActions({ setDeletionLogs })
      );

      let logs;
      await act(async () => {
        logs = await result.current.loadDeletionLogs();
      });

      expect(logs).toEqual(mockLogs);
      expect(setDeletionLogs).toHaveBeenCalledWith(mockLogs);
    });
  });
});
