import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, AlertCircle, BookOpen } from 'lucide-react';
import { getMangaList } from '../api/mangadex';
import { useFavouritesStore } from '../store/favourites';
import MangaCard from '../components/MangaCard';
import { SkeletonCard } from '../components/SkeletonCard';

export const Favourites = () => {
  const navigate = useNavigate();
  const favourites = useFavouritesStore((state) => state.favourites);

  // Fetch manga data for all favorited IDs
  const { data: mangas, isLoading, isError, refetch } = useQuery({
    queryKey: ['favouriteMangas', favourites.join(',')],
    queryFn: () => {
      if (favourites.length === 0) return Promise.resolve({ data: [] });
      return getMangaList({ ids: favourites, limit: 100 });
    },
    enabled: favourites.length > 0,
    select: (res) => res.data || [],
  });

  return (
    <div className="favourites-page-container">
      <div className="section-heading-wrapper">
        <h3 className="section-title">Your Favourites</h3>
      </div>

      {favourites.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} fill="none" color="var(--accent-primary)" />
          <h3>No favourites yet</h3>
          <p>Tap ♡ on any manga detail page to save them here for quick access.</p>
          <button onClick={() => navigate('/')}>Browse Titles</button>
        </div>
      ) : isLoading ? (
        <div className="manga-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Failed to load favourites</h3>
          <p>We couldn't retrieve your saved manga from MangaDex.</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      ) : mangas.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No records found</h3>
          <p>We couldn't find details for your favorites. They may have been deleted.</p>
        </div>
      ) : (
        <div className="manga-grid animate-fade-in">
          {mangas.map((manga) => (
            <MangaCard key={manga.id} manga={manga} showRemoveOption={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;
