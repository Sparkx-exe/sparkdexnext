import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, SlidersHorizontal, AlertCircle, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { getMangaList } from '../api/mangadex';
import MangaCard from './MangaCard';
import { SkeletonCard } from './SkeletonCard';
import { useSettingsStore } from '../store/settings';

const RECENT_SEARCHES_KEY = 'sparkdex_recent_searches';

export const SearchModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, setFilterDrawerOpen } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Update query states when URL change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('q') || '';
    setQuery(q);
    setDebouncedQuery(q);
  }, [location.search]);

  // Debounce query
  useEffect(() => {
    if (query === '') {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      
      // Save search term to recents (deduplicated)
      if (query.trim().length > 1) {
        setRecentSearches((prev) => {
          const filtered = prev.filter((s) => s.toLowerCase() !== query.trim().toLowerCase());
          const updated = [query.trim(), ...filtered].slice(0, 10);
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results from MangaDex using React Query
  const { data: searchResults, isLoading, isError, refetch } = useQuery({
    queryKey: ['mangaSearch', debouncedQuery, filters],
    queryFn: () => {
      if (!debouncedQuery) return Promise.resolve({ data: [] });
      
      const apiParams = {
        title: debouncedQuery,
        limit: 20,
        'contentRating[]': filters.contentRating,
      };

      if (filters.status && filters.status.length > 0) {
        apiParams['status[]'] = filters.status;
      }
      
      if (filters.demographic && filters.demographic.length > 0) {
        apiParams['publicationDemographic[]'] = filters.demographic;
      }

      if (filters.sortBy) {
        const orderKey = `order[${filters.sortBy}]`;
        apiParams[orderKey] = filters.sortOrder || 'desc';
      }

      if (filters.includedTags && filters.includedTags.length > 0) {
        apiParams['includedTags[]'] = filters.includedTags;
      }

      if (filters.excludedTags && filters.excludedTags.length > 0) {
        apiParams['excludedTags[]'] = filters.excludedTags;
      }

      return getMangaList(apiParams);
    },
    enabled: !!debouncedQuery,
    select: (res) => res.data || [],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const handleRecentClick = (term) => {
    setQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleClearRecents = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val) {
      navigate('/search', { replace: true });
    } else {
      navigate(`/search?q=${encodeURIComponent(val)}`, { replace: true });
    }
  };

  return (
    <div className="search-page-container">
      {/* Search Input Gutter */}
      <div className="search-input-wrapper glass-panel">
        <button className="icon-button back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <ArrowLeft size={20} />
        </button>
        
        <div className="search-input-field-container">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            placeholder="Type to search manga, authors, scanlators..."
            value={query}
            onChange={handleInputChange}
            className="search-main-input"
            autoFocus
          />
          {query && (
            <button className="search-clear-main-btn" onClick={() => handleInputChange({ target: { value: '' } })}>
              <X size={18} />
            </button>
          )}
        </div>

        <button 
          className="icon-button search-filter-btn" 
          onClick={() => setFilterDrawerOpen(true)}
          aria-label="Filter results"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Main Body */}
      <div className="search-body-content">
        {/* Recents Overlay when input is empty */}
        {!debouncedQuery && (
          <div className="recent-searches-container">
            {recentSearches.length > 0 ? (
              <>
                <div className="recent-searches-header">
                  <div className="title">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                  <button className="clear-btn" onClick={handleClearRecents}>Clear All</button>
                </div>
                <div className="recent-chips">
                  {recentSearches.map((term) => (
                    <button 
                      key={term} 
                      className="recent-chip"
                      onClick={() => handleRecentClick(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="search-empty-start">
                <Sparkles size={32} />
                <h3>Find your next favorite story</h3>
                <p>Type in titles, genres, authors, or use advanced filters to explore the library.</p>
              </div>
            )}
          </div>
        )}

        {/* Loading and Results */}
        {debouncedQuery && (
          <>
            {isLoading ? (
              <div className="manga-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <h3>Search Error</h3>
                <p>Failed to get results from MangaDex. Please try again.</p>
                <button onClick={() => refetch()}>Retry</button>
              </div>
            ) : searchResults?.length === 0 ? (
              <div className="empty-state">
                <div className="mascot-spark">
                  {/* Styled spark icon mascot */}
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="var(--accent-primary)" stroke="var(--accent-glow)" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3>No Manga Found</h3>
                <p>We couldn't find any results matching "{debouncedQuery}". Try adjusting your query or filter configurations.</p>
              </div>
            ) : (
              <div className="search-results-wrapper">
                <h4 className="results-subtitle">Results for "{debouncedQuery}"</h4>
                <div className="manga-grid">
                  {searchResults.map((manga, index) => (
                    <MangaCard key={`${manga.id}-${index}`} manga={manga} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
