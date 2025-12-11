import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeIndicatorProps {
  progress: number;
  direction: "left" | "right" | null;
}

export const SwipeIndicator = ({ progress, direction }: SwipeIndicatorProps) => {
  if (progress === 0 || !direction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: progress }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-40 pointer-events-none",
          direction === "right" ? "left-8" : "right-8"
        )}
      >
        <motion.div
          animate={{ scale: 1 + progress * 0.3 }}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "bg-accent/80 backdrop-blur-sm shadow-lg border-2 border-accent-foreground/20"
          )}
        >
          {direction === "right" ? (
            <ChevronLeft className="w-8 h-8 text-accent-foreground" />
          ) : (
            <ChevronRight className="w-8 h-8 text-accent-foreground" />
          )}
        </motion.div>
        <motion.p
          animate={{ opacity: progress }}
          className="text-center text-accent-foreground text-sm font-semibold mt-2"
        >
          {direction === "right" ? "Go Back" : "Go Forward"}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};
