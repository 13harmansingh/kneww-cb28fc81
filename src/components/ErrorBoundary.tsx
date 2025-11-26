import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Record crash for safe mode detection
    import('@/stores/systemStore').then(({ useSystemStore }) => {
      useSystemStore.getState().recordCrash();
    });
    
    // Log to telemetry
    this.logErrorToTelemetry(error, errorInfo);
  }

  private async logErrorToTelemetry(error: Error, errorInfo: ErrorInfo) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Log to telemetry with enhanced details
      await supabase.from('telemetry_logs').insert({
        event_type: 'error.boundary',
        endpoint: window.location.pathname,
        user_id: session?.user?.id,
        metadata: {
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          browser: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      });
      
      // Emit system event
      await supabase.from('system_events').insert({
        type: 'ERROR_BOUNDARY_TRIGGERED',
        severity: 'error',
        user_id: session?.user?.id,
        data: {
          message: error.message,
          stack: error.stack,
          url: window.location.href,
        },
      });
    } catch (err) {
      console.error('Failed to log error to telemetry:', err);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                We've encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs overflow-auto p-4 bg-muted rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleRetry}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
