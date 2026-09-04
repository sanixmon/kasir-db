import React, { useState } from 'react';
import { saveUser, deleteUser } from '../api';
import { swalSuccess, swalError, swalWarning, swalConfirm } from '../lib/swal';

function SettingsUsers({ users, onSyncPull }) {
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('cashier');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const uname = newUserUsername.trim();
    const pwd = newUserPassword.trim();

    if (!uname || !pwd) {
      swalWarning('Form Kosong', 'Masukkan username dan password kasir!');
      return;
    }

    try {
      setIsSavingUser(true);
      const res = await saveUser(uname, pwd, newUserRole);
      if (res && !res.error) {
        swalSuccess(`Kasir "${uname}" berhasil disimpan!`);
        setNewUserUsername('');
        setNewUserPassword('');
        if (onSyncPull) onSyncPull();
      } else {
        swalError('Gagal Menyimpan', res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Save user failed:', err);
      swalError('Koneksi Gagal', 'Tidak dapat terhubung ke server.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (username) => {
    const ok = await swalConfirm(
      `Hapus Akun "${username}"?`,
      'Akun ini akan dihapus secara permanen.',
      'Ya, Hapus!'
    );
    if (!ok) return;
    try {
      const res = await deleteUser(username);
      if (res && !res.error) {
        swalSuccess(`Akun "${username}" berhasil dihapus!`);
        if (onSyncPull) onSyncPull();
      } else {
        swalError('Gagal Menghapus', res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Delete user failed:', err);
      swalError('Koneksi Gagal', 'Tidak dapat terhubung ke server.');
    }
  };

  return (
    <div className="col-12 col-xl-6">
      <div className="panel h-100">
        <div className="panel-head">
          <i className="bi bi-people-fill clr-cyan"></i>
          <span>Manajemen Kasir &amp; Pengguna</span>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSaveUser} className="mb-4 p-3 border rounded-3" style={{ background: 'var(--bg3)' }}>
            <div className="fw-bold small mb-2" style={{ color: 'var(--text)' }}>
              <i className="bi bi-person-plus-fill me-1 clr-green"></i>Tambah / Reset Password Kasir
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-5">
                <input 
                  type="text" 
                  className="cfield w-100" 
                  placeholder="Username kasir (cth: akbar)" 
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-4">
                <input 
                  type="password" 
                  className="cfield w-100" 
                  placeholder="Password baru" 
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-3">
                <select 
                  className="cfield w-100" 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-12 mt-2">
                <button 
                  type="submit" 
                  className="btn btn-sm btn-success w-100 font-weight-bold" 
                  disabled={isSavingUser}
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </div>
          </form>

          <div className="fw-bold small text-secondary mb-2">Daftar Akun Kasir Terdaftar</div>
          <div className="row row-cols-2 row-cols-sm-4 g-2">
            {users.map(u => (
              <div className="col" key={u.username}>
                <div className="p-2 border rounded-3 text-center position-relative" style={{ background: 'var(--bg)' }}>
                  <div className="position-absolute top-0 end-0 d-flex gap-1" style={{ margin: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-sm p-0"
                      style={{ color: 'var(--yellow)', fontSize: '0.8rem', lineHeight: 1 }}
                      title="Edit / Reset Password Kasir Ini"
                      onClick={() => {
                        setNewUserUsername(u.username);
                        setNewUserRole(u.role || 'cashier');
                        setNewUserPassword(u.password || '');
                      }}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm p-0"
                      style={{ color: 'var(--red)', fontSize: '0.8rem', lineHeight: 1 }}
                      title="Hapus akun"
                      onClick={() => handleDeleteUser(u.username)}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                  <i className="bi bi-person-circle fs-5 clr-cyan d-block mb-1"></i>
                  <div className="fw-bold small" style={{ color: 'var(--text)' }}>{u.username}</div>
                  <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'} opacity-75`} style={{ fontSize: '0.65rem' }}>
                    {u.role || 'cashier'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsUsers;
