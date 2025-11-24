/**
 * Global API status component for displaying rate limits, errors, and loading states
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalApiStatus } from '@/stores/globalApiStatus';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ERROR_MESSAGES } from '@/config/constants';
import { Button } from '@/components/ui/button';

export function GlobalAPIStatus() {
  const navigate = useNavigate();
  const { isRateLimited, authError, serverError, loading, reset } = useGlobalApiStatus();

  // Handle rate limit
  useEffect(() => {
    if (isRateLimited) {
      toast({
        title: 'Rate Limit Reached',
        description: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        variant: 'destructive',
      });
      
      // Auto-reset after 5 seconds
      const timer = setTimeout(() => {
        reset();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isRateLimited, reset]);

  // Handle auth error
  useEffect(() => {
    if (authError) {
      toast({
        title: 'Authentication Required',
        description: ERROR_MESSAGES.AUTH_REQUIRED,
        variant: 'destructive',
      });
      
      // Redirect to login after showing toast
      const timer = setTimeout(() => {
        navigate('/login');
        reset();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [authError, navigate, reset]);

  // Handle server error
  useEffect(() => {
    if (serverError) {
      toast({
        title: 'Error',
        description: serverError,
        variant: 'destructive',
        action: (
          <Button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        ),
      });
    }
  }, [serverError, reset]);

  // Global loading indicator (top-right corner)
  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  return null;
}
