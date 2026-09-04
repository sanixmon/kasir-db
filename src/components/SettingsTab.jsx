import React, { useState } from 'react';
import { ITEMS } from '../lib/items';
import { fmtRp } from '../lib/utils';
import { getShiftDate } from '../lib/shift';
import { changeAdminPassword, backupDatabase } from '../api';
import { swalSuccess, swalError, swalWarning, swalConfirm } from '../lib/swal';
import SettingsAnalytics from './SettingsAnalytics';
import SettingsUsers from './SettingsUsers';

const APP_VERSION = '1.4.0';
const DEPLOY_DATE = '27 Jul 2026';

function SettingsTab({ 
  users = [],
  transactions = [],
  activeSessions = [],
  currentShiftUser,
  theme, 
  onThemeChange, 
  sbConnected, 
  lastSyncTime, 
  onSyncPull, 
  printMulai,
  onChangePrintMulai,
  printSelesai,
  onChangePrintSelesai,
  onUpdateItemImg,
  onResetItemImg,
  getImgUrl
}) {
  const [newPassInput, setNewPassInput] = useState('');
  const [oldPassInput, setOldPassInput] = useState('');

  const handleChangePass = async () => {
    const oldP = oldPassInput.trim();
    const newP = newPassInput.trim();
    if (!newP || !oldP) {
      swalWarning('Form Kosong', 'Masukkan password lama dan baru!');
      return;
    }
    const ok = await swalConfirm('Ubah Password Admin?', 'Password lama akan diganti.', 'Ya, Ubah!', 'question');
    if (!ok) return;
    try {
      const res = await changeAdminPassword(oldP, newP);
      if (res?.success) {
        setOldPassInput('');
        setNewPassInput('');
        swalSuccess('Password Berhasil Diperbarui!');
      } else {
        swalError('Gagal Mengubah', res?.error || 'Gagal mengubah password admin.');
      }
    } catch (err) {
      console.error('Change password failed:', err);
      swalError('Koneksi Gagal', 'Tidak dapat terhubung ke server.');
    }
  };

  const handleBackup = async () => {
    try {
      const res = await backupDatabase();
      if (res?.success) {
        swalSuccess('Backup Berhasil!', res.path);
      } else {
        swalError('Backup Gagal', res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Backup failed:', err);
      swalError('Koneksi Gagal', 'Tidak dapat terhubung ke server.');
    }
  };

  const handleUploadImg = (code) => {
    const url = prompt('Masukkan URL gambar baru:');
    if (url) {
      onUpdateItemImg(code, url);
    }
  };

  const handleResetImg = async (code) => {
    const ok = await swalConfirm('Reset Gambar?', 'Gambar akan dikembalikan ke default.', 'Ya, Reset!', 'question');
    if (ok) onResetItemImg(code);
  };

  return (
    <div id="tab-pengaturan" className="tab-pane active">
      <div className="row g-3">

        {/* ─── SECTION 1: EXECUTIVE DASHBOARD ANALYTICS ───────────────────── */}
        <SettingsAnalytics
          transactions={transactions}
          activeSessions={activeSessions}
          currentShiftUser={currentShiftUser}
        />

        {/* ─── SECTION 2: USER & CASHIER MANAGEMENT ─────────────────────────── */}
        <SettingsUsers users={users} onSyncPull={onSyncPull} />

        {/* ─── SECTION 3: SYSTEM SYNC & SERVER CONTROLS ──────────────────────── */}
        <div className="col-12 col-xl-6">
          <div className="panel h-100">
            <div className="panel-head">
              <i className="bi bi-hdd-network-fill me-2 clr-cyan"></i>
              <span>Status Koneksi Server &amp; Database</span>
              <span className="ms-auto">
                {sbConnected ? (
                  <span className="fb-badge fb-badge-connected" style={{ color: 'var(--green)', fontSize: '0.85rem' }}>
                    <span className="fb-status-dot fb-dot-connected" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%', marginRight: '6px' }}></span>
                    Online
                  </span>
                ) : (
                  <span className="fb-badge fb-badge-connecting" style={{ color: 'var(--orange)', fontSize: '0.85rem' }}>
                    <span className="fb-status-dot fb-dot-connecting" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--orange)', borderRadius: '50%', marginRight: '6px' }}></span>
                    Terputus
                  </span>
                )}
              </span>
            </div>
            <div className="panel-body d-flex flex-column justify-content-between">
              <div className="fb-auto-card p-3 border rounded mb-3" style={{ background: 'var(--bg3)' }}>
                <div className="fa-title font-weight-bold mb-2"><i className="bi bi-arrow-repeat me-1 clr-cyan"></i>Sinkronisasi Data Real-Time</div>
                <div className="fa-desc small text-secondary mb-3">Data sesi aktif, transaksi, dan QR tracking tersimpan di database server SQLite. Perubahan data antar perangkat disinkronkan otomatis secara berkala.</div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-sm btn-outline-info" onClick={onSyncPull}><i className="bi bi-arrow-clockwise me-1"></i>Muat Ulang / Sinkron Data Sekarang</button>
                </div>
                <div className="mt-3 small text-secondary">Terakhir sinkron: <span>{lastSyncTime || '—'}</span></div>
              </div>

              {/* Password Admin Change */}
              <div className="p-3 border rounded mb-3" style={{ background: 'var(--bg3)' }}>
                <div className="fw-bold small mb-2" style={{ color: 'var(--text)' }}>
                  <i className="bi bi-shield-lock-fill me-1 clr-red"></i>Password Akun Admin
                </div>
                <div className="d-flex flex-column gap-2">
                  <input
                    type="password"
                    value={oldPassInput}
                    onChange={(e) => setOldPassInput(e.target.value)}
                    className="cfield flex-fill"
                    placeholder="Password lama..."
                    style={{ paddingLeft: '12px' }}
                  />
                  <div className="input-group">
                    <input
                      type="password"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      className="cfield flex-fill"
                      placeholder="Password baru..."
                      style={{ paddingLeft: '12px' }}
                    />
                    <button className="btn-sec ms-2 py-2 px-3 border rounded" onClick={handleChangePass}>Ubah</button>
                  </div>
                </div>
              </div>

              {/* Backup Database */}
              <div className="p-3 border rounded" style={{ background: 'var(--bg3)' }}>
                <div className="fw-bold small mb-2" style={{ color: 'var(--text)' }}>
                  <i className="bi bi-database-fill me-1 clr-green"></i>Backup Database
                </div>
                <p className="small text-secondary mb-2">Backup otomatis setiap jam. Backup manual juga tersedia.</p>
                <button className="btn btn-sm btn-outline-success w-100" onClick={handleBackup}>
                  <i className="bi bi-cloud-arrow-down-fill me-1"></i>Backup Manual Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: HARDWARE & DISPLAY SETTINGS ────────────────────────── */}
        <div className="col-12 col-xl-7">
          <div className="panel h-100">
            <div className="panel-head"><i className="bi bi-image-fill clr-yellow"></i><span>Custom Gambar Item Rental</span></div>
            <div className="panel-body">
              <div className="row row-cols-2 row-cols-sm-3 g-2">
                {ITEMS.map(item => {
                  const img = getImgUrl(item.code) || item.defaultImg;
                  return (
                    <div className="col" key={item.code}>
                      <div className="setting-card p-2 border rounded text-center" style={{ background: 'var(--bg3)' }}>
                        <div className="setting-img-box mb-2" style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', borderRadius: '8px', overflow: 'hidden' }}>
                          <img 
                            src={img} 
                            alt={item.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.parentElement.innerHTML = `<div style="font-size:2rem">${item.emoji}</div>` }} 
                          />
                        </div>
                        <div className="setting-code small font-weight-bold" style={{ color: 'var(--yellow)' }}>{item.code}</div>
                        <div className="setting-name small text-truncate mb-2">{item.name}</div>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-secondary w-50" style={{ fontSize: '0.72rem' }} onClick={() => handleUploadImg(item.code)}>Ubah</button>
                          <button className="btn btn-sm btn-outline-danger w-50" style={{ fontSize: '0.72rem' }} onClick={() => handleResetImg(item.code)}>Reset</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="row g-3">
            <div className="col-12">
              <div className="panel">
                <div className="panel-head"><i className="bi bi-palette-fill clr-yellow"></i><span>Tampilan Tema</span></div>
                <div className="panel-body">
                  <div className="toggle-row d-flex justify-content-between align-items-center">
                    <div>
                      <div style={{ fontWeight: 700 }}>Mode Tampilan</div>
                      <div className="small text-secondary">{theme === 'dark' ? 'Mode Gelap aktif' : 'Mode Terang aktif'}</div>
                    </div>
                    <div className="theme-seg d-flex border rounded overflow-hidden">
                      <button className={`theme-seg-btn btn btn-sm py-2 px-3 border-0 rounded-0 ${theme === 'light' ? 'active bg-primary text-white' : 'btn-dark'}`} onClick={() => onThemeChange('light')}><i className="bi bi-sun-fill me-1"></i>Light</button>
                      <button className={`theme-seg-btn btn btn-sm py-2 px-3 border-0 rounded-0 ${theme === 'dark' ? 'active bg-primary text-white' : 'btn-dark'}`} onClick={() => onThemeChange('dark')}><i className="bi bi-moon-stars-fill me-1"></i>Dark</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="panel">
                <div className="panel-head"><i className="bi bi-printer-fill clr-cyan"></i><span>Auto Print Struk Thermal</span></div>
                <div className="panel-body">
                  <div className="toggle-row d-flex justify-content-between align-items-center mb-2">
                    <div>Print saat <b>mulai sewa</b></div>
                    <div className="form-check form-switch mb-0">
                      <input 
                        className="form-check-input ctoggle" 
                        type="checkbox" 
                        checked={printMulai}
                        onChange={(e) => onChangePrintMulai(e.target.checked)}
                      />
                    </div>
                  </div>
                  <div className="toggle-row d-flex justify-content-between align-items-center">
                    <div>Print saat <b>selesai bayar</b></div>
                    <div className="form-check form-switch mb-0">
                      <input 
                        className="form-check-input ctoggle" 
                        type="checkbox" 
                        checked={printSelesai}
                        onChange={(e) => onChangePrintSelesai(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 mt-3 border-top pt-3 text-secondary d-flex justify-content-between small">
          <span><i className="bi bi-code-slash me-1"></i>System Version: v{APP_VERSION}</span>
          <span><i className="bi bi-clock-history me-1"></i>Last deploy: {DEPLOY_DATE}</span>
        </div>

      </div>
    </div>
  );
}

export default SettingsTab;
