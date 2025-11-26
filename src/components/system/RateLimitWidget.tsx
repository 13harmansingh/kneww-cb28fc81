import { useRateLimitObserver } from "@/hooks/system/useRateLimitObserver";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RateLimitWidget() {
  const { rateLimited, cooldown } = useRateLimitObserver();
  
  if (!rateLimited) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-3 rounded-lg shadow-lg border border-destructive flex items-center gap-3 max-w-xs"
      >
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">API is cooling down</p>
          <p className="text-xs opacity-90">Next refresh in {cooldown}s</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
