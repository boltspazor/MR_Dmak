import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-2xl w-full bg-white border border-red-100 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-700 mb-4">An unexpected error occurred while rendering the app. Please reload the page or contact support.</p>
            <details className="text-left p-4 bg-gray-50 rounded-md text-sm text-gray-600 overflow-auto max-h-48">
              <summary className="cursor-pointer font-medium">Error details (expand)</summary>
              <pre className="whitespace-pre-wrap mt-2">{String(this.state.error)}{this.state.errorInfo ? '\n\n' + this.state.errorInfo.componentStack : ''}</pre>
            </details>
            <div className="mt-4 flex justify-center gap-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Reload</button>
              <button onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); }} className="px-4 py-2 border rounded-md">Dismiss</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;
