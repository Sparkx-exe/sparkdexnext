import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Heart, BookOpen, User, Calendar, Bookmark, ChevronDown, ChevronUp, ArrowUpDown, Search, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { 
  getMangaDetail, 
  getMangaFeed, 
  getMangaCoverUrl, 
  getMangaTitle, 
  getMangaAltTitle, 
  getMangaAuthor, 
  getMangaArtist, 
  getMangaDescription 
} from '../api/mangadex';
import { useSettingsStore } from '../store/settings';
import { useFavouritesStore } from '../store/favourites';
import { useHistoryStore } from '../store/history';
import { SkeletonCard } from './SkeletonCard';

export const MangaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const loaderRef = useRef(null);

  const titleLanguage = useSettingsStore((state) => state.titleLanguage);
  const { isFavourite, addFavourite, removeFavourite } = useFavouritesStore();
  const { history, addHistory } = useHistoryStore();

  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [chapterSearch, setChapterSearch] = useState('');
  const [heartbeatActive, setHeartbeatActive] = useState(false);

  // 1. Fetch Manga Details
  const { data: manga, isLoading: mangaLoading, isError: mangaError } = useQuery({
    queryKey: ['mangaDetail', id],
    queryFn: () => getMangaDetail(id),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const availableLanguages = manga?.attributes?.availableTranslatedLanguages || ['en'];

  // Initialize selected language to English if available, else 'all'
  useEffect(() => {
    if (availableLanguages.length > 0) {
      if (availableLanguages.includes('en')) {
        setSelectedLanguage('en');
      } else {
        setSelectedLanguage(availableLanguages[0]);
      }
    }
  }, [manga]);

  // 2. Fetch Chapters (Infinite Scroll Feed)
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
    isError: feedError,
  } = useInfiniteQuery({
    queryKey: ['mangaChapters', id, selectedLanguage, sortOrder],
    queryFn: ({ pageParam = 0 }) => getMangaFeed(id, {
      offset: pageParam,
      limit: 100,
      // 'all' sentinel tells the API client to skip language filtering
      languages: selectedLanguage === 'all' ? ['all'] : [selectedLanguage],
      order: sortOrder
    }),
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const currentOffset = allPages.length * 100;
      return currentOffset < total ? currentOffset : undefined;
    },
    initialPageParam: 0,
    enabled: !!manga && !!selectedLanguage,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const chapters = feedData?.pages.flatMap((page) => page.data || []) || [];
  const totalChaptersCount = feedData?.pages[0]?.total || 0;

  // Observe intersection for infinite chapter feed scrolling
  useEffect(() => {
    if (!hasNextPage || feedLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '0px 0px 400px 0px', threshold: 0.1 }
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
  }, [hasNextPage, feedLoading, isFetchingNextPage, fetchNextPage]);

  if (mangaLoading) {
    return (
      <div className="detail-loading-container animate-shimmer">
        <div className="skeleton-detail-hero" />
      </div>
    );
  }

  if (mangaError || !manga) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} />
        <h3>Failed to load manga details</h3>
        <p>This manga might have been removed or the server is unresponsive.</p>
        <button onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const title = getMangaTitle(manga, titleLanguage);
  const altTitle = getMangaAltTitle(manga);
  const author = getMangaAuthor(manga);
  const artist = getMangaArtist(manga);
  const description = getMangaDescription(manga);
  const coverUrl = getMangaCoverUrl(manga, '256'); // blurred backdrop — 256 is fine
  const cardCoverUrl = getMangaCoverUrl(manga, '512');
  
  const status = manga.attributes?.status || 'unknown';
  const contentRating = manga.attributes?.contentRating || 'safe';
  
  const tags = manga.attributes?.tags || [];

  const handleToggleFavourite = () => {
    setHeartbeatActive(true);
    setTimeout(() => setHeartbeatActive(false), 400);

    if (isFavourite(manga.id)) {
      removeFavourite(manga.id);
    } else {
      addFavourite(manga.id);
    }
  };

  // Filter chapters locally based on search jump input
  const filteredChapters = chapters.filter((ch) => {
    if (!chapterSearch) return true;
    const num = ch.attributes?.chapter || '';
    const name = ch.attributes?.title || '';
    return num.includes(chapterSearch) || name.toLowerCase().includes(chapterSearch.toLowerCase());
  });

  // Check if a chapter is read in history
  const isChapterRead = (chapterId) => {
    return history.some((item) => item.mangaId === id && item.chapterId === chapterId);
  };

  const handleChapterClick = (chapter) => {
    // Add to history store
    addHistory({
      mangaId: id,
      mangaTitle: title,
      coverUrl: getMangaCoverUrl(manga, '256') || '',
      chapterId: chapter.id,
      chapterNumber: chapter.attributes?.chapter || '0',
      chapterTitle: chapter.attributes?.title || '',
      scrollY: 0
    });
    
    navigate(`/manga/${id}/chapter/${chapter.id}`);
  };

  return (
    <div className="detail-page-wrapper">
      {/* Blurred Hero Background Cover */}
      <div 
        className="detail-hero-backdrop" 
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      <div className="detail-hero-scrim" />

      {/* Hero Content Panel */}
      <div className="detail-hero-content">
        <div className="detail-cover-wrapper">
          <img 
            src={cardCoverUrl} 
            alt={title} 
            className="detail-cover-img"
            decoding="async"
            loading="eager"
            fetchpriority="high"
          />
        </div>

        <div className="detail-info-pane">
          <h1 className="detail-title">{title}</h1>
          {altTitle && <h3 className="detail-alt-title">{altTitle}</h3>}

          <div className="detail-creators">
            <span className="creator-tag"><User size={12} /> {author}</span>
            {artist !== author && <span className="creator-tag"><User size={12} /> {artist}</span>}
          </div>

          <div className="detail-badges">
            <span className={`badge badge-${status}`}>{status}</span>
            <span className={`badge rating-${contentRating}`}>{contentRating}</span>
            <span className="detail-meta-item"><Bookmark size={12} /> Popular</span>
          </div>

          <button 
            className={`detail-fav-btn ${isFavourite(manga.id) ? 'active' : ''} ${heartbeatActive ? 'animate-heartbeat' : ''}`}
            onClick={handleToggleFavourite}
          >
            <Heart size={18} fill={isFavourite(manga.id) ? 'currentColor' : 'none'} />
            <span>{isFavourite(manga.id) ? 'Saved' : 'Add to Favourites'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="detail-main-layout">
        {/* Left/Middle Pane */}
        <div className="detail-content-left">
          {/* Genre Tags */}
          <div className="detail-tags-row">
            {tags.map((tag) => {
              const name = tag.attributes?.name?.en;
              return (
                <button 
                  key={tag.id} 
                  className="detail-tag-pill tag-ripple"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(name)}`)}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Collapsible Description */}
          <div className="detail-description-box">
            <h4 className="detail-pane-title">Synopsis</h4>
            <div className={`detail-description-text ${descExpanded ? 'expanded' : ''}`}>
              <p>{description || 'No description available for this title.'}</p>
            </div>
            {description && description.length > 200 && (
              <button 
                className="description-expand-btn"
                onClick={() => setDescExpanded(!descExpanded)}
              >
                <span>{descExpanded ? 'Show Less' : 'Show More'}</span>
                {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Chapter Feed Controls */}
          <div className="detail-chapters-section">
            <div className="chapter-header-bar">
              <h4 className="detail-pane-title">
                Chapters ({totalChaptersCount})
              </h4>
              
              <div className="chapter-filters-row">
                {/* Language Select */}
                <div className="lang-select-wrapper">
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="chapter-lang-select"
                  >
                    {/* All Languages option */}
                    <option value="all">🌐 All Languages</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order Button */}
                <button 
                  className="chapter-sort-btn"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  aria-label="Sort chapters order"
                >
                  <ArrowUpDown size={16} />
                  <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>
            </div>

            {/* Chapter Jump Input for long lists (500+ chapters) */}
            {totalChaptersCount >= 50 && (
              <div className="chapter-search-box">
                <Search size={14} className="chapter-search-icon" />
                <input
                  type="text"
                  placeholder="Jump to chapter number or search name..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="chapter-search-input"
                />
                {chapterSearch && (
                  <button className="chapter-search-clear" onClick={() => setChapterSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Chapters Feed Rows */}
            {feedLoading ? (
              <div className="chapters-feed-loading animate-shimmer" />
            ) : feedError ? (
              <div className="chapters-feed-error">
                <AlertCircle size={20} />
                <span>Failed to load chapters list.</span>
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="chapters-empty-state">
                <span>No chapters available for the selected filters.</span>
              </div>
            ) : (
              <div className="chapters-list-track">
                {filteredChapters.map((chapter) => {
                  const num = chapter.attributes?.chapter;
                  const name = chapter.attributes?.title;
                  const group = chapter.relationships?.find((r) => r.type === 'scanlation_group')?.attributes?.name || 'No Group';
                  const dateStr = new Date(chapter.attributes?.publishAt).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  const read = isChapterRead(chapter.id);

                  return (
                    <div 
                      key={chapter.id} 
                      className={`chapter-row-item tap-scale ${read ? 'read' : ''}`}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <div className="chapter-row-left">
                        {/* Read/Unread dot indicator */}
                        <span className={`chapter-read-dot ${read ? 'read' : 'unread'}`} />
                        
                        <div className="chapter-row-title-block">
                          <span className="chapter-number-label">
                            Ch. {num || '?'}
                          </span>
                          {name && <span className="chapter-title-label">{name}</span>}
                        </div>
                      </div>

                      <div className="chapter-row-right">
                        <span className="chapter-group-label">{group}</span>
                        <span className="chapter-date-label">{dateStr}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Chapter Feed Loading indicator */}
                {hasNextPage && (
                  <div ref={loaderRef} className="chapter-feed-loader">
                    {isFetchingNextPage ? (
                      <div className="scroller-spinner animate-spin-custom" />
                    ) : (
                      <span className="load-more-prompt">Scroll to load more chapters</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetailPage;
