import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFavourites } from '../context/FavouritesContext';
import { SkeletonDetail } from '../components/SkeletonLoader';
import { getMangaTitle, getMangaAuthor, getMangaCoverUrl, getMangaDescription } from '../utils/mangadex';
import { Heart, BookOpen, ArrowLeft, Bookmark, Calendar } from 'lucide-react';

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFavourite, removeFavourite, isFavourite } = useFavourites();
  
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Last read chapter from localStorage
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    // Read last read info
    try {
      const stored = localStorage.getItem(`mangaLastRead_${id}`);
      if (stored) {
        setLastRead(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse last read chapter', e);
    }
  }, [id]);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch manga resource + relationships (cover_art, author, artist)
        const mangaRes = await fetch(`/api/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
        if (!mangaRes.ok) throw new Error('Manga not found or API error');
        const mangaData = await mangaRes.json();
        
        if (!mangaData.data) throw new Error('Manga data is empty');
        
        const mangaObj = mangaData.data;
        setManga(mangaObj);

        // Fetch chapters feed
        // We fetch in English (translatedLanguage[]=en) and order by chapter desc
        const feedRes = await fetch(
          `/api/manga/${id}/feed?limit=500&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`
        );
        if (!feedRes.ok) throw new Error('Failed to fetch chapter feed');
        const feedData = await feedRes.json();
        
        const rawChapters = feedData.data || [];
        
        // Filter out duplicate chapter numbers to avoid cluttering (e.g. multiple groups)
        const uniqueChapters = [];
        const seenChapters = new Set();
        
        rawChapters.forEach((ch) => {
          const num = ch.attributes?.chapter;
          // If the chapter has a number, filter duplicate numbers.
          if (num !== null && num !== undefined) {
            if (!seenChapters.has(num)) {
              seenChapters.add(num);
              uniqueChapters.push(ch);
            }
          } else {
            // If it's a oneshot or has no chapter number, just add it.
            uniqueChapters.push(ch);
          }
        });

        // Ensure sorted by chapter descending (numerically if possible)
        uniqueChapters.sort((a, b) => {
          const numA = parseFloat(a.attributes?.chapter || '0');
          const numB = parseFloat(b.attributes?.chapter || '0');
          return numB - numA;
        });

        setChapters(uniqueChapters);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetails();
  }, [id]);

  // Safely update document title when manga state updates
  useEffect(() => {
    if (manga) {
      const title = getMangaTitle(manga);
      document.title = `${title} — Sparkdex`;
    }
  }, [manga]);

  if (loading) return <SkeletonDetail />;

  if (error || !manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Error Loading Manga</h2>
        <p className="text-day-muted dark:text-night-muted">{error || 'Manga details could not be loaded.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-day-accent dark:bg-night-accent text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const title = getMangaTitle(manga);
  const description = getMangaDescription(manga);
  const coverUrl = getMangaCoverUrl(manga);
  const author = getMangaAuthor(manga);
  const status = manga.attributes?.status;
  const genres = (manga.attributes?.tags || [])
    .filter((tag) => tag.attributes?.group === 'genre')
    .map((tag) => ({
      id: tag.id,
      name: tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0],
    }));

  const favorited = isFavourite(manga.id);

  const handleFavouriteToggle = () => {
    if (favorited) {
      removeFavourite(manga.id);
    } else {
      addFavourite({
        id: manga.id,
        title,
        coverUrl,
        description,
        status,
        author,
      });
    }
  };

  const handleResumeReading = () => {
    if (lastRead?.chapterId) {
      navigate(`/reader/${lastRead.chapterId}`, { state: { mangaId: id } });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-day-muted hover:text-day-text dark:text-night-muted dark:hover:text-night-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Info Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Cover Art and Action */}
        <div className="w-full md:w-72 flex flex-col items-center gap-4 shrink-0">
          <div className="w-56 md:w-72 h-[340px] md:h-[400px] bg-day-card dark:bg-night-card rounded-2xl overflow-hidden border border-day-border dark:border-night-border shadow-md relative">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-day-muted dark:text-night-muted">
                <BookOpen className="w-12 h-12 mb-2 opacity-60" />
                <span className="text-xs">No Cover Art</span>
              </div>
            )}
            
            {status && (
              <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-3xs font-extrabold uppercase tracking-wider border bg-day-card/90 dark:bg-night-card/90 text-day-text dark:text-night-text border-day-border dark:border-night-border">
                {status}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full max-w-[280px] md:max-w-none">
            {/* Favorite button */}
            <button
              onClick={handleFavouriteToggle}
              className={`flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold tracking-wide transition-all duration-300 ${
                favorited
                  ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/10 hover:bg-red-600 hover:border-red-600'
                  : 'bg-day-card border-day-border text-day-text hover:bg-day-bg dark:bg-night-card dark:border-night-border dark:text-night-text dark:hover:bg-night-bg'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
              <span>{favorited ? 'Favourited' : 'Add to Favourites'}</span>
            </button>
          </div>
        </div>

        {/* Text Information */}
        <div className="flex-grow space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-day-text dark:text-night-text tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm md:text-base font-semibold text-day-accent dark:text-night-accent opacity-90">
              by {author}
            </p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span
                key={genre.id}
                className="px-2.5 py-1 bg-day-accent/10 text-day-accent border border-day-accent/20 dark:bg-night-accent/10 dark:text-night-accent dark:border-night-accent/20 text-xs font-semibold rounded-full"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <div className="space-y-2 bg-day-card/40 dark:bg-night-card/20 p-4 rounded-xl border border-day-border/50 dark:border-night-border/30">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-day-muted dark:text-night-muted">Synopsis</h3>
            <p className="text-sm text-day-text dark:text-night-text leading-relaxed whitespace-pre-wrap opacity-95">
              {description || 'No description available for this manga.'}
            </p>
          </div>

          {/* Resume Reading banner */}
          {lastRead && (
            <div className="flex items-center justify-between p-4 bg-day-accent/10 border border-day-accent/20 dark:bg-night-accent/10 dark:border-night-accent/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-day-accent dark:text-night-accent" />
                <div>
                  <h4 className="text-xs font-bold text-day-text dark:text-night-text">Resume Reading</h4>
                  <p className="text-xs text-day-muted dark:text-night-muted">
                    Last read: Chapter {lastRead.chapterNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={handleResumeReading}
                className="px-4 py-1.5 bg-day-accent dark:bg-night-accent text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all"
              >
                Read Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chapters Section */}
      <div className="space-y-4 pt-6 border-t border-day-border dark:border-night-border">
        <h2 className="text-xl font-bold text-day-text dark:text-night-text flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-day-accent dark:text-night-accent" />
          <span>Chapters ({chapters.length})</span>
        </h2>

        {chapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
            {chapters.map((ch) => {
              const chNum = ch.attributes?.chapter || '?';
              const chTitle = ch.attributes?.title;
              const chDate = ch.attributes?.publishAt
                ? new Date(ch.attributes.publishAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : null;
              
              // Find scanlation group name
              const groupRelation = ch.relationships?.find((r) => r.type === 'scanlation_group');
              const groupName = groupRelation?.attributes?.name || 'Unknown Group';

              const isRead = lastRead?.chapterId === ch.id;

              return (
                <Link
                  key={ch.id}
                  to={`/reader/${ch.id}`}
                  state={{ mangaId: id }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md ${
                    isRead
                      ? 'bg-day-accent/5 border-day-accent/40 text-day-accent dark:bg-night-accent/5 dark:border-night-accent/40 dark:text-night-accent'
                      : 'bg-day-card border-day-border text-day-text hover:bg-day-bg/40 dark:bg-night-card dark:border-night-border dark:text-night-text dark:hover:bg-night-bg/30'
                  }`}
                >
                  <div className="space-y-1 pr-4 truncate">
                    <span className="text-sm font-bold">
                      Chapter {chNum}
                      {chTitle && <span className="font-medium text-day-muted dark:text-night-muted"> — {chTitle}</span>}
                    </span>
                    <div className="flex items-center gap-2 text-3xs text-day-muted dark:text-night-muted uppercase tracking-wider font-semibold">
                      <span>{groupName}</span>
                      {chDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {chDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isRead && (
                    <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-day-accent/15 dark:bg-night-accent/15 border border-current shrink-0">
                      Read
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-day-card dark:bg-night-card rounded-xl border border-day-border dark:border-night-border text-day-muted dark:text-night-muted">
            No English chapters available for this manga.
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaDetail;
