import { useSafeMode } from "@/hooks/system/useSafeMode";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Power } from "lucide-react";

export function SafeModeWrapper({ children }: { children: React.ReactNode }) {
  const { safeMode, crashCount, exitSafeMode } = useSafeMode();
  
  if (!safeMode) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Safe Mode Banner */}
      <div className="bg-destructive text-destructive-foreground px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Safe Mode Active</span>
        </div>
        <p className="text-sm mt-1 opacity-90">
          The app crashed {crashCount} times. Running in minimal mode for stability.
        </p>
      </div>
      
      {/* Safe Mode Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
              <Power className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Safe Mode</h1>
            <p className="text-muted-foreground">
              Advanced features are temporarily disabled for stability. Basic news viewing is available.
            </p>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-semibold">Disabled Features:</h2>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Animations and transitions</li>
              <li>• AI analysis and summaries</li>
              <li>• Interactive world map</li>
              <li>• Advanced filtering</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-semibold">Available Features:</h2>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Basic news feed</li>
              <li>• Bookmarks</li>
              <li>• Profile settings</li>
            </ul>
          </div>
          
          <Button
            onClick={exitSafeMode}
            className="w-full"
            size="lg"
          >
            Exit Safe Mode
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            If issues persist, please refresh the page or clear your browser cache.
          </p>
        </div>
        
        {/* Minimal content pass-through */}
        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
