import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '20px', backgroundColor: '#0d1117', color: '#c9d1d9', textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem', color: '#f59e0b' }}></i>
          </div>
          <h3 style={{ color: '#f85149', marginBottom: '12px', fontWeight: 700 }}>Terjadi Kendala Memuat Aplikasi</h3>
          <p style={{ maxWidth: '450px', marginBottom: '24px', color: '#8b949e', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Aplikasi mengalami kesalahan runtime atau struktur cache lokal tidak kompatibel.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 18px', borderRadius: '6px', background: '#238636', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={this.handleReset}
              style={{ padding: '10px 18px', borderRadius: '6px', background: '#da3633', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
