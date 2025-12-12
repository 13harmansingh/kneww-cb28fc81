import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeIndicatorProps {
  progress: number;
  direction: "left" | "right" | null;
}

export const SwipeIndicator = ({ progress, direction }: SwipeIndicatorProps) => {
  if (progress < 0.1 || !direction) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={direction}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: Math.min(progress * 1.5, 1),
          scale: 1,
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.8,
          transition: { duration: 0.15 }
        }}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 pointer-events-none",
          direction === "right" ? "left-4" : "right-4"
        )}
      >
        <motion.div
          animate={{ 
            scale: 1 + progress * 0.2,
            x: direction === "right" ? progress * 10 : -progress * 10,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-accent/90 backdrop-blur-md shadow-xl shadow-accent/20",
            "border border-accent-foreground/10"
          )}
        >
          {direction === "right" ? (
            <ChevronLeft className="w-7 h-7 text-accent-foreground" />
          ) : (
            <ChevronRight className="w-7 h-7 text-accent-foreground" />
          )}
        </motion.div>
        
        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-14 h-14 -rotate-90"
          viewBox="0 0 56 56"
        >
          <circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent/30"
          />
          <motion.circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={163.36}
            strokeDashoffset={163.36 * (1 - progress)}
            className="text-accent-foreground"
            strokeLinecap="round"
          />
        </svg>
        
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: progress > 0.3 ? 1 : 0, y: 0 }}
          className="text-center text-accent-foreground text-xs font-semibold mt-2 whitespace-nowrap"
        >
          {direction === "right" ? "Go Back" : "Go Forward"}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};
