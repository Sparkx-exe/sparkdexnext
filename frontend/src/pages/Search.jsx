import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SkeletonGrid } from '../components/SkeletonLoader';
import MangaCard from '../components/MangaCard';
import { Search as SearchIcon, Filter, X, SlidersHorizontal } from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 24;

  useEffect(() => {
    document.title = 'Search Manga — Sparkdex';
  }, []);

  // Fetch all genre tags on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoadingGenres(true);
        const res = await fetch('/api/manga/tag');
        if (!res.ok) throw new Error('Failed to fetch tags');
        const data = await res.json();
        
        // Filter tags to only include genres (attributes.group === 'genre')
        const genres = (data.data || [])
          .filter((tag) => tag.attributes?.group === 'genre')
          .map((tag) => ({
            id: tag.id,
            name: tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0] || 'Unknown',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
          
        setAllGenres(genres);
      } catch (err) {
        console.error('Error fetching genres:', err);
      } finally {
        setLoadingGenres(false);
      }
    };
    fetchGenres();
  }, []);

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setOffset(0); // Reset offset on query change
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch manga list based on query and filters
  const fetchManga = useCallback(async (currentOffset = 0, append = false) => {
    try {
      setLoading(true);
      let url = `/api/manga?limit=${LIMIT}&offset=${currentOffset}&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive`;

      if (debouncedQuery.trim()) {
        url += `&title=${encodeURIComponent(debouncedQuery)}`;
      }

      // Add status filters
      if (status.length > 0) {
        status.forEach((st) => {
          url += `&status[]=${st}`;
        });
      }

      // Add genre tag filters
      if (selectedGenres.length > 0) {
        selectedGenres.forEach((genreId) => {
          url += `&includedTags[]=${genreId}`;
        });
        url += '&includedTagsMode=and';
      }

      // Order by followedCount desc for search list
      url += '&order[followedCount]=desc';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to search manga');
      const data = await res.json();
      
      const newManga = data.data || [];
      if (append) {
        setMangaList((prev) => [...prev, ...newManga]);
      } else {
        setMangaList(newManga);
      }
      
      // Determine if there is more data
      setHasMore(newManga.length === LIMIT);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, selectedGenres]);

  // Trigger search on filter changes or debounced query
  useEffect(() => {
    fetchManga(0, false);
  }, [fetchManga]);

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchManga(nextOffset, true);
  }, [offset, fetchManga, loading, hasMore]);

  // Set up intersection observer using callback ref to handle conditional rendering
  const observerRef = useRef(null);
  const loadMoreRef = useRef(handleLoadMore);
  
  useEffect(() => {
    loadMoreRef.current = handleLoadMore;
  }, [handleLoadMore]);

  const observerTargetRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreRef.current();
          }
        },
        { threshold: 0.1, rootMargin: '300px' }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const toggleStatus = (st) => {
    setStatus((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
    setOffset(0);
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
    setOffset(0);
  };

  const clearFilters = () => {
    setStatus([]);
    setSelectedGenres([]);
    setQuery('');
    setOffset(0);
  };

  const statusOptions = ['ongoing', 'completed', 'hiatus', 'cancelled'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header and Search Box */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-day-muted dark:text-night-muted" />
          <input
            type="text"
            placeholder="Search manga by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-day-border dark:border-night-border bg-day-card dark:bg-night-card text-day-text dark:text-night-text focus:outline-none focus:ring-2 focus:ring-day-accent/40 dark:focus:ring-night-accent/40 transition-all text-sm shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-day-muted dark:text-night-muted hover:text-day-text dark:hover:text-night-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg border text-sm font-semibold transition-all ${
            showFilters || status.length > 0 || selectedGenres.length > 0
              ? 'bg-day-accent/15 border-day-accent text-day-accent dark:bg-night-accent/15 dark:border-night-accent dark:text-night-accent'
              : 'border-day-border dark:border-night-border bg-day-card dark:bg-night-card text-day-text dark:text-night-text hover:bg-day-bg dark:hover:bg-night-bg'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters {(status.length + selectedGenres.length) > 0 && `(${(status.length + selectedGenres.length)})`}</span>
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 bg-day-card dark:bg-night-card rounded-xl border border-day-border dark:border-night-border space-y-6 animate-fade-in shadow-md">
          {/* Status Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-day-muted dark:text-night-muted">Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((st) => {
                const active = status.includes(st);
                return (
                  <button
                    key={st}
                    onClick={() => toggleStatus(st)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium uppercase tracking-wider transition-all ${
                      active
                        ? 'bg-day-accent border-day-accent text-white dark:bg-night-accent dark:border-night-accent'
                        : 'border-day-border dark:border-night-border text-day-muted dark:text-night-muted hover:bg-day-bg dark:hover:bg-night-bg'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genre Tags Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-day-muted dark:text-night-muted">Genres</h3>
            {loadingGenres ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="h-7 w-20 bg-day-border/40 dark:bg-night-border/40 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2">
                {allGenres.map((genre) => {
                  const active = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                        active
                          ? 'bg-day-accent border-day-accent text-white dark:bg-night-accent dark:border-night-accent'
                          : 'border-day-border dark:border-night-border text-day-muted dark:text-night-muted hover:bg-day-bg dark:hover:bg-night-bg'
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(status.length > 0 || selectedGenres.length > 0 || query) && (
            <div className="flex justify-end pt-2 border-t border-day-border dark:border-night-border">
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded hover:bg-red-500/10 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {mangaList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {mangaList.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonGrid key={`skeleton-${i}`} count={1} />
              ))}
            </div>
            
            {/* Infinite Scroll Anchor target */}
            <div ref={observerTargetRef} className="h-20 flex items-center justify-center pt-4">
              {hasMore && loading && (
                <div className="w-8 h-8 border-4 border-t-transparent border-day-accent dark:border-night-accent rounded-full animate-spin" />
              )}
            </div>
          </>
        ) : loading ? (
          <SkeletonGrid count={12} />
        ) : (
          <div className="text-center py-16 bg-day-card dark:bg-night-card border border-day-border dark:border-night-border rounded-xl">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 text-day-muted dark:text-night-muted opacity-60" />
            <h3 className="text-lg font-bold text-day-text dark:text-night-text">No manga found</h3>
            <p className="text-sm text-day-muted dark:text-night-muted max-w-xs mx-auto mt-1">
              Try adjusting your query or tags to discover more series.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
