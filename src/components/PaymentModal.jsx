import React, { useState } from 'react';
import { fmtRp } from '../lib/utils';

function PaymentModal({ bayarData, onClose, onFinalize }) {
  const { grand = 0, session = {} } = bayarData || {};
  const isNoOT = grand === 0;

  const [payMode, setPayMode] = useState(isNoOT ? (session?.payAwal || 'cash') : 'cash');
  const [cashAmt, setCashAmt] = useState(grand);
  const [qrisAmt, setQrisAmt] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinalize = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    let finalCash = 0;
    let finalQris = 0;

    if (payMode === 'cash') {
      finalCash = grand;
    } else if (payMode === 'qris') {
      finalQris = grand;
    }

    try {
      await onFinalize(finalCash, finalQris);
    } catch (err) {
      console.error('Finalize payment failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeVal = Math.max(0, cashAmt - grand);

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title"><i className="bi bi-credit-card-fill me-2 clr-green"></i>Pembayaran</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup"></button>
          </div>
          <div className="modal-body p-0">
            <div className="bayar-wrap" style={{ padding: '20px' }}>
              <div className="bayar-total-box text-center p-3 mb-3 border rounded">
                <div className="bt-label">Total Tagihan (Overtime)</div>
                <div className="bt-val font-weight-bold" style={{ fontSize: '1.8rem', color: 'var(--yellow)' }}>{fmtRp(grand)}</div>
              </div>

              {isNoOT ? (
                <div className="p-3 mb-3 border rounded text-center" style={{ background: 'var(--bg3)', borderColor: 'var(--green)' }}>
                  <div className="text-success fw-bold mb-1">
                    <i className="bi bi-check-circle-fill me-1"></i> Pengembalian Tepat Waktu
                  </div>
                  <div className="small text-muted">
                    Tarif sewa pokok sudah lunas saat sewa awal via <strong>{(session?.payAwal || 'cash').toUpperCase()}</strong>. Tidak ada tagihan overtime.
                  </div>
                </div>
              ) : (
                <>
                  <div className="pay-methods d-flex gap-2 justify-content-center mb-3">
                    <button 
                      type="button"
                      disabled={isNoOT && session.payAwal !== 'cash'}
                      className={`btn flex-fill py-2 btn-outline-primary d-inline-flex align-items-center justify-content-center ${payMode === 'cash' ? 'active' : ''}`}
                      onClick={() => { setPayMode('cash'); setCashAmt(grand); setQrisAmt(0); }}
                      aria-label="Metode Pembayaran Cash"
                    >
                      <i className="bi bi-cash-stack me-2 fs-5"></i>
                      <span>Cash</span>
                    </button>
                    <button 
                      type="button"
                      disabled={isNoOT && session.payAwal !== 'qris'}
                      className={`btn flex-fill py-2 btn-outline-primary d-inline-flex align-items-center justify-content-center ${payMode === 'qris' ? 'active' : ''}`}
                      onClick={() => { setPayMode('qris'); setCashAmt(0); setQrisAmt(grand); }}
                      aria-label="Metode Pembayaran QRIS"
                    >
                      <i className="bi bi-qr-code-scan me-2 fs-5"></i>
                      <span>QRIS</span>
                    </button>
                  </div>

                  {payMode === 'cash' && (
                    <div className="mb-3">
                      <label htmlFor="cashReceivedInput" className="field-label">Jumlah Uang Cash Diterima</label>
                      <input 
                        id="cashReceivedInput"
                        type="number" 
                        className="cfield" 
                        style={{ paddingLeft: '12px' }}
                        value={cashAmt}
                        onChange={(e) => setCashAmt(Number(e.target.value))} 
                        aria-label="Jumlah Uang Cash Diterima"
                      />
                      {grand > 0 && (
                        <div className="d-flex gap-2 mt-2 flex-wrap">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-secondary py-1 px-2"
                            onClick={() => setCashAmt(grand)}
                            style={{ fontSize: '0.78rem' }}
                          >
                            Uang Pas
                          </button>
                          {grand <= 50000 && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary py-1 px-2"
                              onClick={() => setCashAmt(50000)}
                              style={{ fontSize: '0.78rem' }}
                            >
                              Rp 50.000
                            </button>
                          )}
                          {grand <= 100000 && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary py-1 px-2"
                              onClick={() => setCashAmt(100000)}
                              style={{ fontSize: '0.78rem' }}
                            >
                              Rp 100.000
                            </button>
                          )}
                        </div>
                      )}
                      {cashAmt < grand && grand > 0 ? (
                        <div className="text-warning small mt-2 d-flex align-items-center gap-1">
                          <i className="bi bi-exclamation-triangle-fill"></i>
                          <span>Uang diterima kurang dari total tagihan ({fmtRp(grand - cashAmt)} lagi)</span>
                        </div>
                      ) : (
                        <div className="kembalian-box mt-3 p-2 bg-success-subtle text-success rounded d-flex justify-content-between">
                          <span>Kembalian</span>
                          <strong>{fmtRp(changeVal)}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {payMode === 'qris' && (
                    <div className="p-3 text-center border rounded mb-3" style={{ background: 'var(--bg3)' }}>
                      <div className="mb-2" style={{ fontSize: '1.8rem', color: 'var(--cyan)' }}>
                        <i className="bi bi-qr-code-scan"></i>
                      </div>
                      <div className="fw-bold mb-1">Scan QRIS Kasir</div>
                      <div style={{ color: 'var(--yellow)', fontSize: '1.2rem', fontWeight: 800 }}>{fmtRp(grand)}</div>
                    </div>
                  )}
                </>
              )}

              <button className="btn-start w-100 mb-2" onClick={handleFinalize} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Menyimpan Transaksi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {isNoOT ? 'Konfirmasi Selesai (Rp 0)' : 'Konfirmasi Pembayaran'}
                  </>
                )}
              </button>
              <button className="btn-sec w-100" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
