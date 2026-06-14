import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getMangaList, getMangaCoverUrl, getMangaTitle } from '../api/mangadex';
import { useSettingsStore } from '../store/settings';
import { SkeletonBanner } from './SkeletonCard';

// Fisher-Yates shuffle — mutates and returns the array
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const BannerCarousel = () => {
  const navigate = useNavigate();
  const titleLanguage = useSettingsStore((state) => state.titleLanguage);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Touch swipe states
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  // Fetch a large pool of popular ongoing manga — no cache so always fresh
  const { data: rawMangas, isLoading, isError } = useQuery({
    queryKey: ['popularOngoingBanners'],
    queryFn: () => getMangaList({
      limit: 50,
      offset: Math.floor(Math.random() * 40), // random offset for variety
      status: ['ongoing'],
      'order[followedCount]': 'desc',
      'contentRating[]': ['safe', 'suggestive']
    }),
    select: (res) => res.data || [],
    staleTime: 0,        // always consider stale — refetch on every mount
    gcTime: 0,           // don't keep in cache between page loads
    refetchOnMount: true,
  });

  // Shuffle the pool and pick 10 — recalculated every time rawMangas changes
  const mangas = useMemo(() => {
    if (!rawMangas || rawMangas.length === 0) return [];
    const pool = shuffleArray([...rawMangas]);
    return pool.slice(0, 10);
  }, [rawMangas]);

  // Start at a random slide each time
  useEffect(() => {
    if (mangas.length > 0) {
      setActiveIndex(Math.floor(Math.random() * mangas.length));
    }
  }, [mangas]);

  // Auto-scroll loop
  useEffect(() => {
    if (!mangas || mangas.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % mangas.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [mangas, isPaused]);

  if (isLoading) return <SkeletonBanner />;
  if (isError || !mangas || mangas.length === 0) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % mangas.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + mangas.length) % mangas.length);
  };

  // Touch handlers for swipe support
  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    const diff = touchStart.current - touchEnd.current;

    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }
    
    setIsPaused(false);
  };

  return (
    <section 
      className="banner-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="carousel-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {mangas.map((manga) => {
          const title = getMangaTitle(manga, titleLanguage);
          const fullCoverUrl = getMangaCoverUrl(manga, '256');
          const cardCoverUrl = getMangaCoverUrl(manga, '512');
          const tags = manga.attributes?.tags
            ?.slice(0, 3)
            ?.map((t) => t.attributes?.name?.en) || [];

          return (
            <div key={manga.id} className="carousel-slide">
              {/* Blurred Cover Art Background */}
              <div 
                className="slide-backdrop" 
                style={{ backgroundImage: `url(${fullCoverUrl})` }}
              />
              <div className="slide-scrim" />

              {/* Main Content Area */}
              <div className="slide-content">
                <div className="slide-cover-art-wrapper">
                  <img 
                    src={cardCoverUrl} 
                    alt={title} 
                    className="slide-cover-art"
                    decoding="async"
                    loading="eager"
                  />
                </div>

                <div className="slide-details" key={`details-${manga.id}-${activeIndex}`}>
                  <div className="slide-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="slide-tag-pill">{tag}</span>
                    ))}
                  </div>
                  
                  <h2 className="slide-title">{title}</h2>
                  
                  <p className="slide-author">
                    By {manga.relationships?.find(r => r.type === 'author')?.attributes?.name || 'Unknown Author'}
                  </p>

                  <button 
                    className="slide-cta-btn"
                    onClick={() => navigate(`/manga/${manga.id}`)}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Read Now</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Arrows */}
      <button className="carousel-arrow prev" onClick={prevSlide} aria-label="Previous slide">
        <ChevronLeft size={24} />
      </button>
      <button className="carousel-arrow next" onClick={nextSlide} aria-label="Next slide">
        <ChevronRight size={24} />
      </button>

      {/* Pagination Dots */}
      <div className="carousel-dots">
        {mangas.map((_, index) => (
          <button 
            key={index} 
            className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default BannerCarousel;
