import { useCallback, useRef, useState } from "react";

interface LongPressOptions {
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  shouldPreventDefault?: boolean;
}

export const useLongPress = ({
  onLongPress,
  delay = 500,
  shouldPreventDefault = true,
}: LongPressOptions) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault) {
        event.preventDefault();
      }

      targetRef.current = event.target;
      setIsLongPressing(true);

      timeoutRef.current = setTimeout(() => {
        onLongPress(event);
        setIsLongPressing(false);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLongPressing(false);
    targetRef.current = null;
  }, []);

  const handlers = {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };

  return {
    handlers,
    isLongPressing,
  };
};
