import React, { useState } from 'react';

function PasswordVerificationModal({ onVerify, onVerifySuccess, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(false);
    try {
      const res = await onVerify(password);
      if (res?.valid) {
        onVerifySuccess();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setTimeout(() => setIsSubmitting(false), 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-sm modal-dialog modal-dialog-centered">
        <div className="modal-content cmodal">
          <div className="modal-header cmodal-head">
            <h5 className="modal-title"><i className="bi bi-shield-lock-fill me-2"></i>Verifikasi Admin</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} aria-label="Tutup"></button>
          </div>
          <div className="modal-body">
            <input 
              type="password" 
              className="cfield w-100 mb-2" 
              placeholder="Masukkan password..." 
              style={{ paddingLeft: '12px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              aria-label="Password Admin"
              autoFocus
            />
            <button className="btn-start w-100" onClick={handleVerify} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
            {error && (
              <p className="text-danger small mt-2 mb-0 d-flex align-items-center">
                <i className="bi bi-x-circle-fill me-1"></i>Password salah!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordVerificationModal;
