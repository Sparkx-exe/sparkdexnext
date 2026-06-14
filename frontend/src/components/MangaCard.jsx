import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Trash } from 'lucide-react';
import { getMangaCoverUrl, getMangaTitle, getMangaAuthor } from '../api/mangadex';
import { useSettingsStore } from '../store/settings';
import { useFavouritesStore } from '../store/favourites';

export const MangaCard = ({ manga, showRemoveOption = false }) => {
  const navigate = useNavigate();
  const titleLanguage = useSettingsStore((state) => state.titleLanguage);
  const { isFavourite, addFavourite, removeFavourite } = useFavouritesStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const title = getMangaTitle(manga, titleLanguage);
  const author = getMangaAuthor(manga);
  const coverUrl = getMangaCoverUrl(manga, '256');
  
  const contentRating = manga.attributes?.contentRating || 'safe';
  const status = manga.attributes?.status || '';

  const handleCardClick = (e) => {
    // Prevent navigating if context menu is open
    if (showContextMenu) {
      setShowContextMenu(false);
      return;
    }
    navigate(`/manga/${manga.id}`);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleToggleFavourite = (e) => {
    e.stopPropagation();
    if (isFavourite(manga.id)) {
      removeFavourite(manga.id);
    } else {
      addFavourite(manga.id);
    }
    setShowContextMenu(false);
  };

  // Close context menu on outside click
  React.useEffect(() => {
    const closeMenu = () => setShowContextMenu(false);
    if (showContextMenu) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [showContextMenu]);

  // Determine content rating dot color
  const getRatingColor = () => {
    switch (contentRating) {
      case 'erotica':
        return '#FF4C6A'; // --error
      case 'suggestive':
        return '#FF9F4A'; // --accent-glow
      case 'safe':
      default:
        return '#2ECC9A'; // --success
    }
  };

  return (
    <div 
      className="manga-card-wrapper tap-scale card-hover"
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
    >
      <div className="manga-card-cover-container">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={title} 
            loading="lazy"
            decoding="async"
            className="manga-card-image"
          />
        ) : (
          <div className="manga-card-image-fallback">
            <BookOpen size={32} />
          </div>
        )}
        
        {/* Rating dot indicator */}
        <span 
          className="manga-card-rating-dot" 
          style={{ backgroundColor: getRatingColor() }}
          title={`Content Rating: ${contentRating}`}
        />

        {/* Hover overlay with CTA */}
        <div className="manga-card-overlay">
          <span className="manga-card-overlay-btn">Read Info</span>
        </div>
      </div>

      <div className="manga-card-info">
        <h4 className="manga-card-title" title={title}>
          {title}
        </h4>
        <div className="manga-card-meta">
          <span className="manga-card-author">{author}</span>
          {status && <span className="manga-card-status">{status}</span>}
        </div>
      </div>

      {/* Context Menu (desktop right click, mobile triggerable) */}
      {showContextMenu && (
        <div 
          className="manga-card-context-menu glass-panel"
          style={{ 
            top: `${menuPosition.y}px`, 
            left: `${menuPosition.x}px`,
            position: 'fixed',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleToggleFavourite}>
            <Heart size={14} fill={isFavourite(manga.id) ? 'var(--accent-primary)' : 'none'} color="var(--accent-primary)" />
            <span>{isFavourite(manga.id) ? 'Remove Favourite' : 'Add Favourite'}</span>
          </button>
          <button onClick={() => navigate(`/manga/${manga.id}`)}>
            <BookOpen size={14} />
            <span>Go to Manga</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MangaCard;
