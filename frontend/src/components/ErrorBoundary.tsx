import React, { type ReactNode } from 'react';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName?: string;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends React.Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error(`${this.props.tabName || 'Component'} crashed:`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '16px',
          background: 'rgba(0,75,73,0.2)'
        }}>
          <div style={{ fontSize: '32px' }}>🌊</div>
          <p style={{ color: '#83C5BE', fontSize: '16px', fontWeight: '600' }}>
            {this.props.tabName || 'Component'} — Reloading...
          </p>
          <p style={{ color: '#6B8CAE', fontSize: '12px', fontFamily: 'monospace' }}>
            {this.state.error}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            style={{
              background: '#006D77', border: 'none', borderRadius: '8px',
              color: 'white', padding: '8px 20px', cursor: 'pointer'
            }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
