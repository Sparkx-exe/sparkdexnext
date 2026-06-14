import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="w-full h-[380px] bg-day-card dark:bg-night-card rounded-xl overflow-hidden border border-day-border dark:border-night-border animate-pulse">
      {/* Cover Image Placeholder */}
      <div className="w-full h-3/5 bg-day-border/50 dark:bg-night-border/50" />
      {/* Text Info Placeholder */}
      <div className="p-4 space-y-3 flex-grow">
        {/* Author tag */}
        <div className="h-3 bg-day-border/50 dark:bg-night-border/50 rounded w-1/4" />
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-day-border/50 dark:bg-night-border/50 rounded w-5/6" />
          <div className="h-4 bg-day-border/50 dark:bg-night-border/50 rounded w-1/2" />
        </div>
        {/* Description */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-day-border/30 dark:bg-night-border/30 rounded w-full" />
          <div className="h-3 bg-day-border/30 dark:bg-night-border/30 rounded w-full" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonDetail = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover Skeleton */}
        <div className="w-full md:w-72 h-96 bg-day-border/50 dark:bg-night-border/50 rounded-xl" />
        {/* Content Skeleton */}
        <div className="flex-grow space-y-4 pt-4">
          <div className="h-8 bg-day-border/50 dark:bg-night-border/50 rounded w-2/3" />
          <div className="h-4 bg-day-border/50 dark:bg-night-border/50 rounded w-1/4" />
          <div className="flex gap-2">
            <div className="h-6 bg-day-border/50 dark:bg-night-border/50 rounded w-16" />
            <div className="h-6 bg-day-border/50 dark:bg-night-border/50 rounded w-24" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-day-border/30 dark:bg-night-border/30 rounded w-full" />
            <div className="h-4 bg-day-border/30 dark:bg-night-border/30 rounded w-full" />
            <div className="h-4 bg-day-border/30 dark:bg-night-border/30 rounded w-3/4" />
          </div>
        </div>
      </div>
      {/* Chapter List Skeleton */}
      <div className="space-y-3 pt-6 border-t border-day-border dark:border-night-border">
        <div className="h-6 bg-day-border/50 dark:bg-night-border/50 rounded w-1/5 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-day-border/30 dark:bg-night-border/30 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
};
