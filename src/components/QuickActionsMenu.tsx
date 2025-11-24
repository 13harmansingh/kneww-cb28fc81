import { Bookmark, Languages, Share2, Scale, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickActionsMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onBookmark: () => void;
  onTranslate: () => void;
  onShare: () => void;
  onCompare: () => void;
  isBookmarked?: boolean;
  canTranslate?: boolean;
}

export const QuickActionsMenu = ({
  isOpen,
  position,
  onClose,
  onBookmark,
  onTranslate,
  onShare,
  onCompare,
  isBookmarked = false,
  canTranslate = true,
}: QuickActionsMenuProps) => {
  const actions = [
    {
      icon: Bookmark,
      label: isBookmarked ? "Remove" : "Bookmark",
      onClick: onBookmark,
      className: isBookmarked ? "text-accent" : "text-foreground",
    },
    {
      icon: Languages,
      label: "Translate",
      onClick: onTranslate,
      className: "text-foreground",
      disabled: !canTranslate,
    },
    {
      icon: Share2,
      label: "Share",
      onClick: onShare,
      className: "text-foreground",
    },
    {
      icon: Scale,
      label: "Compare",
      onClick: onCompare,
      className: "text-foreground",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              position: "fixed",
              left: Math.min(position.x, window.innerWidth - 200),
              top: Math.min(position.y, window.innerHeight - 300),
            }}
            className="z-50 bg-card border-2 border-accent/50 rounded-2xl shadow-2xl p-2 min-w-[180px]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Actions */}
            <div className="space-y-1">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (!action.disabled) {
                      action.onClick();
                      onClose();
                    }
                  }}
                  disabled={action.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    "hover:bg-accent/20 active:scale-95",
                    action.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    action.className
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
