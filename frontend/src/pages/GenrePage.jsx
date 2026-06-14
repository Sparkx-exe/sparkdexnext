import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Loader } from 'lucide-react';
import { getMangaList, getMangaCoverUrl, getMangaTitle, getTagList } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useSettingsStore } from '../store/settings';

const PAGE_SIZE = 20;

export const GenrePage = () => {
  const { genreId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const titleLanguage = useSettingsStore((s) => s.titleLanguage);

  // Name / cover passed from GenreCard via route state, or fallback
  const initialGenreName = location.state?.name || 'Genre';
  const initialCoverUrl = location.state?.coverUrl;

  const [resolvedGenreName, setResolvedGenreName] = useState(initialGenreName);
  const [tagCoverUrl, setTagCoverUrl] = useState(initialCoverUrl);
  const [mangas, setMangas] = useState([]);
  const [offset, setOffset] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Sentinel element at the bottom for IntersectionObserver
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Fallback details fetcher if bookmarked/refreshed
  useEffect(() => {
    // If we have both already, set state and exit
    if (initialCoverUrl && initialGenreName !== 'Genre') {
      setResolvedGenreName(initialGenreName);
      setTagCoverUrl(initialCoverUrl);
      return;
    }

    const fetchFallbackDetails = async () => {
      try {
        if (resolvedGenreName === 'Genre') {
          const tagsRes = await getTagList();
          const tags = tagsRes.data || [];
          const currentTag = tags.find(t => t.id === genreId);
          if (currentTag) {
            setResolvedGenreName(currentTag.attributes?.name?.en || 'Genre');
          }
        }

        if (!tagCoverUrl) {
          const res = await getMangaList({
            includedTags: [genreId],
            limit: 1,
            'order[followedCount]': 'desc',
            contentRating: ['safe', 'suggestive'],
          });
          const topManga = res.data?.[0];
          if (topManga) {
            setTagCoverUrl(getMangaCoverUrl(topManga, '256'));
          }
        }
      } catch (err) {
        console.error('Failed to load fallback category details:', err);
      }
    };

    fetchFallbackDetails();
  }, [genreId, initialCoverUrl, initialGenreName]);

  const fetchPage = useCallback(async (currentOffset) => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await getMangaList({
        'includedTags': [genreId],
        'contentRating': ['safe', 'suggestive'],
        limit: PAGE_SIZE,
        offset: currentOffset,
        'order[followedCount]': 'desc',
      });
      const newMangas = res.data || [];
      setMangas((prev) => currentOffset === 0 ? newMangas : [...prev, ...newMangas]);
      if (newMangas.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      setError(err.message || 'Failed to load manga');
    } finally {
      setIsFetching(false);
      setIsInitialLoad(false);
    }
  }, [genreId, isFetching, hasMore]);

  // Reset and fetch on genreId change
  useEffect(() => {
    setMangas([]);
    setOffset(0);
    setHasMore(true);
    setIsInitialLoad(true);
    setError(null);
  }, [genreId]);

  // Fetch when offset changes
  useEffect(() => {
    fetchPage(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, genreId]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetching) {
          setOffset((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '300px' }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isFetching]);

  return (
    <div className="genre-detail-page">
      {/* Hero header */}
      <div 
        className="genre-detail-hero"
        style={tagCoverUrl && tagCoverUrl !== 'placeholder' ? { '--hero-bg': `url(${tagCoverUrl})` } : undefined}
      >
        {tagCoverUrl && tagCoverUrl !== 'placeholder' && (
          <div className="genre-detail-hero-blur-bg" />
        )}
        <div className="genre-detail-hero-content">
          {tagCoverUrl && tagCoverUrl !== 'placeholder' ? (
            <img 
              className="genre-detail-cover" 
              src={tagCoverUrl} 
              alt={`${resolvedGenreName} category cover`} 
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          ) : (
            <div className="genre-detail-cover-placeholder">
              <BookOpen size={32} />
            </div>
          )}
          <div className="genre-detail-heading">
            <h1 className="genre-detail-title">{resolvedGenreName}</h1>
            <p className="genre-detail-subtitle">Browse all {resolvedGenreName.toLowerCase()} manga</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isInitialLoad ? (
        <div className="manga-grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Failed to load manga</h3>
          <p>{error}</p>
          <button onClick={() => { setOffset(0); setHasMore(true); setIsInitialLoad(true); }}>Retry</button>
        </div>
      ) : mangas.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No results found</h3>
          <p>There are no manga in this category yet.</p>
        </div>
      ) : (
        <>
          <div className="manga-grid">
            {mangas.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>

          {/* Loading more indicator */}
          {isFetching && !isInitialLoad && (
            <div className="genre-loading-more">
              <Loader size={22} className="animate-spin-custom" />
              <span>Loading more…</span>
            </div>
          )}

          {/* End of results */}
          {!hasMore && mangas.length > 0 && (
            <div className="genre-end-message">
              <span>✅ You've seen all {mangas.length} titles in {genreName}</span>
            </div>
          )}
        </>
      )}

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
    </div>
  );
};

export default GenrePage;
