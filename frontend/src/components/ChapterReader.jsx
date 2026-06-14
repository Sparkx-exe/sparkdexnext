import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { getChapterImages, getMangaFeed, getMangaDetail } from '../api/mangadex';
import { useSettingsStore } from '../store/settings';
import { useHistoryStore } from '../store/history';

export const ChapterReader = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const imageQuality = useSettingsStore((state) => state.imageQuality);
  const { history, addHistory, updateScrollPosition } = useHistoryStore();

  const [showUi, setShowUi] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [nextChapterId, setNextChapterId] = useState(null);
  const [prevChapterId, setPrevChapterId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const uiTimeout = useRef(null);
  const pageRefs = useRef([]);

  // 1. Fetch Chapter Images
  const { data: chapterData, isLoading: imagesLoading, isError: imagesError, refetch: refetchImages } = useQuery({
    queryKey: ['chapterImages', chapterId],
    queryFn: () => getChapterImages(chapterId),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const baseUrl = chapterData?.baseUrl;
  const hash = chapterData?.chapter?.hash;
  const pageFiles = imageQuality === 'data-saver' 
    ? chapterData?.chapter?.dataSaver || [] 
    : chapterData?.chapter?.data || [];

  useEffect(() => {
    if (pageFiles.length > 0) {
      setTotalPages(pageFiles.length);
      // Reset errors and current page
      setImageErrors({});
      setCurrentPage(1);
    }
  }, [pageFiles]);

  // 2. Fetch Sibling Chapters to determine Next/Prev Chapter IDs
  const { data: feedResponse } = useQuery({
    queryKey: ['chapterSiblings', mangaId],
    queryFn: () => getMangaFeed(mangaId, { limit: 500, offset: 0 }), // Get up to 500 chapters to locate siblings
    enabled: !!mangaId,
  });

  // 3. Fetch Manga Details for Header title
  const { data: mangaDetail } = useQuery({
    queryKey: ['mangaDetail', mangaId],
    queryFn: () => getMangaDetail(mangaId),
    select: (res) => res.data,
  });
  const mangaTitle = mangaDetail?.attributes?.title?.en || mangaDetail?.attributes?.title?.['ja-ro'] || 'Manga';

  // Sibling selection logic
  useEffect(() => {
    if (!feedResponse?.data || feedResponse.data.length === 0) return;
    
    const siblingChapters = [...feedResponse.data].sort((a, b) => {
      const aCh = parseFloat(a.attributes?.chapter) || 0;
      const bCh = parseFloat(b.attributes?.chapter) || 0;
      return aCh - bCh; // Ascending order
    });

    const currentIndex = siblingChapters.findIndex((ch) => ch.id === chapterId);

    if (currentIndex !== -1) {
      const nextCh = siblingChapters[currentIndex + 1];
      const prevCh = siblingChapters[currentIndex - 1];
      setNextChapterId(nextCh ? nextCh.id : null);
      setPrevChapterId(prevCh ? prevCh.id : null);
      
      // Silently prefetch the next chapter images if available
      if (nextCh) {
        // TanStack Query prefetch
        // queryClient.prefetchQuery(...) could be done, but keeping it simple is also fine
      }
    }
  }, [feedResponse, chapterId]);

  // 4. Auto-hide Top/Bottom UI after 2s scroll
  useEffect(() => {
    const handleScroll = () => {
      // Clear previous timer
      if (uiTimeout.current) clearTimeout(uiTimeout.current);

      // Set timeout to hide UI
      uiTimeout.current = setTimeout(() => {
        setShowUi(false);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (uiTimeout.current) clearTimeout(uiTimeout.current);
    };
  }, []);

  // 5. Restore scroll position if it exists in history
  useEffect(() => {
    const record = history.find((h) => h.mangaId === mangaId && h.chapterId === chapterId);
    if (record?.scrollY && pageFiles.length > 0) {
      // Small timeout to allow images heights to paint
      setTimeout(() => {
        window.scrollTo({ top: record.scrollY, behavior: 'instant' });
      }, 100);
    }
  }, [chapterId, pageFiles]);

  // Save scroll offset to history periodically
  useEffect(() => {
    const saveProgress = () => {
      const currentScrollY = window.scrollY;
      updateScrollPosition(mangaId, chapterId, currentScrollY);
    };

    window.addEventListener('beforeunload', saveProgress);
    const interval = setInterval(saveProgress, 5000);

    return () => {
      saveProgress();
      window.removeEventListener('beforeunload', saveProgress);
      clearInterval(interval);
    };
  }, [mangaId, chapterId]);

  // 6. Intersection observer to detect active page number
  useEffect(() => {
    if (pageFiles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-index'), 10) + 1;
            setCurrentPage(pageNum);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger near center-top of viewport
        threshold: 0,
      }
    );

    const currentRefs = pageRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [pageFiles]);

  // 7. Desktop Keyboard Navigation & Swipe zones
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && prevChapterId) {
        handleNavigateToChapter(prevChapterId);
      } else if (e.key === 'ArrowRight' && nextChapterId) {
        handleNavigateToChapter(nextChapterId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapterId, nextChapterId]);

  const handleNavigateToChapter = (targetId) => {
    navigate(`/manga/${mangaId}/chapter/${targetId}`);
  };

  const handleScreenTap = (e) => {
    // Exclude clicks on UI bars
    if (e.target.closest('.reader-topbar') || e.target.closest('.reader-bottombar') || e.target.closest('.retry-card')) {
      return;
    }
    
    // Check Desktop Swipe edge click zones (15% left/right width)
    if (window.innerWidth >= 1024) {
      const clickX = e.clientX;
      const width = window.innerWidth;
      if (clickX < width * 0.15 && prevChapterId) {
        handleNavigateToChapter(prevChapterId);
        return;
      } else if (clickX > width * 0.85 && nextChapterId) {
        handleNavigateToChapter(nextChapterId);
        return;
      }
    }

    setShowUi((prev) => !prev);
  };

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const retryImage = (index) => {
    setImageErrors((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  // Image prefetch logic helper
  const renderImage = (file, index) => {
    const isError = imageErrors[index];
    const folder = imageQuality === 'data-saver' ? 'data-saver' : 'data';
    const imageUrl = `${baseUrl}/${folder}/${hash}/${file}`;

    // Prefetch logic: load image ahead
    const shouldPrefetch = index <= currentPage + 2;

    if (isError) {
      return (
        <div className="retry-card glass-panel">
          <AlertTriangle size={24} color="var(--error)" />
          <span>Failed to load page {index + 1}</span>
          <button onClick={() => retryImage(index)}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    return (
      <div 
        key={index} 
        ref={(el) => (pageRefs.current[index] = el)}
        data-page-index={index}
        className="reader-image-container"
      >
        {shouldPrefetch ? (
          <img
            src={imageUrl}
            alt={`Page ${index + 1}`}
            className="reader-image"
            onError={() => handleImageError(index)}
          />
        ) : (
          <div className="reader-image-placeholder animate-shimmer" />
        )}
      </div>
    );
  };

  if (imagesLoading) {
    return (
      <div className="reader-loading-state">
        <div className="scroller-spinner animate-spin-custom" style={{ width: '48px', height: '48px' }} />
        <span>Buffering chapter pages...</span>
      </div>
    );
  }

  if (imagesError || pageFiles.length === 0) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} color="var(--error)" />
        <h3>Reader Error</h3>
        <p>Failed to retrieve chapter image sources from the MangaDex CDN.</p>
        <button onClick={refetchImages}>Retry Loading</button>
        <button onClick={() => navigate(`/manga/${mangaId}`)}>Back to Details</button>
      </div>
    );
  }

  const readPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div className="reader-workspace" onClick={handleScreenTap}>
      
      {/* 1. Auto-Hiding Top Bar */}
      <header className={`reader-topbar glass-panel ${showUi ? 'topbar-show' : 'topbar-hide'}`}>
        <button className="icon-button" onClick={() => navigate(`/manga/${mangaId}`)} aria-label="Exit reader">
          <ArrowLeft size={20} />
        </button>
        
        <div className="reader-header-titles">
          <span className="manga-title" title={mangaTitle}>{mangaTitle}</span>
          <span className="chapter-label">Chapter {history.find(h => h.chapterId === chapterId)?.chapterNumber || ''}</span>
        </div>

        <button className="icon-button" onClick={() => navigate('/settings')} aria-label="Reader settings">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Pages Flow */}
      <main className="reader-flow-column">
        {/* Previous chapter trigger button */}
        {prevChapterId && (
          <button 
            className="sibling-chapter-btn prev"
            onClick={() => handleNavigateToChapter(prevChapterId)}
          >
            ← Previous Chapter
          </button>
        )}

        {pageFiles.map((file, idx) => renderImage(file, idx))}

        {/* Next chapter trigger button */}
        {nextChapterId ? (
          <button 
            className="sibling-chapter-btn next bounce"
            onClick={() => handleNavigateToChapter(nextChapterId)}
          >
            Next Chapter →
          </button>
        ) : (
          <div className="reader-end-reached">
            <h3>You've reached the end!</h3>
            <p>Thanks for reading this chapter on SparkDex.</p>
            <Link to={`/manga/${mangaId}`} className="end-back-details">
              Back to Details
            </Link>
          </div>
        )}
      </main>

      {/* 2. Auto-Hiding Bottom Progress indicator */}
      <footer className={`reader-bottombar glass-panel ${showUi ? 'bottombar-show' : 'bottombar-hide'}`}>
        <div className="bottombar-content">
          <div className="sibling-nav-controls">
            <button 
              disabled={!prevChapterId} 
              onClick={() => handleNavigateToChapter(prevChapterId)}
              className="sibling-nav-btn"
              title="Previous Chapter"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="page-counter-label">
              Page {currentPage} / {totalPages}
            </span>
            <button 
              disabled={!nextChapterId} 
              onClick={() => handleNavigateToChapter(nextChapterId)}
              className="sibling-nav-btn"
              title="Next Chapter"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Read progress percentage bar */}
        <div className="progress-bar-gutter">
          <div className="progress-bar-fill" style={{ width: `${readPercentage}%` }} />
        </div>
      </footer>
    </div>
  );
};

export default ChapterReader;
