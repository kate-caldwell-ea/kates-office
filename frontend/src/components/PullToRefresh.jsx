import { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Pull-to-Refresh Component
 * Wraps content and enables pull-down refresh on mobile
 */
export function PullToRefresh({ onRefresh, children, disabled = false }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const THRESHOLD = 80; // Pull distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only enable pull-to-refresh when at top of scroll
    if (container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || disabled || refreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only track downward pull
    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);
      
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [pulling, disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    
    if (pullDistance >= THRESHOLD && !refreshing && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD / 2); // Hold at smaller distance while refreshing
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      setRefreshing(false);
    }
    
    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, refreshing, onRefresh]);

  // Add passive false for touch events to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchMove]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-auto h-full"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-opacity duration-200"
        style={{
          top: Math.max(0, pullDistance - 50),
          opacity: pullDistance > 10 ? 1 : 0,
          transform: `translateY(${Math.min(pullDistance, MAX_PULL) - 40}px)`
        }}
      >
        <div 
          className={`
            p-3 rounded-full shadow-lg
            ${refreshing ? 'bg-sage-500 text-white' : 'bg-white text-sage-600'}
            transition-colors duration-200
          `}
        >
          <RefreshCw 
            className={`w-5 h-5 transition-transform ${refreshing ? 'animate-spin' : ''}`}
            style={{ 
              transform: !refreshing ? `rotate(${rotation}deg)` : undefined 
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
