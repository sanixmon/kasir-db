import React, { useState } from 'react';

export default function RoleSelection({ onSelectCashier, onSelectAdmin }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');

  return (
    <div className="login-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
      <div className="card shadow-lg" style={{ maxWidth: '420px', width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: '22px', padding: '36px 32px' }}>
        <div className="text-center mb-4">
          <h2 className="mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: '900', color: 'var(--cyan)', letterSpacing: '1.5px', textShadow: '0 0 16px color-mix(in srgb, var(--cyan) 35%, transparent)' }}>
            EVREN HOUSE
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--yellow)', letterSpacing: '2px', fontWeight: '800', textTransform: 'uppercase' }}>
            Rental Management POS
          </div>
        </div>
        
        <hr style={{ borderColor: 'var(--border)', opacity: 0.6, margin: '0 0 24px 0' }} />
        
        {!showAdminLogin ? (
          <div className="d-flex flex-column gap-3">
            <button 
              className="btn-start w-100 py-3 d-flex align-items-center justify-content-center gap-2" 
              style={{ fontSize: '1.05rem', boxShadow: '0 6px 20px color-mix(in srgb, var(--primary) 30%, transparent)' }}
              onClick={onSelectCashier}
            >
              <i className="bi bi-shop-window" style={{ fontSize: '1.3rem' }}></i>
              <span>Portal Kasir (POS)</span>
            </button>
            <button 
              className="btn-outline-c w-100 py-3 d-flex align-items-center justify-content-center gap-2" 
              style={{ fontSize: '1rem', border: '1.5px solid var(--border)' }}
              onClick={() => setShowAdminLogin(true)}
            >
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.2rem', color: 'var(--yellow)' }}></i>
              <span>Portal Admin</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.95rem' }}>
              <i className="bi bi-shield-lock-fill" style={{ color: 'var(--yellow)', fontSize: '1.2rem' }}></i>
              <span>Verifikasi Keamanan Admin</span>
            </div>
            <div className="input-ico-wrap mb-4">
              <i className="bi bi-key-fill ico"></i>
              <input 
                type="password" 
                className="cfield" 
                placeholder="Masukkan Password Admin..."
                aria-label="Password Admin"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSelectAdmin(password)}
                autoFocus
                style={{ paddingLeft: '40px', height: '48px' }}
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn-sec flex-fill py-2" onClick={() => { setShowAdminLogin(false); setPassword(''); }}>
                <i className="bi bi-arrow-left me-1"></i>Kembali
              </button>
              <button className="btn-start flex-fill py-2" onClick={() => onSelectAdmin(password)}>
                <i className="bi bi-box-arrow-in-right me-1"></i>Masuk
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
