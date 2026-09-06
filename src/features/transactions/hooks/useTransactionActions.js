import { deleteTxn, clearAllTxns, addDeletionLog, getDeletionLogs, clearEscalationToken } from '../../../api';
import { swalConfirm, swalWarning } from '../../../lib/swal';

/**
 * Adapter hook for destructive transaction actions (delete single transaction, clear all history, fetch deletion logs).
 * Preserves existing optimistic update and server rollback semantics.
 */
export function useTransactionActions(options = {}) {
  const {
    transactions = [],
    setTransactions,
    setDeletionLogs,
    currentShiftUser = 'admin',
    loadData
  } = options;

  const deleteTransaction = async (txn) => {
    const txnObj = typeof txn === 'object' ? txn : { id: txn };
    const ok = await swalConfirm(
      'Hapus Riwayat Transaksi?',
      `Bill atas nama "${txnObj.nama || '-'}" akan dihapus secara permanen.`,
      'Ya, Hapus!'
    );
    if (!ok) {
      return { success: false, cancelled: true };
    }

    // Catat log penghapusan sebelum dihapus
    const logEntry = {
      txnId: txnObj.id || null,
      txnNo: txnObj.no || null,
      txnNama: txnObj.nama || '',
      txnTanggal: txnObj.tanggal || '',
      txnTotalAll: txnObj.totalAll || 0,
      deletedAt: Date.now(),
      deletedBy: currentShiftUser || 'admin'
    };

    // Optimistic UI update
    if (typeof setTransactions === 'function') {
      setTransactions((prev) =>
        prev.filter((t) => t.id !== txnObj.id && String(t.no) !== String(txnObj.no))
      );
    }
    if (typeof setDeletionLogs === 'function') {
      setDeletionLogs((prev) => [{ ...logEntry, id: Date.now() }, ...prev]);
    }

    try {
      const delRes = await deleteTxn({ id: txnObj.id, no: txnObj.no });
      if (delRes && (delRes.error || delRes.success === false)) {
        throw new Error(delRes.error || 'Gagal menghapus transaksi');
      }
      await addDeletionLog(logEntry);
      return { success: true, logEntry };
    } catch (e) {
      console.error('Failed to delete transaction on server:', e);
      // Rollback on error
      if (typeof loadData === 'function') {
        await loadData();
      }
      return { success: false, error: e };
    } finally {
      clearEscalationToken();
    }
  };

  const clearHistory = async () => {
    if (!transactions || transactions.length === 0) {
      swalWarning('Riwayat Kosong', 'Tidak ada riwayat transaksi untuk dibersihkan.');
      return { success: false, error: 'empty' };
    }

    const ok = await swalConfirm(
      'Bersihkan Semua Riwayat?',
      'Seluruh data riwayat transaksi akan dihapus secara permanen dan tidak bisa dikembalikan!',
      'Ya, Bersihkan!',
      'warning'
    );
    if (!ok) {
      return { success: false, cancelled: true };
    }

    // Optimistic UI update
    if (typeof setTransactions === 'function') {
      setTransactions([]);
    }

    try {
      const clearRes = await clearAllTxns();
      if (clearRes && (clearRes.error || clearRes.success === false)) {
        throw new Error(clearRes.error || 'Gagal membersihkan riwayat');
      }
      return { success: true };
    } catch (e) {
      console.error('Failed to clear history on server:', e);
      if (typeof loadData === 'function') {
        await loadData();
      }
      return { success: false, error: e };
    }
  };

  const loadDeletionLogs = async () => {
    try {
      const res = await getDeletionLogs();
      if (res && res.logs && typeof setDeletionLogs === 'function') {
        setDeletionLogs(res.logs);
      }
      return res?.logs || [];
    } catch (e) {
      console.error('Failed to fetch deletion logs:', e);
      return [];
    }
  };

  return {
    deleteTransaction,
    clearHistory,
    loadDeletionLogs
  };
}
