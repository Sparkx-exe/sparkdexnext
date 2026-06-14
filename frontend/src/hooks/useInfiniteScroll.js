import { useEffect, useRef } from 'react';

export const useInfiniteScroll = (callback, hasNextPage, isLoading) => {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: '0px 0px 400px 0px', // Fetch 400px before reaching bottom
        threshold: 0.1,
      }
    );

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [callback, hasNextPage, isLoading]);

  return triggerRef;
};

export default useInfiniteScroll;
