import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutList, BookOpen, Settings, Sliders, ArrowLeft, RotateCcw } from 'lucide-react';

const Reader = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [chapterInfo, setChapterInfo] = useState(null);
  const [mangaId, setMangaId] = useState(location.state?.mangaId || null);
  const [mangaTitle, setMangaTitle] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reader Settings
  const [readMode, setReadMode] = useState(() => {
    return localStorage.getItem('sparkdexReadMode') || 'vertical'; // 'vertical' or 'horizontal'
  });
  
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);

  // Save read mode preference
  useEffect(() => {
    localStorage.setItem('sparkdexReadMode', readMode);
  }, [readMode]);

  // Step 1: Fetch current chapter details to resolve mangaId if not in state
  const fetchChapterDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chapter details
      const chRes = await fetch(`/api/chapter/${chapterId}?includes[]=manga`);
      if (!chRes.ok) throw new Error('Failed to fetch chapter details');
      const chData = await chRes.json();
      
      const chapterObj = chData.data;
      if (!chapterObj) throw new Error('Chapter not found');
      
      setChapterInfo(chapterObj);
      
      // Resolve manga relation
      const mangaRelation = chapterObj.relationships?.find((r) => r.type === 'manga');
      if (mangaRelation && !mangaId) {
        setMangaId(mangaRelation.id);
        if (mangaRelation.attributes?.title) {
          setMangaTitle(
            mangaRelation.attributes.title.en || 
            Object.values(mangaRelation.attributes.title)[0]
          );
        }
      }

      // Fetch chapter page filenames and base server URL
      const pagesRes = await fetch(`/api/at-home/server/${chapterId}`);
      if (!pagesRes.ok) throw new Error('Failed to load chapter pages from server');
      const pagesData = await pagesRes.json();
      
      const baseUrl = pagesData.baseUrl;
      const hash = pagesData.chapter?.hash;
      const filenames = pagesData.chapter?.data || []; // original quality
      
      if (!baseUrl || !hash || filenames.length === 0) {
        throw new Error('No page images returned for this chapter');
      }

      // Construct absolute URLs
      const constructedPages = filenames.map(
        (file) => `${baseUrl}/data/${hash}/${file}`
      );
      
      setPages(constructedPages);
      setCurrentPage(1); // Reset page counter
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chapterId, mangaId]);

  useEffect(() => {
    fetchChapterDetails();
  }, [fetchChapterDetails]);

  // Step 2: Fetch other chapters of the manga for navigation dropdown
  useEffect(() => {
    if (!mangaId) return;

    const fetchMangaFeed = async () => {
      try {
        const feedRes = await fetch(
          `/api/manga/${mangaId}/feed?limit=500&translatedLanguage[]=en&order[chapter]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`
        );
        if (!feedRes.ok) throw new Error('Failed to fetch manga chapters');
        const feedData = await feedRes.json();
        const feedChapters = feedData.data || [];

        // Filter duplicates
        const uniqueChapters = [];
        const seenChapters = new Set();
        feedChapters.forEach((ch) => {
          const num = ch.attributes?.chapter;
          if (num !== null && num !== undefined) {
            if (!seenChapters.has(num)) {
              seenChapters.add(num);
              uniqueChapters.push(ch);
            }
          } else {
            uniqueChapters.push(ch);
          }
        });

        // Sort chronologically ascending for indexing, but dropdown shows descending
        // Let's keep unique list sorted ascending numerically for navigation logic,
        // and create a sorted copy for the dropdown.
        uniqueChapters.sort((a, b) => {
          const numA = parseFloat(a.attributes?.chapter || '0');
          const numB = parseFloat(b.attributes?.chapter || '0');
          return numA - numB; // Ascending
        });
        
        setChapters(uniqueChapters);

        // Fetch Manga Title if we don't have it
        if (!mangaTitle) {
          const mangaRes = await fetch(`/api/manga/${mangaId}`);
          const mangaData = await mangaRes.json();
          if (mangaData.data?.attributes?.title) {
            const titleObj = mangaData.data.attributes.title;
            setMangaTitle(titleObj.en || Object.values(titleObj)[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching chapter list:', err);
      }
    };

    fetchMangaFeed();
  }, [mangaId, mangaTitle]);

  // Step 3: Save last read chapter to localStorage
  useEffect(() => {
    if (mangaId && chapterInfo) {
      const chNum = chapterInfo.attributes?.chapter || '0';
      const readState = {
        chapterId: chapterInfo.id,
        chapterNumber: chNum,
        chapterTitle: chapterInfo.attributes?.title || '',
        timestamp: Date.now(),
      };
      localStorage.setItem(`mangaLastRead_${mangaId}`, JSON.stringify(readState));
    }
  }, [mangaId, chapterInfo]);

  // Update document title
  useEffect(() => {
    if (chapterInfo) {
      const num = chapterInfo.attributes?.chapter || '?';
      const title = chapterInfo.attributes?.title ? ` - ${chapterInfo.attributes.title}` : '';
      document.title = `Chapter ${num}${title} — Sparkdex`;
    }
  }, [chapterInfo]);

  // Determine Prev / Next Chapters
  const getNavChapters = () => {
    if (chapters.length === 0 || !chapterInfo) return { prev: null, next: null };
    
    // Find index of current chapter in the ascending list
    const currentIndex = chapters.findIndex((c) => c.id === chapterId);
    
    if (currentIndex === -1) return { prev: null, next: null };
    
    const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    
    return { prev, next };
  };

  const { prev: prevChapter, next: nextChapter } = getNavChapters();

  const handleChapterChange = (e) => {
    const nextId = e.target.value;
    if (nextId) {
      navigate(`/reader/${nextId}`, { state: { mangaId } });
    }
  };

  // Keyboard navigation for horizontal mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readMode !== 'horizontal' || loading) return;

      if (e.key === 'ArrowLeft') {
        // Prev page
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        // Next page
        e.preventDefault(); // stop space scroll
        if (currentPage < pages.length) {
          setCurrentPage((prev) => prev + 1);
        } else if (currentPage === pages.length && nextChapter) {
          // Go to next chapter if at end
          navigate(`/reader/${nextChapter.id}`, { state: { mangaId } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readMode, currentPage, pages.length, nextChapter, navigate, mangaId, loading]);

  // Scroll spy for vertical scroll progress using IntersectionObserver
  useEffect(() => {
    if (readMode !== 'vertical' || pages.length === 0 || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target);
            if (index !== -1) {
              setCurrentPage(index + 1);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
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
  }, [readMode, pages.length, loading]);

  // Scroll page to top on chapter change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-day-muted dark:text-night-muted">
        <div className="w-10 h-10 border-4 border-t-transparent border-day-accent dark:border-night-accent rounded-full animate-spin" />
        <span className="text-sm font-semibold animate-pulse">Loading Chapter Pages...</span>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Error Loading Chapter</h2>
        <p className="text-day-muted dark:text-night-muted">{error || 'Could not load chapter pages.'}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => fetchChapterDetails()}
            className="px-4 py-2 rounded-lg bg-day-accent dark:bg-night-accent text-white font-semibold text-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          {mangaId && (
            <Link
              to={`/manga/${mangaId}`}
              className="px-4 py-2 rounded-lg border border-day-border dark:border-night-border text-day-text dark:text-night-text font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Manga
            </Link>
          )}
        </div>
      </div>
    );
  }

  const currentChNum = chapterInfo?.attributes?.chapter || '0';

  return (
    <div className="flex flex-col min-h-screen bg-day-bg dark:bg-night-bg transition-colors duration-300">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-30 w-full bg-day-card/90 dark:bg-night-card/90 backdrop-blur border-b border-day-border dark:border-night-border transition-colors duration-300 shadow-sm py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Back link */}
          <div className="flex items-center gap-3">
            {mangaId && (
              <Link
                to={`/manga/${mangaId}`}
                className="p-2 rounded-lg hover:bg-day-bg dark:hover:bg-night-bg text-day-muted hover:text-day-text dark:text-night-muted dark:hover:text-night-text"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="truncate text-center sm:text-left">
              <h1 className="text-sm font-bold text-day-text dark:text-night-text truncate max-w-[250px] md:max-w-xs">
                {mangaTitle || 'Manga'}
              </h1>
              <p className="text-3xs font-extrabold uppercase tracking-wider text-day-accent dark:text-night-accent">
                Chapter {currentChNum} {chapterInfo?.attributes?.title && ` - ${chapterInfo.attributes.title}`}
              </p>
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={chapterId}
              onChange={handleChapterChange}
              className="px-3 py-1.5 rounded-lg border border-day-border dark:border-night-border bg-day-card dark:bg-night-card text-day-text dark:text-night-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-day-accent/40"
            >
              {[...chapters].reverse().map((c) => (
                <option key={c.id} value={c.id}>
                  Ch. {c.attributes?.chapter || '?'} {c.attributes?.title ? ` - ${c.attributes.title}` : ''}
                </option>
              ))}
            </select>

            {/* Read Mode Switcher */}
            <div className="flex items-center rounded-lg border border-day-border dark:border-night-border p-0.5 bg-day-card dark:bg-night-card">
              <button
                onClick={() => setReadMode('vertical')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  readMode === 'vertical'
                    ? 'bg-day-accent text-white dark:bg-night-accent'
                    : 'text-day-muted dark:text-night-muted hover:text-day-text'
                }`}
                title="Vertical Scroll Mode"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReadMode('horizontal')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  readMode === 'horizontal'
                    ? 'bg-day-accent text-white dark:bg-night-accent'
                    : 'text-day-muted dark:text-night-muted hover:text-day-text'
                }`}
                title="Horizontal Page-Flip Mode"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Container */}
      <div className="flex-grow flex flex-col items-center justify-start py-6 max-w-4xl mx-auto w-full px-4">
        {readMode === 'vertical' ? (
          /* VERTICAL SCROLL MODE */
          <div ref={scrollContainerRef} className="flex flex-col gap-4 w-full">
            {pages.map((src, index) => (
              <div
                key={index}
                ref={(el) => (pageRefs.current[index] = el)}
                className="w-full bg-day-card dark:bg-night-card border border-day-border dark:border-night-border rounded-lg overflow-hidden shadow-sm flex items-center justify-center min-h-[300px]"
              >
                <img
                  src={src}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  className="max-w-full h-auto object-contain select-none"
                />
              </div>
            ))}
          </div>
        ) : (
          /* HORIZONTAL PAGE-FLIP MODE */
          <div className="w-full flex flex-col items-center gap-4 relative">
            <div className="relative w-full max-w-3xl bg-day-card dark:bg-night-card border border-day-border dark:border-night-border rounded-2xl overflow-hidden shadow-md min-h-[60vh] flex items-center justify-center">
              
              {/* Click target left */}
              <div
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="absolute left-0 top-0 bottom-0 w-1/4 cursor-w-resize z-10 flex items-center pl-4 group"
              >
                <span className="p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="w-6 h-6" />
                </span>
              </div>

              {/* Click target right */}
              <div
                onClick={() => {
                  if (currentPage < pages.length) {
                    setCurrentPage((prev) => prev + 1);
                  } else if (currentPage === pages.length && nextChapter) {
                    navigate(`/reader/${nextChapter.id}`, { state: { mangaId } });
                  }
                }}
                className="absolute right-0 top-0 bottom-0 w-1/4 cursor-e-resize z-10 flex items-center justify-end pr-4 group"
              >
                <span className="p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6" />
                </span>
              </div>

              {/* Current Page Image */}
              <img
                src={pages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] w-auto object-contain select-none max-w-full"
              />
            </div>

            {/* Quick Page Jump Slider */}
            <div className="flex items-center gap-3 w-full max-w-md pt-2">
              <span className="text-xs font-semibold text-day-muted dark:text-night-muted">Page 1</span>
              <input
                type="range"
                min="1"
                max={pages.length}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="flex-grow accent-day-accent dark:accent-night-accent h-1.5 bg-day-border dark:bg-night-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-day-muted dark:text-night-muted">Page {pages.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Progress & Navigation Bar */}
      <div className="sticky bottom-0 z-30 w-full bg-day-card/95 dark:bg-night-card/95 border-t border-day-border dark:border-night-border py-4 px-4 shadow-md transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Progress bar visual indicator */}
          <div className="flex flex-col w-full sm:w-auto items-center sm:items-start">
            <span className="text-xs font-bold text-day-text dark:text-night-text">
              Page {currentPage} of {pages.length}
            </span>
            <div className="w-32 h-1.5 bg-day-border dark:bg-night-border rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-day-accent dark:bg-night-accent transition-all duration-200"
                style={{ width: `${(currentPage / pages.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Prev / Next Chapter Buttons */}
          <div className="flex gap-3 w-full sm:w-auto justify-center">
            {prevChapter ? (
              <Link
                to={`/reader/${prevChapter.id}`}
                state={{ mangaId }}
                className="flex items-center gap-1.5 px-4 py-2 border border-day-border dark:border-night-border rounded-xl text-xs font-bold bg-day-card dark:bg-night-card text-day-text dark:text-night-text hover:bg-day-bg/40 dark:hover:bg-night-bg/30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Chapter (Ch. {prevChapter.attributes?.chapter})</span>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 border border-day-border/50 dark:border-night-border/50 rounded-xl text-xs font-bold text-day-muted/50 dark:text-night-muted/50 cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>First Chapter</span>
              </button>
            )}

            {nextChapter ? (
              <Link
                to={`/reader/${nextChapter.id}`}
                state={{ mangaId }}
                className="flex items-center gap-1.5 px-4 py-2 bg-day-accent dark:bg-night-accent text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                <span>Next Chapter (Ch. {nextChapter.attributes?.chapter})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 border border-day-border/50 dark:border-night-border/50 rounded-xl text-xs font-bold text-day-muted/50 dark:text-night-muted/50 cursor-not-allowed"
              >
                <span>Latest Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
