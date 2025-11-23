/**
 * Unified API client for all edge function calls
 * Provides consistent error handling, telemetry, and rate limit detection
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse, ApiRequestOptions } from '@/config/types';
import { ERROR_MESSAGES } from '@/config/constants';

interface InvokeOptions extends ApiRequestOptions {
  functionName: string;
  body: any;
  headers?: Record<string, string>;
}

/**
 * Unified API call wrapper with built-in telemetry and error handling
 */
export async function invokeEdgeFunction<T = any>({
  functionName,
  body,
  headers = {},
  signal,
  onRateLimited,
  onAuthError,
  suppressErrors = false,
}: InvokeOptions): Promise<ApiResponse<T>> {
  const startTime = Date.now();

  try {
    // Check if already aborted
    if (signal?.aborted) {
      return {
        data: null,
        error: { message: 'Request aborted' },
        status: 'error',
      };
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    const duration = Date.now() - startTime;

    // Log telemetry (if needed)
    console.log(`[API] ${functionName} completed in ${duration}ms`);

    if (error) {
      // Handle rate limiting
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        if (onRateLimited) onRateLimited();
        return {
          data: null,
          error: { message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, code: 'RATE_LIMITED' },
          status: 'rate_limited',
        };
      }

      // Handle auth errors
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        if (onAuthError) onAuthError();
        return {
          data: null,
          error: { message: ERROR_MESSAGES.AUTH_REQUIRED, code: 'AUTH_ERROR' },
          status: 'auth_error',
        };
      }

      // Generic error
      return {
        data: null,
        error: {
          message: suppressErrors ? ERROR_MESSAGES.SERVER_ERROR : error.message,
          details: error,
        },
        status: 'error',
      };
    }

    return {
      data: data as T,
      error: null,
      status: 'success',
    };
  } catch (err: any) {
    // Handle network or unexpected errors
    return {
      data: null,
      error: {
        message: suppressErrors ? ERROR_MESSAGES.NETWORK_ERROR : err.message,
        details: err,
      },
      status: 'error',
    };
  }
}

/**
 * Generate cache key for requests
 */
export function generateCacheKey(functionName: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${functionName}:${sortedParams}`;
}
