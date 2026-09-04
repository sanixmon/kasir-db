import React, { useState } from 'react';
import { loginCashier, setAuthToken } from '../../../api';

function LoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) { setError('Ketik nama kasir terlebih dahulu!'); return; }
    if (!password) { setError('Password shift harus diisi!'); return; }

    setError('');
    try {
      setIsSubmitting(true);
      const res = await loginCashier(trimmed, password);
      if (res && res.success) {
        setAuthToken(res.token);
        onLogin(res.user.username);
      } else {
        setError(res?.error || 'Login gagal');
      }
    } catch (e) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="loginPage">
      <div className="login-card">
        {onBack && (
          <div className="d-flex align-items-center mb-2">
            <button
              type="button"
              className="btn btn-sm text-secondary d-inline-flex align-items-center gap-1 p-0 border-0 bg-transparent"
              style={{ fontSize: '.82rem', color: 'var(--text2)', cursor: 'pointer' }}
              onClick={onBack}
              title="Kembali ke Pilihan Role"
            >
              <i className="bi bi-arrow-left"></i>
              <span>Ganti Role</span>
            </button>
          </div>
        )}

        <div className="text-center mb-4">
          <div className="login-brand">EVREN HOUSE</div>
          <div className="login-sub">Scooter &amp; Stroller</div>
        </div>

        <hr className="login-divider" style={{ marginTop: 0, marginBottom: '20px' }} />

        <div className="login-shift-title">
          <i className="bi bi-person-badge-fill me-1 clr-cyan"></i>
          <span>Login Shift Kasir</span>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username Input with Icon */}
          <div className="login-input-group mb-3">
            <i className="bi bi-person-fill login-input-icon"></i>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="login-field with-icon"
              placeholder="Ketik nama kasir..."
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Password Input with Icon & Eye Toggle */}
          <div className="login-input-group mb-3">
            <i className="bi bi-key-fill login-input-icon"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="login-field with-icon with-toggle"
              placeholder="Password shift..."
            />
            <button
              type="button"
              className="login-toggle-pw"
              onClick={() => setShowPassword(prev => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
            </button>
          </div>

          {error && (
            <div className="login-err-box mb-3 d-flex align-items-center justify-content-center gap-2 p-2 rounded">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-login" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Mulai Shift</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '.72rem', color: 'var(--text2)', textAlign: 'center' }}>
          <i className="bi bi-shield-lock me-1"></i>Akses terbatas untuk kasir Evren House
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
