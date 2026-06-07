import React from 'react';
import { triggerDeveloperEmail, generateDiagnosticReport } from '../lib/diagnostics';
import useStore from '../store/useStore';
import { AlertTriangle, Copy, Mail, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log the error to our diagnostics log buffer
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleCopy = () => {
    const storeState = useStore.getState();
    const report = generateDiagnosticReport(storeState, `React Crash Error:\n${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || ''}`);
    navigator.clipboard.writeText(report);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  handleEmail = () => {
    const storeState = useStore.getState();
    const crashDetails = `React Crash Error:\n${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || ''}`;
    triggerDeveloperEmail(storeState, crashDetails);
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
          color: 'var(--text-main)',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'var(--surface-color)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            border: '3px solid var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 107, 107, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <AlertTriangle size={48} />
            </div>

            <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>
              StorySprout hit a bump! 🌲
            </h1>
            
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '1.05rem' }}>
              Oops! Our garden experienced an unexpected problem. We've collected the diagnostic details so the developer can help fix it.
            </p>

            <div style={{ width: '100%', textAlign: 'left', marginTop: '0.5rem' }}>
              <details style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer'
              }}>
                <summary style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Show Technical Details
                </summary>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: 'var(--primary)',
                  marginTop: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  cursor: 'text'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </details>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%',
              marginTop: '1rem'
            }}>
              <button 
                onClick={this.handleEmail}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem'
                }}
              >
                <Mail size={18} />
                Email Report to Developer
              </button>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <button 
                  onClick={this.handleCopy}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <Copy size={16} />
                  {this.state.copied ? 'Copied!' : 'Copy Debug Info'}
                </button>

                <button 
                  onClick={this.handleReload}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <RefreshCw size={16} />
                  Restart App
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
