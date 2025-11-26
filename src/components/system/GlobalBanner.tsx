import { useState } from "react";
import { useAppSettings } from "@/hooks/system/useAppSettings";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalBanner() {
  const { settings } = useAppSettings();
  const [dismissed, setDismissed] = useState(false);
  
  const message = settings.global_banner_message;
  
  if (!message || message === 'null' || dismissed) {
    return null;
  }
  
  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center relative">
      <p className="text-sm font-medium pr-8">{message}</p>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
