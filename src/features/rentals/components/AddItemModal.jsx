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
