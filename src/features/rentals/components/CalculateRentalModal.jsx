import React, { useState, useEffect } from 'react';
import { ITEMS } from '../../../lib/items';
import { fmtRp } from '../../../lib/utils';
import {
  calculateItemDetail,
  calculateRentalTotals,
  formatOvertimeStrings
} from '../domain/rentalCalculations';

function CalculateRentalModal({ session, onClose, onProceedPayment, currentUserRole }) {
  const isAdmin = currentUserRole === 'admin';
  // Guard: if startTime is 0 / epoch 1970 (backend NaN bug), default to now
  // Only clamp if before year 2020 — old-but-valid sessions are still valid
  const safeStart = (session?.startTime && Number(session.startTime) > 1577836800000)
    ? Number(session.startTime)
    : Date.now();
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - safeStart) / 1000));
  const [elapsedMin, setElapsedMin] = useState(() => Math.floor((Date.now() - safeStart) / 1000) / 60);
  const [itemsCalc, setItemsCalc] = useState([]);

  useEffect(() => {
    const el = Math.floor((Date.now() - safeStart) / 1000);
    const elMin = el / 60;
    setElapsed(el);
    setElapsedMin(elMin);

    const now = Date.now();
    const initial = (Array.isArray(session?.items) ? session.items : []).map(it => {
      if (!it) return null;
      const def = ITEMS.find(item => item.code === it.code) || { priceHour: 0, priceOT30: 0, priceOT60: 0 };
      const itemStart = (it.startTime && Number(it.startTime) > 1577836800000)
        ? Number(it.startTime)
        : safeStart;
      const itemElSec = Math.max(0, Math.floor((now - itemStart) / 1000));
      const itemElMin = itemElSec / 60;
      return {
        ...calculateItemDetail(it, def, itemElMin),
        itemStart,
        itemElapsedMin: itemElMin
      };
    }).filter(Boolean);
    setItemsCalc(initial);
  }, [session, safeStart]);

  const handleReturnQtyChange = (idx, delta) => {
    const now = Date.now();
    setItemsCalc(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const newReturnQty = Math.max(0, Math.min(it.qty || 1, (it.returnQty || 1) + delta));
      const itemStart = (it.itemStart && Number(it.itemStart) > 1577836800000)
        ? Number(it.itemStart)
        : safeStart;
      const itemElSec = Math.max(0, Math.floor((now - itemStart) / 1000));
      const itemElMin = itemElSec / 60;
      return {
        ...calculateItemDetail(it, it.def, itemElMin, newReturnQty),
        itemStart,
        itemElapsedMin: itemElMin
      };
    }));
  };

  const { baseSum, otSum, grandOT, totalReturnQty } = calculateRentalTotals(itemsCalc);

  const isOT = itemsCalc.some(it => it.returnQty > 0 && Math.floor((it.itemElapsedMin ?? elapsedMin) - it.limitMin) >= 11);
  const maxOver = Math.max(0, ...itemsCalc.map(it => {
    const curElMin = it.itemElapsedMin ?? elapsedMin;
    const o = curElMin - it.limitMin;
    return it.returnQty > 0 && Math.floor(o) >= 11 ? o : 0;
  }));

  const isMultiItem = session.items.length > 1 || session.items.some(i => i.qty > 1);
  const canProceed = totalReturnQty > 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceed = () => {
    if (isSubmitting || !canProceed) return;
    setIsSubmitting(true);
    const { otStr, otDurStr } = formatOvertimeStrings(itemsCalc);

    const calculatedData = {
      session,
      itemsCalc,
      base: baseSum,
      ot: otSum,
      tol: 0,
      grand: grandOT,
      otStr,
      otDurStr,
      elapsed,
      endTime: Date.now()
    };
    onProceedPayment(calculatedData);
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title"><i className="bi bi-calculator-fill me-2 clr-yellow"></i>Hitung Sewa</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup"></button>
          </div>
          <div className="modal-body p-0">
            <div className="hitung-wrap" style={{ padding: '20px' }}>
              <div className="info-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div className="info-box"><div className="lbl">Nama</div><div className="val name">{session.nama}</div></div>
                <div className="info-box"><div className="lbl">Mulai Sewa</div><div className="val">{new Date(session.startTime).toTimeString().slice(0,5)}</div></div>
                <div className="info-box"><div className="lbl">Sekarang</div><div className="val">{new Date().toTimeString().slice(0,5)}</div></div>
              </div>
              
              <div className="pokok-lunas-box mb-3">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <i className="bi bi-check-circle-fill clr-green"></i>
                  <span style={{ fontWeight: 800, color: 'var(--green)' }}>Tarif Sewa Pokok — Sudah Dibayar</span>
                  <span className="ms-auto" style={{ fontWeight: 800 }}>{fmtRp(baseSum)}</span>
                </div>
              </div>

              {isOT ? (
                <div className="ot-alert mb-3">
                  <i className="bi bi-exclamation-triangle-fill clr-orange me-1"></i>
                  Ada item melewati batas! ({Math.floor(maxOver)} menit overtime)
                </div>
              ) : (
                <div className="ot-alert mb-3" style={{ background: 'rgba(63,185,80,.1)', borderColor: 'var(--green)' }}>
                  <i className="bi bi-check-circle-fill clr-green me-1"></i>
                  Durasi dalam batas normal.
                </div>
              )}

              <div className="ot-section-title"><i className="bi bi-lightning-charge-fill clr-orange me-1"></i><span>Biaya Overtime</span></div>
              
              <div className="mb-3">
                {itemsCalc.map((it, idx) => {
                  const curElMin = it.itemElapsedMin ?? elapsedMin;
                  const overMin = curElMin - it.limitMin;
                  const isReturned = it.returnQty > 0;
                  return (
                    <div className="ot-item-row" key={it.code + idx} style={{ opacity: isReturned ? 1 : 0.45 }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div>
                          <span style={{ fontWeight: 800 }}>{it.code}</span> - {it.def?.name || it.code}
                          <span className="ms-2 badge bg-secondary">{it.qty} unit</span>
                        </div>
                        {isMultiItem && (
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '.75rem', color: 'var(--text-sec)' }}>Kembali:</span>
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                style={{ minWidth: '34px', minHeight: '34px' }}
                                onClick={() => handleReturnQtyChange(idx, -1)}
                                disabled={it.returnQty <= 0}
                                aria-label="-"
                                title={`Kurangi retur ${it.code}`}
                              ><i className="bi bi-dash"></i></button>
                              <span className="btn btn-outline-secondary py-1 px-2 disabled text-body d-inline-flex align-items-center justify-content-center font-monospace fw-bold" style={{ minWidth: '34px' }}>
                                {it.returnQty}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline-secondary py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                style={{ minWidth: '34px', minHeight: '34px' }}
                                onClick={() => handleReturnQtyChange(idx, 1)}
                                disabled={it.returnQty >= it.qty}
                                aria-label="+"
                                title={`Tambah retur ${it.code}`}
                              ><i className="bi bi-plus"></i></button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {isReturned ? (
                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '.8rem', color: 'var(--text-sec)' }}>
                          <div>
                            {Math.floor(overMin) >= 11 ? (
                              <span className="text-warning">
                                +{Math.floor(overMin)}m OT
                                {it.otFullCount > 0 ? ` (${it.otFullCount}×1j)` : ''}
                                {it.otHalfCount > 0 ? ` (${it.otHalfCount}×½j)` : ''}
                                {it.returnQty > 1 ? ` × ${it.returnQty} unit` : ''}
                              </span>
                            ) : (
                              <span className="text-success">Normal (≤ {it.limitMin}m)</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, color: it.otCost > 0 ? 'var(--orange)' : 'var(--text-sec)' }}>
                            {fmtRp(it.otCost)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                          <i className="bi bi-pause-circle me-1"></i>Belum dikembalikan (masih aktif di sesi)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="total-box">
                <div className="tot-row mb-1">
                  <span>Total Sewa Pokok:</span>
                  <span>{fmtRp(baseSum)}</span>
                </div>
                <div className="tot-row mb-1">
                  <span>Total Overtime:</span>
                  <span style={{ color: 'var(--orange)' }}>+{fmtRp(otSum)}</span>
                </div>
                <div className="tot-row grand mt-2 pt-2 border-top">
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total Tagihan Akhir:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--yellow)' }}>{fmtRp(baseSum + grandOT)}</span>
                </div>
              </div>

              {!canProceed && (
                <div className="alert alert-warning py-2 px-3 mt-3 mb-0" style={{ fontSize: '.8rem' }}>
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  Pilih minimal 1 item yang dikembalikan untuk melanjutkan.
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <button className="btn-sec flex-fill py-2" onClick={onClose}>Tutup</button>
                <button 
                  className="btn-start flex-fill py-2" 
                  onClick={handleProceed}
                  disabled={!canProceed || isSubmitting}
                >
                  <i className="bi bi-arrow-right-circle-fill me-2"></i>Lanjut Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculateRentalModal;
