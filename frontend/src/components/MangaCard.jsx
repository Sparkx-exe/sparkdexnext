// MangaCard v4 — full title, status badge top-right
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BookOpen, ExternalLink } from 'lucide-react';
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
  // External reading link (some titles only have external chapters)
  const links = manga.attributes?.links || {};
  const externalUrl = links.raw || links.engtl || links.mu || null;

  const handleCardClick = (e) => {
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

  // Content rating dot color
  const getRatingColor = () => {
    switch (contentRating) {
      case 'erotica':
      case 'pornographic':
        return '#FF4C6A';
      case 'suggestive':
        return '#FF9F4A';
      case 'safe':
      default:
        return '#2ECC9A';
    }
  };

  // Status badge class
  const getStatusBadgeClass = () => {
    switch (status) {
      case 'ongoing':   return 'manga-card-status-badge status-ongoing';
      case 'completed': return 'manga-card-status-badge status-completed';
      case 'hiatus':    return 'manga-card-status-badge status-hiatus';
      case 'cancelled': return 'manga-card-status-badge status-cancelled';
      default:          return 'manga-card-status-badge status-unknown';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'ongoing':   return 'Ongoing';
      case 'completed': return 'Finished';
      case 'hiatus':    return 'Hiatus';
      case 'cancelled': return 'Cancelled';
      default:          return status || '';
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

        {/* Content rating dot — top-left of cover */}
        <span
          className="manga-card-rating-dot"
          style={{ backgroundColor: getRatingColor() }}
          title={`Content Rating: ${contentRating}`}
        />

        {/* Status badge — TOP-RIGHT corner of cover */}
        {status && (
          <span className={getStatusBadgeClass()}>
            {getStatusLabel()}
          </span>
        )}

        {/* External link indicator */}
        {externalUrl && (
          <span className="manga-card-external-tag" title="Has external reading link">
            <ExternalLink size={10} />
            <span>Ext</span>
          </span>
        )}

        {/* Hover overlay */}
        <div className="manga-card-overlay">
          <span className="manga-card-overlay-btn">Read Info</span>
        </div>
      </div>

      <div className="manga-card-info">
        <div className="manga-card-meta">
          <span className="manga-card-author">{author}</span>
        </div>
        {/* Full title — NO truncation */}
        <h4 className="manga-card-title">
          {title}
        </h4>
      </div>

      {/* Context Menu */}
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
          {externalUrl && (
            <button onClick={(e) => {
              e.stopPropagation();
              window.open(externalUrl, '_blank', 'noopener,noreferrer');
              setShowContextMenu(false);
            }}>
              <ExternalLink size={14} />
              <span>Read Externally</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(MangaCard);
