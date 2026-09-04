import React, { useState, useEffect } from 'react';
import { ITEMS } from '../lib/items';
import { fmtRp, fmtDur } from '../lib/utils';
import { swalWarning } from '../lib/swal';

function LiveSessionTimer({ session, onSelesaiSewa, onShowQR, onPrintSesi, onEditSesi, onAddItem }) {
  const safeStart = (session.startTime && Number(session.startTime) > 1577836800000) ? Number(session.startTime) : Date.now();
  const [elapsedSec, setElapsedSec] = useState(() => Math.max(0, Math.floor((Date.now() - safeStart) / 1000)));

  useEffect(() => {
    const update = () => {
      const sec = Math.max(0, Math.floor((Date.now() - safeStart) / 1000));
      setElapsedSec(sec);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [safeStart]);

  const itemsList = Array.isArray(session.items) ? session.items : [];
  const pkgItem = itemsList.find(it => {
    if (!it || !it.code) return false;
    const d = ITEMS.find(item => item.code === it.code);
    return d && d.isPackage;
  });
  const pkgHours = pkgItem ? (ITEMS.find(item => item.code === pkgItem.code)?.packageHours || 1) : 1;
  const limitMin = pkgItem ? pkgHours * 60 : 60;
  const overMin = (elapsedSec / 60) - limitMin;
  const payAwalStr = String(session.payAwal || 'cash').toLowerCase();

  let btnColor = 'linear-gradient(135deg, var(--green), #16a34a)';
  if (overMin >= 11) {
    btnColor = 'linear-gradient(135deg, var(--red), #dc2626)';
  } else if (overMin >= 0) {
    btnColor = 'linear-gradient(135deg, var(--orange), #f59e0b)';
  }

  const isZombie = elapsedSec > 28800;

  return (
    <div className="aktif-card">
      <div className="d-flex align-items-center justify-content-between mb-1 gap-2" style={{ minWidth: 0 }}>
        <div className="aktif-name" style={{ marginBottom: 0 }}>
          {Number(session.queueNo) > 0 && (
            <span className="aktif-queue-badge me-1" title="Nomor Antrian">#{session.queueNo}</span>
          )}
          <i className="bi bi-person-fill me-1 clr-cyan"></i>{session.nama || 'Penyewa'}
          {isZombie && (
            <span title="Sesi sudah lebih dari 8 jam!" style={{
              marginLeft: 6, fontSize: '.6rem', fontWeight: 800,
              background: 'rgba(249,115,22,.2)', color: 'var(--orange)',
              border: '1px solid rgba(249,115,22,.4)',
              borderRadius: 4, padding: '1px 5px'
            }}>⚠️ ZOMBIE</span>
          )}
        </div>
        <span className={`aktif-pay-badge ${payAwalStr}`}>
          <i className={`bi ${payAwalStr === 'qris' ? 'bi-qr-code-scan' : 'bi-cash-stack'}`}></i>
          {payAwalStr.toUpperCase()}
        </span>
      </div>
      <div className="item-tags mb-2">
        {itemsList.map((it, idx) => (
          <span className="itag" key={it.code || idx}>{it.code || '-'}×{it.qty || 1}</span>
        ))}
      </div>
      <div className="aktif-meta mb-2">
        <span className="aktif-start-lbl">
          <i className="bi bi-clock me-1"></i>
          {new Date(session.startTime).toTimeString().slice(0,5)}
        </span>
        <span className="aktif-timer fw-bolder fs-5 font-monospace" style={{ letterSpacing: '0px', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', color: overMin >= 11 ? 'var(--red)' : 'var(--cyan)' }}>
          {fmtDur(elapsedSec)}
        </span>
      </div>
      <div className="aktif-footer d-flex gap-2 align-items-center mt-auto">
        <button className="btn-selesai flex-fill" style={{ background: btnColor }} onClick={() => onSelesaiSewa(session)}>
          <i className="bi bi-stop-circle-fill me-1"></i>Selesai
        </button>
        <button className="btn-qr-aktif ms-1" onClick={() => onShowQR(session)} title="Tampilkan QR"><i className="bi bi-qr-code"></i></button>
        <button className="btn-qr-aktif" style={{ background: 'var(--bg-sec)', color: 'var(--cyan)', border: '1px solid var(--cyan)' }} onClick={() => onPrintSesi(session)} title="Print Struk"><i className="bi bi-printer-fill"></i></button>
        <button
          className="btn-qr-aktif"
          style={{ background: 'var(--bg-sec)', color: 'var(--green)', border: '1px solid var(--green)' }}
          onClick={() => onAddItem && onAddItem(session)}
          title="Tambah Item"
          aria-label="Tambah Item"
        >
          <i className="bi bi-plus-circle-fill"></i>
        </button>
        <button className="btn-edit-aktif me-1" onClick={() => onEditSesi(session)} title="Edit"><i className="bi bi-pencil-fill"></i></button>
      </div>
    </div>
  );
}

function DashboardTab({ activeSessions, onStartSewa, getImgUrl, onSelesaiSewa, onShowQR, onPrintSesi, onEditSesi, onAddItem }) {
  const [inputNama, setInputNama] = useState('');
  const [payAwal, setPayAwal] = useState('cash');
  const [selectedQty, setSelectedQty] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeQty = (code, delta) => {
    setSelectedQty(prev => {
      const val = Math.max(0, (prev[code] || 0) + delta);
      return { ...prev, [code]: val };
    });
  };

  const handleStart = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    const nama = inputNama.trim();
    if (!nama) { swalWarning('Nama Kosong', 'Masukkan nama penyewa!'); return; }
    const items = ITEMS.filter(i => (selectedQty[i.code] || 0) > 0)
                       .map(i => ({ code: i.code, qty: selectedQty[i.code] }));
    if (items.length === 0) { swalWarning('Item Belum Dipilih', 'Pilih minimal satu item!'); return; }
    
    setIsSubmitting(true);
    try {
      await onStartSewa(nama, items, payAwal);
      
      // Reset form
      setInputNama('');
      setPayAwal('cash');
      setSelectedQty({});
    } catch (err) {
      console.error('Failed starting rental:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSessions = (activeSessions || [])
    .filter(s => s && String(s.nama || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()))
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

  return (
    <div id="tab-dashboard" className="tab-pane active">
      <div className="row g-3">
        <div className="col-12 col-lg-5 d-flex flex-column">
          <div className="panel flex-fill">
            <div className="panel-head"><i className="bi bi-plus-circle-fill clr-yellow"></i><span>Sewa Baru</span></div>
            <div className="panel-body">
              <label className="field-label">Nama Penyewa</label>
              <div className="input-ico-wrap mb-3">
                <i className="bi bi-person-fill ico"></i>
                <input 
                  type="text" 
                  value={inputNama} 
                  onChange={(e) => setInputNama(e.target.value)} 
                  className="cfield" 
                  placeholder="Masukkan nama penyewa..." 
                />
              </div>
              <label className="field-label mb-2">Metode Bayar Awal (Tarif Pokok)</label>
              <div className="pay-awal-selector mb-3">
                <label className="pay-awal-opt">
                  <input 
                    type="radio" 
                    name="payAwal" 
                    checked={payAwal === 'cash'} 
                    onChange={() => setPayAwal('cash')} 
                  />
                  <span><i className="bi bi-cash-stack me-1"></i>Cash</span>
                </label>
                <label className="pay-awal-opt">
                  <input 
                    type="radio" 
                    name="payAwal" 
                    checked={payAwal === 'qris'} 
                    onChange={() => setPayAwal('qris')} 
                  />
                  <span><i className="bi bi-qr-code-scan me-1"></i>QRIS</span>
                </label>
              </div>
              <label className="field-label mb-2">Pilih Item &amp; Jumlah</label>
              <div className="row row-cols-2 row-cols-sm-3 g-2 mb-3">
                {ITEMS.map(item => {
                  const qty = selectedQty[item.code] || 0;
                  const img = getImgUrl(item.code) || item.defaultImg;
                  const priceLabel = item.isPackage ? `Paket ${item.packageHours}jam ${fmtRp(item.priceHour)}` : `${fmtRp(item.priceHour)}/jam`;
                  return (
                    <div className="col" key={item.code}>
                      <div className={`item-card ${qty > 0 ? 'selected' : ''}`} onClick={(e) => {
                        if (!e.target.closest('.qty-control')) {
                          changeQty(item.code, 1);
                        }
                      }}>
                        <div className="item-img-box position-relative">
                          <img src={img} alt={item.name} onError={(e) => { e.target.parentElement.innerHTML = `<div style="font-size:2rem">${item.emoji}</div>` }} />
                          {qty > 0 && (
                            <div className="position-absolute top-0 end-0 m-2 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', border: '2px solid white' }}>
                              <i className="bi bi-check-lg" style={{ fontSize: '0.9rem', fontWeight: '900' }}></i>
                            </div>
                          )}
                        </div>
                        <div className="item-code">{item.code}</div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-price">{priceLabel}</div>
                        <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="qty-btn minus" onClick={() => changeQty(item.code, -1)}>━</button>
                          <span className="qty-val">{qty}</span>
                          <button type="button" className="qty-btn plus" onClick={() => changeQty(item.code, 1)}>✚</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="btn-start w-100" onClick={handleStart} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Memproses Sesi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle-fill me-2"></i>Mulai Sewa Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-7 d-flex flex-column">
          <div className="panel flex-fill">
            <div className="panel-head">
              <i className="bi bi-people-fill clr-cyan"></i><span>Penyewa Aktif</span>
              <span className="ms-auto aktif-count">{activeSessions.length}</span>
            </div>
            <div className="panel-body">
              <div className="input-ico-wrap mb-3">
                <i className="bi bi-search ico"></i>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cfield" 
                  placeholder="Cari nama penyewa..." 
                />
              </div>
              <div className="aktif-scroll">
                {filteredSessions.length === 0 ? (
                  <div className="empty-box"><i className="bi bi-person-slash" style={{fontSize:'3.5rem', opacity:0.5}}></i><p>Belum ada penyewa aktif</p></div>
                ) : (
                  filteredSessions.map(s => (
                    <LiveSessionTimer 
                      key={s.id} 
                      session={s} 
                      onSelesaiSewa={onSelesaiSewa} 
                      onShowQR={onShowQR} 
                      onPrintSesi={onPrintSesi} 
                      onEditSesi={onEditSesi} 
                      onAddItem={onAddItem}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardTab;
