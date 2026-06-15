import { useEffect, useState, useRef } from 'react';

export const usePullToRefresh = (onRefresh) => {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullProgressRef = useRef(0);

  // Sync ref with progress state changes
  useEffect(() => {
    pullProgressRef.current = pullProgress;
  }, [pullProgress]);

  useEffect(() => {
    // Only enable on mobile viewports
    if (window.innerWidth >= 1024) return;

    const handleTouchStart = (e) => {
      // Only trigger pull to refresh if user is at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!active.current) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (deltaY > 0) {
        // Resistive pulling calculation
        const progress = Math.min(deltaY / 3, 100);
        setPullProgress(progress);
        
        // Prevent default browser refresh/pull actions when scroll is at 0
        if (progress > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!active.current) return;
      active.current = false;

      const progress = pullProgressRef.current;
      if (progress >= 65) {
        setIsRefreshing(true);
        setPullProgress(65); // Lock at loading offset
        
        // Trigger page refresh callback
        Promise.resolve(onRefresh()).finally(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullProgress(0);
          }, 600); // short delay to show spinner
        });
      } else {
        setPullProgress(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh]);

  return { pullProgress, isRefreshing };
};

export default usePullToRefresh;
