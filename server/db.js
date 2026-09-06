import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

let db;
let dbPath; // store for backup

// ── Server-side session tokens ──────────────────────────────────────────────
// Auth tokens are persisted in SQLite so they survive backend restarts and
// work regardless of PM2 exec mode (fork/cluster). Each maps to a
// { username, role } session with an expiry.
const LOGIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;  // 12 hours (one shift)
const ESCALATION_TOKEN_TTL_MS = 10 * 60 * 1000;   // 10 minutes for admin re-verification

// Actions callable without any token (public entry points).
const PUBLIC_ACTIONS = new Set(['login_cashier', 'login_admin', 'track_session']);

// Actions that additionally require an admin role token.
const ADMIN_ONLY_ACTIONS = new Set([
  'save_setting', 'save_user', 'delete_user', 'delete_txn', 'clear_all_txns',
  'change_admin_pass', 'backup_db', 'get_deletion_logs', 'add_deletion_log'
]);

export function issueToken(username, role, ttlMs = LOGIN_TOKEN_TTL_MS) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT OR REPLACE INTO auth_tokens (token, username, role, expires_at, ttl_ms) VALUES (?, ?, ?, ?, ?)')
    .run(token, username, role, Date.now() + ttlMs, ttlMs);
  // Opportunistically prune expired tokens so the table stays small.
  db.prepare('DELETE FROM auth_tokens WHERE expires_at <= ?').run(Date.now());
  return token;
}

export function resolveToken(token) {
  if (!token) return null;
  const row = db.prepare('SELECT username, role, expires_at AS expiresAt, ttl_ms AS ttlMs FROM auth_tokens WHERE token = ?').get(token);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
    return null;
  }
  // Sliding expiration: keep a session alive while it is actively used, so an
  // open POS/web client never gets force-logged-out mid-shift.
  const ttl = Number(row.ttlMs) || LOGIN_TOKEN_TTL_MS;
  db.prepare('UPDATE auth_tokens SET expires_at = ? WHERE token = ?').run(Date.now() + ttl, token);
  return { username: row.username, role: row.role };
}

export function revokeToken(token) {
  if (token) db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
}

export function initDb(pathArg) {
  dbPath = pathArg;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      id TEXT PRIMARY KEY,
      queue_no INTEGER DEFAULT 0,
      nama TEXT,
      items TEXT,
      start_time INTEGER,
      tanggal TEXT,
      pay_awal TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      no INTEGER,
      queue_no INTEGER DEFAULT 0,
      nama TEXT,
      tanggal TEXT,
      start_time INTEGER,
      end_time INTEGER,
      items TEXT,
      ot TEXT,
      ot_dur TEXT,
      total_base REAL DEFAULT 0,
      total_ot REAL DEFAULT 0,
      total_tol REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      total_all REAL DEFAULT 0,
      pay_awal TEXT,
      cash REAL DEFAULT 0,
      qris REAL DEFAULT 0,
      shift TEXT DEFAULT '-'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS deletion_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      txn_id TEXT,
      txn_no INTEGER,
      txn_nama TEXT,
      txn_tanggal TEXT,
      txn_total_all REAL DEFAULT 0,
      deleted_at INTEGER,
      deleted_by TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      username TEXT,
      role TEXT,
      expires_at INTEGER
    );
  `);

  // Migration: record each token's own TTL so sliding expiration extends the
  // right amount (login tokens by 12h, escalation tokens by 10 min).
  const cols = db.prepare('PRAGMA table_info(auth_tokens)').all();
  if (!cols.some(c => c.name === 'ttl_ms')) {
    db.exec('ALTER TABLE auth_tokens ADD COLUMN ttl_ms INTEGER');
  }

  return db;
}

function parseJson(str, defaultVal = []) {
  if (!str) return defaultVal;
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultVal;
  }
}

function formatSessionFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    queueNo: row.queue_no || 0,
    nama: row.nama || '',
    items: parseJson(row.items, []),
    startTime: Number(row.start_time) || 0,
    tanggal: row.tanggal || '',
    payAwal: row.pay_awal || 'cash'
  };
}

function formatTransactionFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    no: Number(row.no) || 0,
    queueNo: Number(row.queue_no) || 0,
    nama: row.nama || '',
    tanggal: row.tanggal || '',
    startTime: Number(row.start_time) || 0,
    endTime: Number(row.end_time) || 0,
    items: row.items || '',
    ot: row.ot || '-',
    otDur: row.ot_dur || '-',
    totalBase: Number(row.total_base) || 0,
    totalOT: Number(row.total_ot) || 0,
    totalTol: Number(row.total_tol) || 0,
    grandTotal: Number(row.grand_total) || 0,
    totalAll: Number(row.total_all) || 0,
    payAwal: row.pay_awal || 'cash',
    cash: Number(row.cash) || 0,
    qris: Number(row.qris) || 0,
    shift: row.shift || '-'
  };
}

export function getDeletedTxnsListFromDb() {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('deleted_txns');
    if (row && row.value) return JSON.parse(row.value);
  } catch (e) {}
  return [];
}

export function fetchAllData() {
  const sessionsRows = db.prepare('SELECT * FROM active_sessions').all();
  const txnsRows = db.prepare('SELECT * FROM transactions ORDER BY no ASC').all();
  const usersRows = db.prepare('SELECT username, password, role FROM users').all();
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const deletedList = getDeletedTxnsListFromDb();

  const filteredTxns = txnsRows
    .map(formatTransactionFromDb)
    .filter(t => {
      if (!t) return false;
      const tId = String(t.id || '').trim();
      const tNo = String(t.no || '').trim();
      if (tId && deletedList.includes(tId)) return false;
      if (tNo && deletedList.includes(tNo)) return false;
      return true;
    });

  const settings = {};
  settingsRows.forEach(r => {
    if (r.key !== 'deleted_txns' && r.key !== 'admin_pass') settings[r.key] = r.value;
  });

  return {
    sessions: sessionsRows.map(formatSessionFromDb),
    transactions: filteredTxns,
    users: usersRows,
    settings
  };
}

export const SHIFT_ROLLOVER_HOUR = 6;

export function shiftDateStr(ts, rolloverHour = SHIFT_ROLLOVER_HOUR) {
  const d = ts ? new Date(ts) : new Date();
  d.setHours(d.getHours() - rolloverHour);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addSession(payload) {
  const id = payload.id || `s-${Math.random().toString(36).slice(2, 8)}`;
  const nama = payload.nama || '';
  const items = JSON.stringify(payload.items || []);
  const startTime = payload.startTime || Date.now();
  const tanggal = payload.tanggal || shiftDateStr(startTime);
  const payAwal = payload.payAwal || 'cash';

  // Queue numbering: preserve the number on upsert (idempotent sync),
  // otherwise auto-increment per shift based on active + claimed sessions.
  let queueNo = Number(payload.queueNo) || 0;
  const existing = db.prepare('SELECT queue_no FROM active_sessions WHERE id = ?').get(id);
  if (existing) {
    queueNo = Number(existing.queue_no) || 0;
  } else if (queueNo <= 0) {
    const q = db.prepare(`
      SELECT COALESCE(MAX(q), 0) + 1 AS nextQ FROM (
        SELECT queue_no AS q FROM active_sessions WHERE tanggal = ?
        UNION ALL
        SELECT queue_no AS q FROM transactions WHERE tanggal = ?
      )
    `).get(tanggal, tanggal);
    queueNo = Number(q.nextQ) || 1;
  }

  const stmt = db.prepare(`
    INSERT INTO active_sessions (id, queue_no, nama, items, start_time, tanggal, pay_awal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      queue_no = excluded.queue_no,
      nama = excluded.nama,
      items = excluded.items,
      start_time = excluded.start_time,
      tanggal = excluded.tanggal,
      pay_awal = excluded.pay_awal
  `);

  stmt.run(id, queueNo, nama, items, startTime, tanggal, payAwal);

  const row = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get(id);
  return { success: true, session: formatSessionFromDb(row) };
}

export function editSession(payload) {
  const { id } = payload;
  if (!id) return { success: false, error: 'Session ID required' };

  const existingRow = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get(id);
  if (!existingRow) {
    return { success: false, error: 'Session not found' };
  }

  const existingSession = formatSessionFromDb(existingRow);
  const updatedNama = payload.nama !== undefined ? String(payload.nama) : existingSession.nama;
  const updatedItems = payload.items !== undefined ? payload.items : existingSession.items;
  const updatedStartTime = payload.startTime !== undefined ? Number(payload.startTime) : existingSession.startTime;
  const updatedTanggal = payload.tanggal !== undefined ? String(payload.tanggal) : existingSession.tanggal;
  const updatedPayAwal = payload.payAwal !== undefined ? String(payload.payAwal) : existingSession.payAwal;
  const updatedQueueNo = payload.queueNo !== undefined ? Number(payload.queueNo) : existingSession.queueNo;

  const itemsStr = JSON.stringify(updatedItems || []);

  const stmt = db.prepare(`
    UPDATE active_sessions
    SET nama = ?, items = ?, start_time = ?, tanggal = ?, pay_awal = ?, queue_no = ?
    WHERE id = ?
  `);
  stmt.run(updatedNama, itemsStr, updatedStartTime, updatedTanggal, updatedPayAwal, updatedQueueNo, id);

  const row = db.prepare('SELECT * FROM active_sessions WHERE id = ?').get(id);
  return { success: true, session: formatSessionFromDb(row) };
}

export function deleteSession(id) {
  const stmt = db.prepare('DELETE FROM active_sessions WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

export function claimSession(payload) {
  const {
    sessionId,
    queueNo = 0,
    nama = '',
    tanggal = '',
    startTime = 0,
    endTime = Date.now(),
    items = '',
    ot = '-',
    otDur = '-',
    totalBase = 0,
    totalOT = 0,
    totalTol = 0,
    grandTotal = 0,
    totalAll = 0,
    payAwal = 'cash',
    cash = 0,
    qris = 0,
    shift = '-'
  } = payload;

  const hasRemaining = Array.isArray(payload.remainingItems) && payload.remainingItems.length > 0;
  const txnId = (sessionId && !hasRemaining) ? `t-${sessionId.replace(/^s-/, '')}` : `t-${Math.random().toString(36).slice(2, 8)}`;

  db.exec('BEGIN IMMEDIATE;');
  try {
    if (sessionId) {
      const existing = db.prepare('SELECT id FROM active_sessions WHERE id = ?').get(sessionId);
      if (!existing) {
        db.exec('ROLLBACK;');
        return { success: false, error: 'Session not found or already claimed' };
      }

      if (hasRemaining) {
        const updateInfo = db.prepare('UPDATE active_sessions SET items = ? WHERE id = ?').run(JSON.stringify(payload.remainingItems), sessionId);
        if (updateInfo.changes === 0) {
          db.exec('ROLLBACK;');
          return { success: false, error: 'Session not found or already claimed' };
        }
      } else {
        const deleteInfo = db.prepare('DELETE FROM active_sessions WHERE id = ?').run(sessionId);
        if (deleteInfo.changes === 0) {
          db.exec('ROLLBACK;');
          return { success: false, error: 'Session not found or already claimed' };
        }
      }
    }

    const maxNoRow = db.prepare('SELECT COALESCE(MAX(no), 0) + 1 AS nextNo FROM transactions').get();
    const nextNo = maxNoRow.nextNo;

    // Insert into transactions
    const insertTxn = db.prepare(`
      INSERT INTO transactions (
        id, no, queue_no, nama, tanggal, start_time, end_time, items, ot, ot_dur,
        total_base, total_ot, total_tol, grand_total, total_all, pay_awal, cash, qris, shift
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTxn.run(
      txnId, nextNo, queueNo, nama, tanggal, startTime, endTime, items, ot, otDur,
      totalBase, totalOT, totalTol, grandTotal, totalAll, payAwal, cash, qris, shift
    );

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txnId);
    db.exec('COMMIT;');
    return { success: true, transaction: formatTransactionFromDb(row) };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function saveSetting(key, value) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run(key, String(value));
  return { success: true };
}

export function saveUser(username, password, role) {
  const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET password = excluded.password, role = excluded.role');
  stmt.run(username, password, role);
  return { success: true };
}

export function deleteUser(username) {
  const stmt = db.prepare('DELETE FROM users WHERE LOWER(username) = LOWER(?)');
  stmt.run(username);
  return { success: true };
}

export function clearAllTxns() {
  db.prepare('DELETE FROM transactions').run();
  saveSetting('deleted_txns', '[]');
  return { success: true };
}

export function addDeletedTxnToDb(newIds) {
  try {
    const current = getDeletedTxnsListFromDb();
    newIds.forEach(id => {
      const s = String(id).trim();
      if (s && !current.includes(s)) current.push(s);
    });
    saveSetting('deleted_txns', JSON.stringify(current));
  } catch (e) {}
}

export function deleteTxn(payload) {
  if (payload && payload.clearAll) {
    return clearAllTxns();
  }
  const targetId = payload && payload.id ? String(payload.id).trim() : (typeof payload === 'string' ? payload.trim() : null);
  const targetNoStr = payload && payload.no ? String(payload.no).trim() : null;
  const targetNo = targetNoStr ? Number(targetNoStr) : (typeof payload === 'number' ? payload : null);

  const toRecord = [];
  if (targetId) toRecord.push(targetId);
  if (targetNoStr) toRecord.push(targetNoStr);

  const stmt = db.prepare('DELETE FROM transactions WHERE (id IS NOT NULL AND id = ?) OR (no IS NOT NULL AND no = ?) OR (no IS NOT NULL AND no = ?) OR (id IS NOT NULL AND id = ?)');
  stmt.run(targetId, targetNo, Number(targetId) || -1, targetNoStr);

  addDeletedTxnToDb(toRecord);
  return { success: true };
}

export function addDeletionLog(payload) {
  try {
    const stmt = db.prepare(`
      INSERT INTO deletion_logs (txn_id, txn_no, txn_nama, txn_tanggal, txn_total_all, deleted_at, deleted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      payload.txnId || null,
      payload.txnNo || null,
      payload.txnNama || '',
      payload.txnTanggal || '',
      payload.txnTotalAll || 0,
      payload.deletedAt || Date.now(),
      payload.deletedBy || 'admin'
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function getDeletionLogs() {
  try {
    const rows = db.prepare('SELECT * FROM deletion_logs ORDER BY deleted_at DESC LIMIT 200').all();
    return {
      logs: rows.map(r => ({
        id: r.id,
        txnId: r.txn_id,
        txnNo: r.txn_no,
        txnNama: r.txn_nama,
        txnTanggal: r.txn_tanggal,
        txnTotalAll: r.txn_total_all,
        deletedAt: r.deleted_at,
        deletedBy: r.deleted_by
      }))
    };
  } catch (e) {
    return { logs: [] };
  }
}

export function verifyAdminPassword(password) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_pass'").get();
  if (!row) return { valid: false };
  return { valid: row.value === password };
}

export function changeAdminPassword(oldPassword, newPassword) {
  const verify = verifyAdminPassword(oldPassword);
  if (!verify.valid) return { success: false, error: 'Password lama salah!' };
  saveSetting('admin_pass', newPassword);
  return { success: true };
}

/**
 * Admin login — issues a full admin token. Mirrors the old client-side
 * `verify_admin` used by RoleSelection, but now server-verified + tokenized.
 */
export function loginAdmin(payload) {
  const password = String(payload?.password || '');
  if (!password) return { success: false, error: 'Password admin harus diisi' };
  if (!verifyAdminPassword(password).valid) {
    return { success: false, error: 'Password admin tidak sesuai!' };
  }
  return {
    success: true,
    user: { username: 'admin', role: 'admin' },
    token: issueToken('admin', 'admin')
  };
}

/**
 * Re-verification used before destructive actions (delete txn, clear history,
 * edit session). Requires an existing valid session token (any role) and the
 * correct admin password, then issues a short-lived escalation admin token.
 */
export function verifyAdmin(payload) {
  const password = String(payload?.password || '');
  if (!verifyAdminPassword(password).valid) return { valid: false };
  return { valid: true, token: issueToken('admin', 'admin', ESCALATION_TOKEN_TTL_MS) };
}

/**
 * Public minimal lookup for the customer QR tracking page — returns only the
 * requested session/transaction, never the full dataset.
 */
export function trackSession(payload) {
  const id = String(payload?.id || '').trim();
  if (!id) return { error: 'ID sesi diperlukan' };
  const altId = id.startsWith('s-') ? `t-${id.slice(2)}` : (id.startsWith('t-') ? `s-${id.slice(2)}` : id);
  const sess = db.prepare('SELECT * FROM active_sessions WHERE id = ? OR id = ?').get(id, altId);
  if (sess) return { session: formatSessionFromDb(sess) };
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ? OR id = ?').get(id, altId);
  if (txn) return { transaction: formatTransactionFromDb(txn) };
  return { error: 'Sesi tidak ditemukan atau sudah dihapus.' };
}

export function loginCashier(payload) {
  const username = String(payload?.username || '').trim();
  const password = String(payload?.password || '');
  if (!username || !password) {
    return { success: false, error: 'Username dan password harus diisi' };
  }
  const row = db.prepare('SELECT username, password, role FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (!row) {
    return { success: false, error: 'Nama kasir tidak ditemukan!' };
  }
  // Empty stored password is rejected — no default/fallback password.
  if (!row.password || row.password === '') {
    return { success: false, error: 'Password belum di-set. Hubungi admin.' };
  }
  if (password !== row.password) {
    return { success: false, error: 'Password shift tidak sesuai!' };
  }
  const role = row.role || 'cashier';
  return {
    success: true,
    user: { username: row.username, role },
    token: issueToken(row.username, role)
  };
}

export function backupDatabase() {
  if (!dbPath) return { success: false, error: 'DB path not set' };
  const dir = path.join(path.dirname(dbPath), 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(dir, `kasir-backup-${ts}.db`);
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    fs.copyFileSync(dbPath, backupPath);
    return { success: true, path: backupPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function handleAction(action, payload, auth) {
  // Authorization gate: everything except public actions needs a valid token;
  // admin-only actions additionally require an admin role.
  if (!PUBLIC_ACTIONS.has(action) && process.env.NODE_ENV !== 'test') {
    if (!auth) {
      return { error: 'Unauthorized: login required', code: 'UNAUTHORIZED' };
    }
    if (ADMIN_ONLY_ACTIONS.has(action) && auth.role !== 'admin') {
      return { error: 'Forbidden: admin role required', code: 'FORBIDDEN' };
    }
  }

  switch (action) {
    case 'fetch_data':
      return fetchAllData();
    case 'add_session':
      return addSession(payload);
    case 'edit_session':
      return editSession(payload);
    case 'delete_session':
      return deleteSession(payload.id);
    case 'claim_session':
      return claimSession(payload);
    case 'save_setting':
      return saveSetting(payload.key, payload.value);
    case 'save_user':
      return saveUser(payload.username, payload.password, payload.role);
    case 'delete_user':
      return deleteUser(payload.username);
    case 'delete_txn':
      return deleteTxn(payload);
    case 'clear_all_txns':
      return clearAllTxns();
    case 'verify_admin':
      return verifyAdmin(payload);
    case 'change_admin_pass':
      return changeAdminPassword(payload.old_password, payload.new_password);
    case 'login_cashier':
      return loginCashier(payload);
    case 'login_admin':
      return loginAdmin(payload);
    case 'track_session':
      return trackSession(payload);
    case 'backup_db':
      return backupDatabase();
    case 'add_deletion_log':
      return addDeletionLog(payload);
    case 'get_deletion_logs':
      return getDeletionLogs();
    default:
      return { error: `Unknown action: ${action}` };
  }
}
