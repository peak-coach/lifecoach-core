'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (could be sent to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-white/60 text-sm mb-6">
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Erneut versuchen
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                Zur Startseite
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline Error Display Component
 * For smaller, non-critical errors
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-red-300 text-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Loading/Error State Wrapper
 * Handles loading, error, and empty states consistently
 */
export function AsyncStateWrapper({
  isLoading,
  error,
  isEmpty,
  loadingFallback,
  errorFallback,
  emptyFallback,
  children,
  onRetry,
}: {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  emptyFallback?: ReactNode;
  children: ReactNode;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    );
  }

  if (error) {
    return (
      errorFallback || <InlineError message={error} onRetry={onRetry} />
    );
  }

  if (isEmpty) {
    return emptyFallback || null;
  }

  return <>{children}</>;
}

/**
 * Graceful Degradation Wrapper
 * Shows content if available, fallback otherwise
 */
export function GracefulFallback({
  condition,
  fallback,
  children,
}: {
  condition: boolean;
  fallback: ReactNode;
  children: ReactNode;
}) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * Retry Wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

