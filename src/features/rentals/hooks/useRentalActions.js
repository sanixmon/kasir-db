import { addSession, editSession, claimSession } from '../../../api';
import { generateShortId, normalizeSession, normalizeTxn } from '../../../lib/utils';
import { getShiftDate } from '../../../lib/shift';
import { calculatePartialReturn } from '../domain/rentalCalculations';
import { swalSuccess, swalError } from '../../../lib/swal';

/**
 * Adapter hook for rental mutation actions (start, edit, claim/partial return).
 * Manages API communication and optimistic UI updates.
 */
export function useRentalActions(options = {}) {
  const {
    setActiveSessions,
    setTransactions,
    currentShiftUser = '-',
    todayStr = (ts) => getShiftDate(ts),
    onSessionStarted,
    onEditSaved,
    onPaymentFinalized,
    onAdditionalAdded
  } = options;

  const startRental = async (nama, items, payAwal) => {
    const sessionData = {
      id: generateShortId('s'),
      nama,
      items,
      startTime: Date.now(),
      tanggal: todayStr(),
      payAwal
    };

    try {
      const res = await addSession(sessionData);
      if (res && res.session) {
        const newSess = normalizeSession(res.session);
        localStorage.setItem('kw_shiftQNo', String(newSess.queueNo || 0));
        if (typeof setActiveSessions === 'function') {
          setActiveSessions((prev) => [...prev.filter((s) => s.id !== newSess.id), newSess]);
        }
        if (typeof onSessionStarted === 'function') {
          onSessionStarted(newSess);
        }
        return { success: true, session: newSess };
      } else {
        throw new Error(res?.error || 'Gagal menyimpan sesi ke server');
      }
    } catch (e) {
      console.error('Failed to start session:', e);
      swalError('Gagal Memulai Sesi', 'Periksa koneksi ke server.');
      return { success: false, error: e };
    }
  };

  const editRental = async (updatedSession) => {
    try {
      await editSession(updatedSession);
      if (typeof setActiveSessions === 'function') {
        setActiveSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? normalizeSession(updatedSession) : s))
        );
      }
      swalSuccess('Sesi Diperbarui!');
      if (typeof onEditSaved === 'function') {
        onEditSaved(updatedSession);
      }
      return { success: true };
    } catch (e) {
      console.error('Failed to save edited session:', e);
      swalError('Gagal Memperbarui', 'Periksa koneksi ke server.');
      return { success: false, error: e };
    }
  };

  const claimRental = async (activePaymentData, cash, qris) => {
    if (!activePaymentData) return { success: false, error: 'No active payment data' };
    const { session, itemsCalc, base, ot, tol, grand, otStr, otDurStr, endTime } = activePaymentData;

    const { itemStr, remainingItems } = calculatePartialReturn(session.items || [], itemsCalc || []);

    const claimPayload = {
      sessionId: session.id,
      remainingItems,
      queueNo: session.queueNo || 0,
      nama: session.nama,
      tanggal: session.tanggal || todayStr(),
      startTime: session.startTime,
      endTime,
      items: itemStr,
      ot: otStr || '-',
      otDur: otDurStr || '-',
      totalBase: base,
      totalOT: ot,
      totalTol: tol,
      grandTotal: grand,
      totalAll: base + grand,
      payAwal: session.payAwal || 'cash',
      cash,
      qris,
      shift: currentShiftUser || '-'
    };

    try {
      const res = await claimSession(claimPayload);
      if (res && !res.error) {
        const newTxn = normalizeTxn(res.transaction || { ...claimPayload, id: `t-${session.id}` });
        if (typeof setTransactions === 'function') {
          setTransactions((prev) =>
            [...prev.filter((t) => t.id !== newTxn.id), newTxn].sort(
              (a, b) => (a.no || 0) - (b.no || 0)
            )
          );
        }
        if (typeof setActiveSessions === 'function') {
          if (remainingItems.length > 0) {
            setActiveSessions((prev) =>
              prev.map((s) => (s.id === session.id ? { ...s, items: remainingItems } : s))
            );
          } else {
            setActiveSessions((prev) => prev.filter((s) => s.id !== session.id));
          }
        }
        if (typeof onPaymentFinalized === 'function') {
          onPaymentFinalized(newTxn);
        }
        return { success: true, transaction: newTxn, remainingItems };
      } else {
        throw new Error(res?.error || 'Gagal memproses pembayaran');
      }
    } catch (e) {
      console.error('Failed to finalize payment:', e);
      swalError('Gagal Proses Pembayaran', 'Periksa koneksi ke server.');
      return { success: false, error: e };
    }
  };

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
      payAwal: String(additionalPayAwal || 'cash').toLowerCase(),
      priceBase: Number(item.priceBase || 0)
    }));

    const existingItems = Array.isArray(session.items) ? session.items : [];
    const mergedItems = [...existingItems, ...enrichedNewItems];

    const updatedSession = {
      ...session,
      items: mergedItems
    };

    try {
      await editSession(updatedSession);
      const normalizedSess = normalizeSession(updatedSession);
      if (typeof setActiveSessions === 'function') {
        setActiveSessions((prev) =>
          prev.map((s) => (s.id === session.id ? normalizedSess : s))
        );
      }
      swalSuccess('Item Tambahan Berhasil Ditambahkan!');
      if (typeof onAdditionalAdded === 'function') {
        onAdditionalAdded(normalizedSess, enrichedNewItems, additionalPayAwal);
      }
      return { success: true, session: normalizedSess };
    } catch (e) {
      console.error('Failed to add items to rental:', e);
      swalError('Gagal Tambah Item', 'Periksa koneksi ke server.');
      return { success: false, error: e };
    }
  };

  return {
    startRental,
    editRental,
    claimRental,
    addItemsToRental
  };
}

