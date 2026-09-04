import React, { useState, useEffect } from 'react';
import LoginPage from './features/auth/components/LoginPage';
import { getShiftDate } from './lib/shift';
import { fmtRp, fmtDur, generateShortId, safeSetItem, normalizeItems, normalizeSession, normalizeTxn } from './lib/utils';
import { ITEMS } from './lib/items';
import DashboardTab from './components/DashboardTab';
import HistoryTab from './features/transactions/components/HistoryTab';
import DeletionLogTab from './features/transactions/components/DeletionLogTab';
import SettingsTab from './components/SettingsTab';
import FooterNav from './components/FooterNav';
import RoleSelection from './features/auth/components/RoleSelection';

import CalculateRentalModal from './features/rentals/components/CalculateRentalModal';
import PaymentModal from './components/PaymentModal';
import PasswordVerificationModal from './features/auth/components/PasswordVerificationModal';
import QRCodeModal from './components/QRCodeModal';
import EditActiveSessionModal from './features/rentals/components/EditActiveSessionModal';
import TrackingPage from './components/TrackingPage';
import LiveClock from './components/LiveClock';
import { useReceiptPrinter } from './features/receipts/useReceiptPrinter';
import { usePOSData } from './features/pos/hooks/usePOSData';
import { useRentalActions } from './features/rentals/hooks/useRentalActions';
import { useTransactionActions } from './features/transactions/hooks/useTransactionActions';
import { useAuthSession } from './features/auth/hooks/useAuthSession';
import { useAdminEscalation } from './features/auth/hooks/useAdminEscalation';

// Re-export agar komponen yang masih import dari '../App' tetap berfungsi
export { ITEMS, fmtRp, fmtDur, generateShortId, safeSetItem, normalizeItems, normalizeSession, normalizeTxn };

// No localStorage data caching — SQLite server is source of truth

function App() {
  const [shiftQueueNo, setShiftQueueNo] = useState(0);

  const {
    isAuthenticated,
    currentUserRole,
    currentShiftUser,
    setCurrentUserRole,
    handleLogin,
    selectCashierRole,
    selectAdminRole,
    resetRole,
    handleLogout,
    clearSessionState,
    doLogout,
    showLogoutConfirm,
    setShowLogoutConfirm,
    logoutConfirmName,
    setLogoutConfirmName
  } = useAuthSession({
    onSessionCleared: () => setShiftQueueNo(0)
  });

  const {
    pendingAction,
    setPendingAction,
    requestEscalation,
    cancelEscalation,
    verifyAndEscalate,
    executePendingAction
  } = useAdminEscalation();

  const [activeTab, setActiveTab] = useState('dashboard');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('kw_theme') || 'dark';
  });
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  // Modals Visibility
  const [activeCheckoutSession, setActiveCheckoutSession] = useState(null);
  const [activePaymentData, setActivePaymentData] = useState(null);
  const [activeQRModalSession, setActiveQRModalSession] = useState(null);
  const [activeEditSession, setActiveEditSession] = useState(null);

  // Settings states
  const [printMulai, setPrintMulai] = useState(false);
  const [printSelesai, setPrintSelesai] = useState(false);
  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0);

  const todayStr = (ts) => getShiftDate(ts);

  const {
    activeSessions,
    setActiveSessions,
    transactions,
    setTransactions,
    users,
    deletionLogs,
    setDeletionLogs,
    apiConnected,
    isSyncing,
    lastSyncTime,
    loadData
  } = usePOSData({
    isAuthenticated,
    onUnauthorized: clearSessionState,
    onShiftDateChange: () => setShiftQueueNo(0)
  });

  useEffect(() => {
    // Load preferences and session state from localStorage (by design)
    setShiftQueueNo(parseInt(localStorage.getItem('kw_shiftQNo') || '0'));
    setPrintMulai(localStorage.getItem('kw_printMulai') === 'true');
    setPrintSelesai(localStorage.getItem('kw_printSelesai') === 'true');

    const savedTheme = localStorage.getItem('kw_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#track/')) {
        setIsTrackingMode(true);
        const cleanId = hash.replace('#track/', '').split('?')[0].split('&')[0].replace(/\/+$/, '').trim();
        setTrackingId(cleanId);
      } else {
        setIsTrackingMode(false);
        setTrackingId('');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);



  const { printStart: handlePrintMulai, printFinish: handlePrintSelesai } = useReceiptPrinter({
    currentShiftUser
  });

  const {
    startRental: handleStartSewa,
    editRental: handleSaveEditedSessionAction,
    claimRental: handleClaimRentalAction
  } = useRentalActions({
    setActiveSessions,
    setTransactions,
    currentShiftUser,
    todayStr,
    onSessionStarted: (newSess) => {
      setShiftQueueNo(Number(newSess.queueNo) || 0);
      if (printMulai) handlePrintMulai(newSess);
    },
    onEditSaved: () => {
      setActiveEditSession(null);
    },
    onPaymentFinalized: (newTxn) => {
      if (printSelesai) handlePrintSelesai(newTxn);
    }
  });

  if (isTrackingMode) {
    return <TrackingPage trackingId={trackingId} />;
  }

  const getImgUrl = (code) => {
    imageUpdateTrigger; // dependency tracking
    return localStorage.getItem('kw_img_' + code);
  };

  const {
    deleteTransaction: handleDeleteTxn,
    clearHistory: handleClearHistory,
    loadDeletionLogs
  } = useTransactionActions({
    transactions,
    setTransactions,
    setDeletionLogs,
    currentShiftUser,
    loadData
  });

  const handleVerifySuccess = () => {
    executePendingAction({
      onEditSession: (session) => setActiveEditSession(session),
      onDeleteTxn: (id) => handleDeleteTxn(id)
    });
  };

  const handleSaveEditedSession = async (updatedSession) => {
    await handleSaveEditedSessionAction(updatedSession);
  };

  const handleFinalizePayment = async (cash, qris) => {
    if (!activePaymentData) return;
    try {
      await handleClaimRentalAction(activePaymentData, cash, qris);
    } finally {
      setActivePaymentData(null);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('kw_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handlePrintMulaiToggle = (val) => {
    setPrintMulai(val);
    localStorage.setItem('kw_printMulai', String(val));
  };

  const handlePrintSelesaiToggle = (val) => {
    setPrintSelesai(val);
    localStorage.setItem('kw_printSelesai', String(val));
  };

  if (!currentUserRole) {
    return (
      <RoleSelection 
        onSelectCashier={selectCashierRole}
        onSelectAdmin={selectAdminRole}
      />
    );
  }

  if (currentUserRole === 'cashier' && !currentShiftUser) {
    return (
      <LoginPage onLogin={handleLogin} onBack={resetRole} />
    );
  }

  return (
    <div id="mainApp">
      <header className="app-header sticky-top">
        <div className="container-fluid px-3 px-md-4">
          <div className="d-flex align-items-center justify-content-between py-2 gap-2">
            <div>
              <div className="brand-title">EVREN HOUSE</div>
              <div className="brand-sub">Scooter &amp; Stroller</div>
            </div>
            <div className="d-flex align-items-center gap-2 gap-md-3">
              
              {/* Profile - Akhiri Shift */}
              <div className="dropdown">
                <div
                  className="shift-indicator d-flex align-items-center dropdown-toggle"
                  data-bs-toggle="dropdown"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person-fill" style={{ color: 'var(--green)', fontSize: '1rem', marginRight: '4px' }}></i>
                  <span>{currentShiftUser || (currentUserRole === 'admin' ? 'Admin' : 'Kasir')}</span>
                </div>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark shadow border-0" style={{ backgroundColor: 'var(--card-bg)', minWidth: '180px' }}>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right"></i>
                      <span>Akhiri Shift</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Status Badge & Refresh */}
              <div className="d-flex align-items-center gap-2">
                <div title={`API Connection: ${apiConnected ? 'Online' : 'Offline'}`} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '.65rem', fontWeight: 700, letterSpacing: '.5px',
                  padding: '3px 6px', borderRadius: '4px', cursor: 'default',
                  background: apiConnected
                    ? 'rgba(63,185,80,.15)' : 'rgba(249,115,22,.15)',
                  color: apiConnected
                    ? 'var(--green)' : 'var(--orange)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                    background: 'currentColor',
                    animation: isSyncing ? 'pulse 1.2s infinite' : 'none',
                  }}/>
                  <span className="d-none d-sm-inline">
                    {isSyncing ? 'SYNC…' : apiConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <button
                  className="bg-transparent border-0 text-secondary p-1 d-flex align-items-center justify-content-center"
                  title="Refresh Data dari Server"
                  onClick={loadData}
                  style={{ cursor: 'pointer', fontSize: '1.1rem', color: 'var(--cyan)' }}
                  aria-label="Refresh Data dari Server"
                >
                  <i className="bi bi-arrow-repeat clr-cyan" style={{ transition: 'transform 0.3s ease' }}></i>
                </button>
              </div>

              <div className="vr d-none d-sm-block" style={{ opacity: 0.15, height: '24px' }}></div>

              <LiveClock />
            </div>
          </div>
        </div>
      </header>
      <div className="container-fluid px-2 px-md-3 py-3" style={{ paddingBottom: '80px' }}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            activeSessions={activeSessions}
            onStartSewa={handleStartSewa}
            getImgUrl={getImgUrl}
            onSelesaiSewa={(session) => setActiveCheckoutSession(session)}
            onShowQR={(session) => setActiveQRModalSession(session)}
            onPrintSesi={handlePrintMulai}
            onEditSesi={(session) => {
              requestEscalation({ type: 'editSession', session });
            }}
          />
        )}
        {activeTab === 'riwayat' && (
          <HistoryTab
            transactions={transactions}
            onPrintTxn={handlePrintSelesai}
            onDeleteTxn={(id) => {
              if (currentUserRole === 'admin') {
                handleDeleteTxn(id);
              } else {
                requestEscalation({ type: 'deleteTxn', id });
              }
            }}
            onClearHistory={currentUserRole === 'admin' ? handleClearHistory : null}
            currentUserRole={currentUserRole}
          />
        )}
        {activeTab === 'log-hapus' && currentUserRole === 'admin' && (
          <DeletionLogTab
            deletionLogs={deletionLogs}
            onLoadDeletionLogs={loadDeletionLogs}
          />
        )}
        {activeTab === 'pengaturan' && currentUserRole === 'cashier' && (
          <div className="text-center mt-5">
            <h4>Akses Ditolak</h4>
            <p>Hanya Admin yang dapat mengakses Pengaturan.</p>
          </div>
        )}
        {activeTab === 'pengaturan' && currentUserRole === 'admin' && (
          <SettingsTab
            users={users}
            transactions={transactions}
            activeSessions={activeSessions}
            currentShiftUser={currentShiftUser}
            theme={theme}
            onThemeChange={handleThemeChange}
            sbConnected={apiConnected}
            lastSyncTime={lastSyncTime}
            onSyncPull={loadData}
            printMulai={printMulai}
            onChangePrintMulai={handlePrintMulaiToggle}
            printSelesai={printSelesai}
            onChangePrintSelesai={handlePrintSelesaiToggle}
            onUpdateItemImg={(code, url) => {
              localStorage.setItem('kw_img_' + code, url);
              setImageUpdateTrigger(prev => prev + 1);
            }}
            onResetItemImg={(code) => {
              localStorage.removeItem('kw_img_' + code);
              setImageUpdateTrigger(prev => prev + 1);
            }}
            getImgUrl={getImgUrl}
          />
        )}
      </div>

      <FooterNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={activeSessions.length}
        currentUserRole={currentUserRole}
      />

      {activeCheckoutSession && (
        <CalculateRentalModal
          session={activeCheckoutSession}
          onClose={() => setActiveCheckoutSession(null)}
          onProceedPayment={(data) => {
            setActiveCheckoutSession(null);
            setActivePaymentData(data);
          }}
          currentUserRole={currentUserRole}
        />
      )}

      {activePaymentData && (
        <PaymentModal
          bayarData={activePaymentData}
          onClose={() => setActivePaymentData(null)}
          onFinalize={handleFinalizePayment}
        />
      )}

      {pendingAction && (
        <PasswordVerificationModal
          onVerify={verifyAndEscalate}
          onClose={cancelEscalation}
          onVerifySuccess={handleVerifySuccess}
        />
      )}

      {activeQRModalSession && (
        <QRCodeModal
          session={activeQRModalSession}
          onClose={() => setActiveQRModalSession(null)}
        />
      )}

      {activeEditSession && (
        <EditActiveSessionModal
          session={activeEditSession}
          onClose={() => setActiveEditSession(null)}
          onSave={handleSaveEditedSession}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div style={{
            background: 'var(--bg2)', border: '1.5px solid var(--border)',
            borderRadius: '24px 24px 0 0', padding: '28px 24px 36px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'color-mix(in srgb, var(--red) 15%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--red) 35%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', color: 'var(--red)', flexShrink: 0,
              }}>
                <i className="bi bi-box-arrow-right"></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Akhiri Shift</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '2px' }}>Sesi {currentShiftUser} akan berakhir</div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.4rem', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: '12px', fontWeight: 600 }}>
              Ketik nama <strong style={{ color: 'var(--text)' }}>{currentShiftUser}</strong> untuk konfirmasi:
            </div>
            <input
              type="text"
              className="login-field"
              style={{ marginBottom: '16px' }}
              placeholder={`Ketik "${currentShiftUser}"...`}
              value={logoutConfirmName}
              onChange={(e) => setLogoutConfirmName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogout()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-sec"
                style={{ flex: 1 }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Batal
              </button>
              <button
                onClick={doLogout}
                disabled={logoutConfirmName.trim().toLowerCase() !== (currentShiftUser || '').toLowerCase()}
                style={{
                  flex: 2, background: 'linear-gradient(135deg, var(--red), #c0392b)',
                  color: '#fff', border: 'none', borderRadius: '12px', padding: '13px',
                  fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1rem',
                  cursor: 'pointer', opacity: logoutConfirmName.trim().toLowerCase() !== (currentShiftUser || '').toLowerCase() ? 0.45 : 1,
                  transition: 'opacity .15s',
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>Akhiri Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
