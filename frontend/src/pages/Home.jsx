import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import HorizontalScroller from '../components/HorizontalScroller';
import VerticalLibrary from '../components/VerticalLibrary';
import { getMangaList, getTagList } from '../api/mangadex';
import { useRecommendations } from '../hooks/useRecommendations';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import MangaCard from '../components/MangaCard';
import { SkeletonCard } from '../components/SkeletonCard';

export const Home = () => {
  const queryClient = useQueryClient();
  const [refreshSeed, setRefreshSeed] = useState(0);

  // Callback to refresh all React Query feeds
  const handleRefresh = async () => {
    setRefreshSeed(prev => prev + 1);
    await queryClient.refetchQueries();
  };

  const { pullProgress, isRefreshing } = usePullToRefresh(handleRefresh);

  // Fetch tag list to dynamically resolve seasonal genres
  const { data: tags } = useQuery({
    queryKey: ['mangadexTags'],
    queryFn: getTagList,
    select: (res) => res.data || [],
  });

  const seasonalTagIds = tags
    ? tags
        .filter(t => ['School Life', 'Sports', 'Romance'].includes(t.attributes?.name?.en))
        .map(t => t.id)
    : [];

  // Hook for AI recommendations
  const { data: aiRecs, isLoading: aiRecsLoading } = useRecommendations();

  return (
    <div 
      className="home-page-viewport"
      style={{
        transform: pullProgress > 0 ? `translateY(${pullProgress}px)` : 'none',
        transition: pullProgress > 0 ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh spinner container */}
      {(pullProgress > 0 || isRefreshing) && (
        <div className="pull-to-refresh-indicator">
          <svg 
            className={`spark-refresh-spinner ${isRefreshing ? 'animate-spin-custom' : ''}`} 
            style={{ transform: `rotate(${pullProgress * 3.6}deg)` }}
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="var(--accent-primary)" stroke="var(--accent-glow)" strokeWidth="1.5" />
          </svg>
          <span className="pull-refresh-text">
            {isRefreshing ? 'Refreshing SparkDex...' : 'Pull to Refresh'}
          </span>
        </div>
      )}

      {/* Hero Banner Carousel */}
      <BannerCarousel key={`banner-${refreshSeed}`} />

      {/* Horizontal Scroll Rows */}
      <div className="home-sections-gutter">
        
        {/* Row 1: Popular Ongoing */}
        <HorizontalScroller
          key={`popular-${refreshSeed}`}
          title="🔥 Popular Ongoing"
          seeAllLink="/search"
          queryKey="homePopular"
          fetchFn={getMangaList}
          fetchParams={{
            status: ['ongoing'],
            'order[followedCount]': 'desc',
            'contentRating[]': ['safe', 'suggestive'],
          }}
        />

        {/* Row 2: Recently Added */}
        <HorizontalScroller
          key={`recent-${refreshSeed}`}
          title="🆕 Recently Added"
          seeAllLink="/search"
          queryKey="homeRecentlyAdded"
          fetchFn={getMangaList}
          fetchParams={{
            'order[createdAt]': 'desc',
            'contentRating[]': ['safe', 'suggestive'],
          }}
        />

        {/* Row 3: Seasonal (Sports & School Life) */}
        {seasonalTagIds.length > 0 && (
          <HorizontalScroller
            key={`seasonal-${refreshSeed}`}
            title="🌸 Seasonal Favorites"
            seeAllLink="/search"
            queryKey="homeSeasonal"
            fetchFn={getMangaList}
            fetchParams={{
              includedTags: seasonalTagIds,
              'order[followedCount]': 'desc',
              'contentRating[]': ['safe', 'suggestive'],
            }}
          />
        )}

        {/* Row 4: AI Recommendations */}
        <section className="horizontal-section-container">
          <div className="section-heading-wrapper">
            <h3 className="section-title">✨ Recommended For You</h3>
          </div>
          <div className="horizontal-scroller-wrapper">
            {aiRecsLoading ? (
              <div className="horizontal-scroller-track">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="scroller-card-container">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : !aiRecs || aiRecs.length === 0 ? (
              <div className="scroller-empty-state">
                <span>No recommendations generated yet.</span>
              </div>
            ) : (
              <div className="horizontal-scroller-track">
                {aiRecs.map((manga, index) => (
                  <div key={manga.id} className="scroller-card-container">
                    <MangaCard manga={manga} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Row 5: Latest Updates */}
        <HorizontalScroller
          key={`latest-${refreshSeed}`}
          title="⚡ Latest Updates"
          seeAllLink="/search"
          queryKey="homeLatest"
          fetchFn={getMangaList}
          fetchParams={{
            'order[latestUploadedChapter]': 'desc',
            'contentRating[]': ['safe', 'suggestive'],
          }}
        />

        {/* 2-Col/5-Col Grid: Vertical Library */}
        <VerticalLibrary key={`library-${refreshSeed}`} />
      </div>

      {/* Desktop scrolled-to-top manual refresh indicator */}
      <button 
        className="desktop-top-refresh-btn icon-button" 
        onClick={handleRefresh}
        title="Refresh data"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default Home;
