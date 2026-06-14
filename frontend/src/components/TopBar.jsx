import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, SlidersHorizontal, X, LayoutGrid } from 'lucide-react';
import { useSettingsStore } from '../store/settings';

export const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isSidePanelOpen,
    setSidePanelOpen,
    isFilterDrawerOpen,
    setFilterDrawerOpen,
    getActiveFiltersCount
  } = useSettingsStore();

  const [isCompressed, setIsCompressed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  const activeFiltersCount = getActiveFiltersCount();

  // Compress topbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsCompressed(true);
      } else {
        setIsCompressed(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update query when location changes (if navigating search query)
  useEffect(() => {
    if (location.pathname === '/search') {
      const searchParams = new URLSearchParams(location.search);
      const q = searchParams.get('q') || '';
      setSearchQuery(q);
      if (q) setIsSearchExpanded(true);
    } else {
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  }, [location]);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    // If we're already on /search page, update URL in real time
    if (location.pathname === '/search') {
      navigate(`/search?q=${encodeURIComponent(val)}`, { replace: true });
    }
  };

  const toggleSearch = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      setSearchQuery('');
      if (location.pathname === '/search') {
        navigate('/');
      }
    } else {
      setIsSearchExpanded(true);
      if (location.pathname !== '/search') {
        navigate('/search');
      }
    }
  };

  return (
    <>
      <header className={`topbar glass-panel ${isCompressed ? 'compressed' : ''} ${!isSidePanelOpen ? 'panel-collapsed' : ''}`}>
        <div className="topbar-left">
          <div className="logo-container logo-wordmark" onClick={() => navigate('/')}>
          {/* Lightning bolt icon */}
          <svg
            className="logo-bolt-icon"
            width="22" height="28"
            viewBox="0 0 22 28"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="boltGrad" x1="0%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FFB347" />
                <stop offset="100%" stopColor="#FF5F1F" />
              </linearGradient>
              <filter id="boltGlow2">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              filter="url(#boltGlow2)"
              fill="url(#boltGrad)"
              d="M 15 1 L 4 14 L 10 14 L 7 27 L 20 12 L 13 12 Z"
            />
          </svg>

          {/* Wordmark text group */}
          <span className="logo-text-group">
            <span className="logo-spark">Spark</span><span className="logo-dex">Dex</span><span className="logo-next-badge">next</span>
          </span>
        </div>
        </div>

        <div className="topbar-right">
          {/* Full-width search bar expansion */}
          <form
            className={`topbar-search-form ${isSearchExpanded ? 'expanded' : ''}`}
            onSubmit={handleSearchSubmit}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search manga, authors, artists..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </form>

          <button
            className={`icon-button categories-nav-btn ${location.pathname === '/categories' ? 'active' : ''}`}
            onClick={() => navigate('/categories')}
            aria-label="Browse categories"
          >
            <LayoutGrid size={22} />
          </button>

          <button
            className={`icon-button search-toggle-btn ${isSearchExpanded ? 'active' : ''}`}
            onClick={toggleSearch}
            aria-label="Search manga"
          >
            {isSearchExpanded ? <X size={22} /> : <Search size={22} />}
          </button>

          <button
            className={`icon-button filter-toggle-btn ${isFilterDrawerOpen ? 'active' : ''}`}
            onClick={() => setFilterDrawerOpen(!isFilterDrawerOpen)}
            aria-label="Filter settings"
          >
            <SlidersHorizontal size={22} />
            {activeFiltersCount > 0 && (
              <span className="filter-badge animate-heartbeat">{activeFiltersCount}</span>
            )}
          </button>

          <button
            className={`icon-button hamburger-btn ${isSidePanelOpen ? 'panel-open' : ''}`}
            onClick={() => setSidePanelOpen(!isSidePanelOpen)}
            aria-label="Toggle Navigation Side Panel"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
    </>
  );
};

export default TopBar;
