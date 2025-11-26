import { useSystemStore } from "@/stores/systemStore";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RecoveryFlyout() {
  const { isRecovering, recoveryQueue } = useSystemStore();
  
  if (!isRecovering || recoveryQueue.length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed bottom-4 right-4 z-50 bg-card/95 backdrop-blur-sm border border-border px-4 py-3 rounded-lg shadow-lg max-w-sm"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              KNEW is restoring
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please wait...
            </p>
            <div className="mt-2 space-y-1">
              {recoveryQueue.slice(0, 3).map((task) => (
                <div key={task.id} className="text-xs text-muted-foreground">
                  • {task.type} (attempt {task.retryCount + 1}/{task.maxRetries})
                </div>
              ))}
              {recoveryQueue.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  + {recoveryQueue.length - 3} more tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
