import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GenreCard = ({ tag, coverUrl }) => {
  const navigate = useNavigate();
  const name = tag.attributes?.name?.en || 'Unknown';

  const handleClick = () => {
    navigate(`/categories/${tag.id}`, { state: { name, coverUrl } });
  };

  // coverUrl is undefined while covers are loading, null/placeholder if no cover found
  const hasCover = coverUrl && coverUrl !== 'placeholder';
  const coverPending = coverUrl === undefined; // still being fetched

  return (
    <button 
      className={`genre-card ${hasCover ? 'has-cover' : 'no-cover'} ${coverPending ? 'cover-pending' : ''}`}
      onClick={handleClick} 
      aria-label={`Browse ${name} manga`}
    >
      {/* Shimmer skeleton shown while cover is being fetched */}
      {coverPending && <div className="genre-card-bg-skeleton" />}

      {/* Background cover image — fades in when ready */}
      {hasCover && (
        <div 
          className="genre-card-bg genre-card-bg-loaded" 
          style={{ backgroundImage: `url(${coverUrl})` }} 
        />
      )}
      
      {/* Semi-transparent dark overlay */}
      <div className="genre-card-overlay" />
      
      {/* Hover-only overlay for smooth 60fps fade transition */}
      <div className="genre-card-overlay-hover" />
      
      {/* Content — always visible so text shows even before cover loads */}
      <div className="genre-card-content">
        <span className="genre-card-name">{name}</span>
      </div>
    </button>
  );
};

export default GenreCard;
