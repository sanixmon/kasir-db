import React, { useEffect, useRef } from 'react';
import { swalSuccess } from '../lib/swal';
import { ITEMS } from '../lib/items';
import { fmtRp } from '../lib/utils';

function QRCodeModal({ session, onClose }) {
  const qrRef = useRef(null);

  const trackUrl = window.location.href.split('#')[0] + '#track/' + session.id;
  const payAwal = session.payAwal || 'cash';

  const totalBase = (session.items || []).reduce((sum, it) => {
    const d = ITEMS.find(item => item.code === it.code);
    return sum + (d ? d.priceHour * it.qty : 0);
  }, 0);

  const timeStr = (ms) => {
    const d = new Date(ms);
    return d.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = '';
      new window.QRCode(qrRef.current, {
        text: trackUrl,
        width: 210,
        height: 210,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  }, [trackUrl]);

  const copyTrackUrl = () => {
    navigator.clipboard.writeText(trackUrl)
      .then(() => swalSuccess('Link Disalin!', 'Link tracking berhasil disalin ke clipboard.'))
      .catch(() => {
        const el = document.createElement('textarea');
        el.value = trackUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        swalSuccess('Link Disalin!');
      });
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title"><i className="bi bi-qr-code-scan me-2 clr-cyan"></i>QR Tracking Sewa</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Tutup"></button>
          </div>
          <div className="modal-body p-0">
            <div className="qr-modal-wrap" style={{ padding: '20px' }}>
              <div className="qr-header-card p-3 mb-3 border rounded" style={{ background: 'var(--bg3)' }}>
                <div className="qr-header-name font-weight-bold mb-2"><i className="bi bi-person-fill me-2 clr-cyan"></i>{session.nama}</div>
                <div className="qr-header-meta d-flex gap-2 align-items-center flex-wrap mb-2">
                  <span className="itag badge bg-dark border" style={{ background: 'rgba(63,185,80,.1)', color: 'var(--green)', borderColor: 'rgba(63,185,80,.3)' }}><i className="bi bi-clock me-1"></i>Mulai {timeStr(session.startTime)}</span>
                  <span className={`aktif-pay-badge ${payAwal}`}>
                    <i className={`bi ${payAwal === 'qris' ? 'bi-qr-code-scan' : 'bi-cash-stack'}`}></i>
                    {' ' + payAwal.toUpperCase()}
                  </span>
                  <span className="itag badge bg-dark border" style={{ color: 'var(--yellow)' }}>{fmtRp(totalBase)}</span>
                </div>
                <div className="qr-items-preview d-flex gap-1 flex-wrap">
                  {session.items.map(it => {
                    const d = ITEMS.find(item => item.code === it.code);
                    return (
                      <span className="itag badge bg-secondary" key={it.code}>
                        {d ? d.name : it.code} ×{it.qty}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="qr-canvas-wrap d-flex flex-column align-items-center mb-3">
                <div className="mb-2 text-center" style={{ fontSize: '.78rem', color: 'var(--text2)', fontWeight: 700 }}>
                  <i className="bi bi-qr-code me-1" style={{ color: 'var(--cyan)' }}></i>
                  Berikan QR ini ke penyewa untuk tracking real-time
                </div>
                <div className="qr-canvas-bg p-2 bg-white rounded mb-2" id="qrCanvasBox" ref={qrRef} style={{ width: '226px', height: '226px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: '#666', fontSize: '.75rem' }}>Generating QR...</div>
                </div>
                <div className="qr-scan-hint text-center small text-secondary mt-1">
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                    <i className="bi bi-phone clr-cyan"></i>
                    <span>Penyewa scan QR → halaman timer real-time terbuka</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                    <i className="bi bi-stopwatch clr-yellow"></i>
                    <span>Timer update otomatis setiap detik</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <i className="bi bi-check-circle-fill clr-green"></i>
                    <span>Saat selesai → halaman berubah jadi <b style={{ color: 'var(--yellow)' }}>struk digital</b></span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(63,185,80,.1)', border: '1px solid rgba(63,185,80,.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '.72rem', color: 'var(--green)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-shield-check"></i>Data tracking tersimpan di Server Database — dapat dipantau real-time dari perangkat apapun
              </div>
              <div 
                className="qr-url-box p-2 border rounded text-truncate text-center mb-3" 
                style={{ background: 'var(--bg)', cursor: 'pointer', fontSize: '.85rem' }} 
                onClick={copyTrackUrl} 
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && copyTrackUrl()}
                role="button"
                tabIndex={0}
                title="Klik untuk salin"
                aria-label="Salin link tracking ke clipboard"
              >
                <i className="bi bi-link-45deg me-1"></i>{trackUrl}
              </div>
              <div className="d-flex gap-2 mb-2">
                <button className="btn-sec flex-fill py-2" onClick={copyTrackUrl}><i className="bi bi-clipboard me-1"></i>Salin Link</button>
                <button className="btn-start flex-fill py-2" onClick={() => window.open(trackUrl, '_blank')}><i className="bi bi-box-arrow-up-right me-1"></i>Preview</button>
              </div>
              <button className="btn-sec w-100 py-2" onClick={onClose}>Tutup</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRCodeModal;
