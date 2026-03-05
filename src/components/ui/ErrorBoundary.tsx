import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Something went wrong</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-sm">
            An unexpected error occurred. Please try refreshing or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-400/70 bg-red-500/8 rounded-lg p-3 mb-4 max-w-md overflow-auto border border-red-500/15">
              {this.state.error.message}
            </pre>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
