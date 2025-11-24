import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  enabled?: boolean;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export const useSwipeNavigation = ({
  minSwipeDistance = 100,
  maxSwipeTime = 300,
  enabled = true,
  onSwipeRight,
  onSwipeLeft,
}: SwipeConfig = {}) => {
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setSwipeProgress(0);
      setSwipeDirection(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Only process horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        const progress = Math.min(Math.abs(deltaX) / minSwipeDistance, 1);
        setSwipeProgress(progress);
        setSwipeDirection(deltaX > 0 ? "right" : "left");

        // Prevent default scrolling when swiping horizontally
        if (progress > 0.1) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check if it's a horizontal swipe
      if (
        Math.abs(deltaX) > minSwipeDistance &&
        Math.abs(deltaX) > Math.abs(deltaY) * 2 && // More horizontal than vertical
        deltaTime < maxSwipeTime
      ) {
        if (deltaX > 0) {
          // Swipe right - go back
          if (onSwipeRight) {
            onSwipeRight();
          } else {
            window.history.back();
          }
        } else {
          // Swipe left - go forward (if custom handler provided)
          if (onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      // Reset
      touchStartRef.current = null;
      setSwipeProgress(0);
      setSwipeDirection(null);
    };

    // Add listeners with { passive: false } to allow preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, minSwipeDistance, maxSwipeTime, onSwipeRight, onSwipeLeft, navigate]);

  return { swipeProgress, swipeDirection };
};
