// client/src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="alert alert-danger m-3" role="alert">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
            <div>
              <h5 className="alert-heading mb-1">Oops! Something went wrong</h5>
              <p className="mb-2">
                {this.props.message || "This component encountered an error and couldn't render properly."}
              </p>
              {this.props.showDetails && this.state.error && (
                <details className="mt-2">
                  <summary className="text-muted small">Error details</summary>
                  <code className="d-block mt-2 small">
                    {this.state.error.toString()}
                  </code>
                </details>
              )}
              <button 
                className="btn btn-outline-danger btn-sm mt-2"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-refresh me-1"></i>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;