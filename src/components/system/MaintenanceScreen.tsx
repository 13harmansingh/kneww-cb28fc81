import { useAppSettings } from "@/hooks/system/useAppSettings";
import { Construction } from "lucide-react";

export function MaintenanceScreen({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, settings } = useAppSettings();
  
  if (!maintenanceMode) {
    return <>{children}</>;
  }
  
  const message = settings.global_banner_message || 'knew is currently undergoing maintenance. We\'ll be back soon!';
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
          <Construction className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground text-lg">
            {message}
          </p>
        </div>
        
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            System status is being updated...
          </div>
        </div>
      </div>
    </div>
  );
}
