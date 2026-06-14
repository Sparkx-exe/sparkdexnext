import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight, AlertCircle } from 'lucide-react';
import MangaCard from './MangaCard';
import { SkeletonCard } from './SkeletonCard';

export const HorizontalScroller = ({ title, seeAllLink, queryKey, fetchFn, fetchParams = {} }) => {
  const loaderRef = useRef(null);
  const scrollerRef = useRef(null);

  // TanStack Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: [queryKey, fetchParams],
    queryFn: ({ pageParam = 0 }) => fetchFn({ ...fetchParams, offset: pageParam, limit: 10 }),
    getNextPageParam: (lastPage, allPages) => {
      // MangaDex returns data, limit, offset, total in standard list responses
      const total = lastPage.total || 0;
      const currentOffset = allPages.length * 10;
      return currentOffset < total ? currentOffset : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flat array of manga objects
  const mangas = data?.pages.flatMap((page) => page.data || []) || [];

  // Setup IntersectionObserver for scroll-right lazy loading
  useEffect(() => {
    if (!hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollerRef.current,
        rootMargin: '0px 200px 0px 0px', // Trigger slightly before it hits the viewport
        threshold: 0.1,
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Keyboard and Wheel horizontal scroll helper
  const handleScrollLeft = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="horizontal-section-container">
      <div className="section-heading-wrapper">
        <h3 className="section-title">{title}</h3>
        {seeAllLink && (
          <Link to={seeAllLink} className="see-all-link">
            <span>See All</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="horizontal-scroller-wrapper">
        {isLoading ? (
          <div className="horizontal-scroller-track">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="scroller-card-container">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="scroller-error-state">
            <AlertCircle size={24} />
            <span>Failed to load manga feed. Please retry.</span>
          </div>
        ) : mangas.length === 0 ? (
          <div className="scroller-empty-state">
            <span>No titles found in this list.</span>
          </div>
        ) : (
          <div 
            ref={scrollerRef} 
            className="horizontal-scroller-track"
          >
            {mangas.map((manga, index) => (
              <div 
                key={`${manga.id}-${index}`} 
                className="scroller-card-container animate-stagger-item"
                style={{ animationDelay: `${(index % 10) * 40}ms` }}
              >
                <MangaCard manga={manga} />
              </div>
            ))}

            {/* Loading trigger at the end */}
            {hasNextPage && (
              <div ref={loaderRef} className="scroller-loader-container">
                {isFetchingNextPage ? (
                  <div className="scroller-spinner animate-spin-custom" />
                ) : (
                  <span className="scroller-load-more-text">Scroll to load more</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default HorizontalScroller;
