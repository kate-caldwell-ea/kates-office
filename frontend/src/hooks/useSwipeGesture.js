import { useRef, useCallback } from 'react';

/**
 * Swipe Gesture Hook
 * Detects horizontal and vertical swipe gestures
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50, // Minimum distance for swipe
  restraint = 100, // Maximum perpendicular distance
  allowedTime = 300, // Maximum time for swipe in ms
} = {}) {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    const distX = touchEnd.current.x - touchStart.current.x;
    const distY = touchEnd.current.y - touchStart.current.y;
    const elapsedTime = Date.now() - touchStart.current.time;

    // Check if swipe was fast enough
    if (elapsedTime > allowedTime) return;

    // Check for horizontal swipe
    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
      if (distX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    // Check for vertical swipe
    if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
      if (distY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint, allowedTime]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Swipe to navigate between Kanban columns
 */
export function useKanbanSwipe({ columns, currentIndex, onColumnChange }) {
  const handlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentIndex < columns.length - 1) {
        onColumnChange(currentIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        onColumnChange(currentIndex - 1);
      }
    },
    threshold: 75,
    restraint: 100
  });

  return handlers;
}

export default useSwipeGesture;
