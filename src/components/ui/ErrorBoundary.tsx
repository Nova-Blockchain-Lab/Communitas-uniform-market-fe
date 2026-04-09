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
        <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Something went wrong</h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4 max-w-[18rem] sm:max-w-sm">
            An unexpected error occurred. Please try refreshing or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-400/70 bg-red-500/8 rounded-lg p-3 mb-4 max-w-[calc(100vw-2rem)] sm:max-w-md overflow-x-auto whitespace-pre-wrap break-words border border-red-500/15">
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
