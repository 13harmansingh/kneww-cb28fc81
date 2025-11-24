import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Delay hiding to show "Back online" message briefly
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        !isOnline ? 'translate-y-0' : 'translate-y-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`py-2 px-4 text-center text-sm font-medium ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-destructive text-destructive-foreground'
        }`}
      >
        {isOnline ? (
          <span>✓ Back online</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            You're offline. Some features may not work.
          </span>
        )}
      </div>
    </div>
  );
}
