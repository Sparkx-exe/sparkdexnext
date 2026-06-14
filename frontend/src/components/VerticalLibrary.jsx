import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { getMangaList } from '../api/mangadex';
import MangaCard from './MangaCard';
import { SkeletonCard } from './SkeletonCard';
import { useSettingsStore } from '../store/settings';

export const VerticalLibrary = () => {
  const loaderRef = useRef(null);
  const { filters } = useSettingsStore();

  // Map settings filters to MangaDex API parameters
  const getApiParams = () => {
    const params = {
      limit: 20,
      'contentRating[]': filters.contentRating,
    };

    if (filters.status && filters.status.length > 0) {
      params['status[]'] = filters.status;
    }
    
    if (filters.demographic && filters.demographic.length > 0) {
      params['publicationDemographic[]'] = filters.demographic;
    }

    if (filters.sortBy) {
      const orderKey = `order[${filters.sortBy}]`;
      params[orderKey] = filters.sortOrder || 'desc';
    }

    if (filters.includedTags && filters.includedTags.length > 0) {
      params['includedTags[]'] = filters.includedTags;
    }

    if (filters.excludedTags && filters.excludedTags.length > 0) {
      params['excludedTags[]'] = filters.excludedTags;
    }

    if (filters.languages && filters.languages.length > 0) {
      params['availableTranslatedLanguage[]'] = filters.languages;
    }

    return params;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['verticalLibrary', filters],
    queryFn: ({ pageParam = 0 }) => getMangaList({ ...getApiParams(), offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const currentOffset = allPages.length * 20;
      return currentOffset < total ? currentOffset : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mangas = data?.pages.flatMap((page) => page.data || []) || [];

  // Observe intersection for page loading
  useEffect(() => {
    if (!hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '0px 0px 300px 0px', // Fetch when 300px away from bottom
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

  return (
    <div className="vertical-library-container">
      <div className="section-heading-wrapper">
        <h3 className="section-title">Discover Manga</h3>
      </div>

      {isLoading ? (
        <div className="manga-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Failed to Load Library</h3>
          <p>We couldn't connect to the server. Please try refreshing.</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      ) : mangas.length === 0 ? (
        <div className="empty-state">
          <h3>No Manga Found</h3>
          <p>Try clearing or modifying your active search filters.</p>
        </div>
      ) : (
        <>
          <div className="manga-grid">
            {mangas.map((manga, index) => (
              <MangaCard key={`${manga.id}-${index}`} manga={manga} />
            ))}
          </div>

          {/* Loader Element */}
          {hasNextPage && (
            <div ref={loaderRef} className="library-loader-container">
              {isFetchingNextPage ? (
                <div className="scroller-spinner animate-spin-custom" />
              ) : (
                <span className="load-more-prompt">Scroll down to load more</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VerticalLibrary;
