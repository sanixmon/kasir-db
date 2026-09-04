import React, { useState } from 'react';
import { ITEMS } from '../../../lib/items';
import { swalWarning } from '../../../lib/swal';

function EditActiveSessionModal({ session, onClose, onSave }) {
  const [nama, setNama] = useState(session?.nama || '');
  const [payAwal, setPayAwal] = useState(session?.payAwal || 'cash');
  const [editItems, setEditItems] = useState(() => Array.isArray(session?.items) ? session.items.map(i => (i ? { ...i } : null)).filter(Boolean) : []);

  const handleChgQty = (code, delta) => {
    setEditItems(prev => {
      const idx = prev.findIndex(i => i.code === code);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].qty = Math.max(0, updated[idx].qty + delta);
        if (updated[idx].qty === 0) {
          updated.splice(idx, 1);
        }
        return updated;
      } else if (delta > 0) {
        return [...prev, { code, qty: 1 }];
      }
      return prev;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    const trimmedNama = nama.trim();
    if (!trimmedNama) {
      swalWarning('Nama Kosong', 'Nama tidak boleh kosong!');
      return;
    }
    const finalItems = editItems.filter(i => i.qty > 0);
    if (!finalItems.length) {
      swalWarning('Item Belum Dipilih', 'Pilih minimal satu item!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...session,
        nama: trimmedNama,
        payAwal,
        items: finalItems
      });
    } catch (err) {
      console.error('Save edited session failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title"><i className="bi bi-pencil-fill me-2 clr-yellow"></i>Edit Sesi Aktif</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup"></button>
          </div>
          <div className="modal-body p-0">
            <div className="edit-sesi-wrap" style={{ padding: '20px' }}>
              <div className="info-box mb-3 p-2 border rounded"><div className="lbl small text-secondary">Penyewa</div><div className="val name font-weight-bold">{session.nama}</div></div>
              <div className="mb-3">
                <label className="edit-field-label small text-secondary mb-1">Nama Penyewa</label>
                <input 
                  type="text" 
                  className="cfield" 
                  value={nama} 
                  onChange={(e) => setNama(e.target.value)}
                  style={{ paddingLeft: '12px' }} 
                  aria-label="Nama Penyewa"
                />
              </div>
              <div className="mb-3">
                <div className="edit-sesi-section-title small text-secondary mb-2">Metode Bayar Pokok</div>
                <div className="pay-awal-selector d-flex gap-2">
                  <label className="pay-awal-opt flex-fill border p-2 rounded text-center" style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="esPayAwal" 
                      value="cash" 
                      checked={payAwal === 'cash'} 
                      onChange={() => setPayAwal('cash')}
                      aria-label="Cash"
                    />
                    <span className="ms-1"><i className="bi bi-cash-stack me-1"></i>Cash</span>
                  </label>
                  <label className="pay-awal-opt flex-fill border p-2 rounded text-center" style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="esPayAwal" 
                      value="qris" 
                      checked={payAwal === 'qris'} 
                      onChange={() => setPayAwal('qris')}
                      aria-label="QRIS"
                    />
                    <span className="ms-1"><i className="bi bi-qr-code-scan me-1"></i>QRIS</span>
                  </label>
                </div>
              </div>
              <div className="edit-sesi-section-title small text-secondary mb-2">Item &amp; Jumlah</div>
              <div className="edit-sesi-items mb-3">
                {ITEMS.map(item => {
                  const ex = editItems.find(i => i.code === item.code);
                  const qty = ex ? ex.qty : 0;
                  return (
                    <div className="edit-sesi-item-row d-flex justify-content-between align-items-center py-2 border-bottom" key={item.code}>
                      <div className="edit-sesi-item-name">
                        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '.7rem', color: 'var(--yellow)' }}>{item.code}</span>
                        <span className="ms-2">{item.name}</span>
                      </div>
                      <div className="edit-sesi-qty-ctrl d-flex align-items-center gap-2">
                        <button 
                          type="button" 
                          className="edit-sesi-qty-btn btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" 
                          onClick={() => handleChgQty(item.code, -1)}
                          aria-label={`Kurangi ${item.name}`}
                        >
                          <i className="bi bi-dash fs-6"></i>
                        </button>
                        <span className="edit-sesi-qty-val font-weight-bold font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                        <button 
                          type="button" 
                          className="edit-sesi-qty-btn btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" 
                          onClick={() => handleChgQty(item.code, 1)}
                          aria-label={`Tambah ${item.name}`}
                        >
                          <i className="bi bi-plus fs-6"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn-sec flex-fill py-2" onClick={onClose} disabled={isSubmitting}>Batal</button>
                <button className="btn-start flex-fill py-2" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy-fill me-2"></i>Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditActiveSessionModal;
