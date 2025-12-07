'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger-client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to error reporting service
    logger.error('Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // In production, send to Sentry or similar
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-foreground">
                عذراً، حدث خطأ
              </h1>
              <p className="text-muted-foreground">
                حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-destructive/10 p-4 rounded-lg overflow-auto max-h-48">
                <p className="font-mono text-sm text-destructive">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                حاول مرة أخرى
              </Button>
              <Button onClick={this.handleReload}>
                إعادة تحميل الصفحة
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple Error Fallback Component
 * Can be used as a lighter alternative to full ErrorBoundary
 */
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  return (
    <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-1">
            حدث خطأ
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {error.message || 'حدث خطأ غير متوقع'}
          </p>
          <Button onClick={resetError} size="sm" variant="outline">
            حاول مرة أخرى
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for error handling in functional components
 * 
 * Usage:
 * const { error, setError, resetError } = useErrorHandler();
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = () => setError(null);

  useEffect(() => {
    if (error) {
      logger.error('Component error', error);
    }
  }, [error]);

  return { error, setError, resetError };
}

// Add missing import
import { useState, useEffect } from 'react';

