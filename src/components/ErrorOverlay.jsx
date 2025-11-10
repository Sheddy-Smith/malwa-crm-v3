import React from 'react';

class ErrorOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for devtools
    console.error('ErrorOverlay caught error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children || null;

    const message = this.state.error?.toString() || 'An unexpected error occurred';
    const stack = this.state.info?.componentStack || this.state.error?.stack || '';

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: 20,
        zIndex: 999999,
        overflow: 'auto',
        fontFamily: 'monospace'
      }}>
        <h1 style={{ marginTop: 0 }}>Application Error</h1>
        <p>{message}</p>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{stack}</pre>
        <div style={{ marginTop: 20 }}>
          <button onClick={() => location.reload()} style={{ padding: '8px 12px', borderRadius: 6 }}>Reload</button>
        </div>
      </div>
    );
  }
}

export default ErrorOverlay;
