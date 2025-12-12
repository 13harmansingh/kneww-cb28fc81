import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  enabled?: boolean;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export const useSwipeNavigation = ({
  minSwipeDistance = 80,
  maxSwipeTime = 400,
  enabled = true,
  onSwipeRight,
  onSwipeLeft,
}: SwipeConfig = {}) => {
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const animatingRef = useRef(false);

  // Smooth animation back to zero
  const animateReset = useCallback(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    
    const startProgress = swipeProgress;
    const startTime = performance.now();
    const duration = 200;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setSwipeProgress(startProgress * (1 - eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSwipeProgress(0);
        setSwipeDirection(null);
        animatingRef.current = false;
      }
    };

    requestAnimationFrame(animate);
  }, [swipeProgress]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (animatingRef.current) return;
      
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
      if (!touchStartRef.current || animatingRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Only process horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
        const progress = Math.min(Math.abs(deltaX) / minSwipeDistance, 1);
        setSwipeProgress(progress);
        setSwipeDirection(deltaX > 0 ? "right" : "left");

        // Prevent default scrolling when swiping horizontally
        if (progress > 0.15) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || animatingRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check if it's a valid horizontal swipe
      const isValidSwipe = 
        Math.abs(deltaX) > minSwipeDistance &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
        deltaTime < maxSwipeTime;

      if (isValidSwipe) {
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

      // Reset with animation
      touchStartRef.current = null;
      animateReset();
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
  }, [enabled, minSwipeDistance, maxSwipeTime, onSwipeRight, onSwipeLeft, navigate, animateReset]);

  return { swipeProgress, swipeDirection };
};
