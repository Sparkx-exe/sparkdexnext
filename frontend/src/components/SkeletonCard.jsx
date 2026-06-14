import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-cover animate-shimmer" />
      <div className="skeleton-details">
        <div className="skeleton-line skeleton-title animate-shimmer" />
        <div className="skeleton-line skeleton-subtitle animate-shimmer" />
      </div>
    </div>
  );
};

export const SkeletonBanner = () => {
  return (
    <div className="skeleton-banner animate-shimmer">
      <div className="skeleton-banner-content">
        <div className="skeleton-line skeleton-banner-title animate-shimmer" />
        <div className="skeleton-line skeleton-banner-text animate-shimmer" style={{ width: '60%' }} />
        <div className="skeleton-line skeleton-banner-text animate-shimmer" style={{ width: '40%' }} />
        <div className="skeleton-banner-button animate-shimmer" />
      </div>
    </div>
  );
};

export default SkeletonCard;
