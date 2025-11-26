import { supabase } from "@/integrations/supabase/client";

export interface ErrorDetails {
  message: string;
  stack?: string;
  componentName?: string;
  filePath?: string;
  url?: string;
  userAgent?: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  metadata?: Record<string, any>;
}

class ErrorSink {
  async capture(error: Error | string | any, details?: Partial<ErrorDetails>) {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const errorDetails: ErrorDetails = {
        message: errorMessage,
        stack: errorStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'error',
        ...details,
      };
      
      // Log to telemetry
      await supabase.from('telemetry_logs').insert({
        event_type: 'error.captured',
        endpoint: errorDetails.url,
        user_id: session?.user?.id,
        metadata: {
          error_message: errorDetails.message,
          error_stack: errorDetails.stack,
          component_name: errorDetails.componentName,
          file_path: errorDetails.filePath,
          browser: errorDetails.userAgent,
          severity: errorDetails.severity,
          timestamp: new Date().toISOString(),
          ...errorDetails.metadata,
        },
      });
      
      // Emit system event
      await supabase.from('system_events').insert({
        type: 'ERROR_CAPTURED',
        severity: errorDetails.severity,
        user_id: session?.user?.id,
        data: {
          message: errorDetails.message,
          stack: errorDetails.stack,
          url: errorDetails.url,
          component: errorDetails.componentName,
        },
      });
      
      console.error('[ErrorSink]', errorDetails);
    } catch (err) {
      console.error('[ErrorSink] Failed to capture error:', err);
    }
  }
  
  captureComponentError(error: Error, componentName: string, filePath?: string) {
    return this.capture(error, {
      componentName,
      filePath,
      severity: 'error',
    });
  }
  
  captureAPIError(error: any, endpoint: string) {
    return this.capture(error, {
      componentName: 'API',
      filePath: endpoint,
      severity: 'warn',
      metadata: { endpoint },
    });
  }
  
  captureCriticalError(error: Error | string, context?: string) {
    return this.capture(error, {
      severity: 'critical',
      componentName: context,
    });
  }
}

export const errorSink = new ErrorSink();
