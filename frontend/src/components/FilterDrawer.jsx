import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Check, EyeOff, Eye, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { getTagList } from '../api/mangadex';
import { useSettingsStore } from '../store/settings';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'pt-br', name: 'Portuguese (Br)' },
  { code: 'it', name: 'Italian' },
  { code: 'de', name: 'German' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

const DEMOGRAPHICS = [
  { code: 'shounen', name: 'Shounen' },
  { code: 'shoujo', name: 'Shoujo' },
  { code: 'seinen', name: 'Seinen' },
  { code: 'josei', name: 'Josei' },
  { code: 'none', name: 'None' }
];

const STATUSES = [
  { code: 'ongoing', name: 'Ongoing' },
  { code: 'completed', name: 'Completed' },
  { code: 'hiatus', name: 'Hiatus' },
  { code: 'cancelled', name: 'Cancelled' }
];

const SORT_OPTIONS = [
  { code: 'followedCount', name: 'Most Follows' },
  { code: 'latestUploadedChapter', name: 'Latest Uploads' },
  { code: 'createdAt', name: 'Recently Added' },
  { code: 'rating', name: 'Highest Rated' },
  { code: 'title', name: 'Alphabetical' }
];

export const FilterDrawer = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    isFilterDrawerOpen,
    setFilterDrawerOpen
  } = useSettingsStore();

  const [localFilters, setLocalFilters] = useState({ ...filters });

  // Reset local state when store filters change or drawer opens
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setLocalFilters({ ...filters });
    }
  }, [filters, isFilterDrawerOpen]);

  // Fetch MangaDex tags
  const { data: tagResponse, isLoading: tagsLoading } = useQuery({
    queryKey: ['mangadexTags'],
    queryFn: getTagList,
    select: (res) => res.data || [],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  if (!isFilterDrawerOpen) return null;

  const handleToggleStatus = (code) => {
    const active = localFilters.status.includes(code);
    setLocalFilters({
      ...localFilters,
      status: active 
        ? localFilters.status.filter(s => s !== code)
        : [...localFilters.status, code]
    });
  };

  const handleToggleRating = (code) => {
    const active = localFilters.contentRating.includes(code);
    setLocalFilters({
      ...localFilters,
      contentRating: active
        ? localFilters.contentRating.filter(r => r !== code)
        : [...localFilters.contentRating, code]
    });
  };

  const handleToggleDemographic = (code) => {
    const active = localFilters.demographic.includes(code);
    setLocalFilters({
      ...localFilters,
      demographic: active
        ? localFilters.demographic.filter(d => d !== code)
        : [...localFilters.demographic, code]
    });
  };

  const handleToggleLanguage = (code) => {
    const active = localFilters.languages.includes(code);
    setLocalFilters({
      ...localFilters,
      languages: active
        ? localFilters.languages.filter(l => l !== code)
        : [...localFilters.languages, code]
    });
  };

  const handleTagCycle = (tagId) => {
    const isIncluded = localFilters.includedTags.includes(tagId);
    const isExcluded = localFilters.excludedTags.includes(tagId);

    if (isIncluded) {
      // Move from Included -> Excluded
      setLocalFilters({
        ...localFilters,
        includedTags: localFilters.includedTags.filter(id => id !== tagId),
        excludedTags: [...localFilters.excludedTags, tagId]
      });
    } else if (isExcluded) {
      // Move from Excluded -> Unselected
      setLocalFilters({
        ...localFilters,
        excludedTags: localFilters.excludedTags.filter(id => id !== tagId)
      });
    } else {
      // Move from Unselected -> Included
      setLocalFilters({
        ...localFilters,
        includedTags: [...localFilters.includedTags, tagId]
      });
    }
  };

  const handleApply = () => {
    setFilters(localFilters);
    setFilterDrawerOpen(false);
  };

  const handleReset = () => {
    resetFilters();
    setFilterDrawerOpen(false);
  };

  // Group tags by their group attribute (e.g. content, format, genre, theme)
  const groupedTags = tagResponse ? tagResponse.reduce((acc, tag) => {
    const group = tag.attributes?.group || 'genre';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {}) : {};

  return (
    <>
      <div 
        className="filter-drawer-scrim scrim-fade-in" 
        onClick={() => setFilterDrawerOpen(false)}
      />
      
      <div className="filter-drawer glass-panel">
        <div className="filter-drawer-header">
          <div className="header-title">
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </div>
          <button 
            className="filter-drawer-close-btn"
            onClick={() => setFilterDrawerOpen(false)}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        <div className="filter-drawer-body">
          {/* Sort Selection */}
          <div className="filter-group">
            <h4 className="filter-group-title">Sort By</h4>
            <div className="sort-select-wrapper">
              <select 
                value={localFilters.sortBy}
                onChange={(e) => setLocalFilters({ ...localFilters, sortBy: e.target.value })}
                className="filter-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Selection */}
          <div className="filter-group">
            <h4 className="filter-group-title">Publishing Status</h4>
            <div className="chips-wrapper">
              {STATUSES.map((status) => {
                const active = localFilters.status.includes(status.code);
                return (
                  <button
                    key={status.code}
                    onClick={() => handleToggleStatus(status.code)}
                    className={`filter-chip ${active ? 'active' : ''}`}
                  >
                    {status.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demographics Selection */}
          <div className="filter-group">
            <h4 className="filter-group-title">Demographic</h4>
            <div className="chips-wrapper">
              {DEMOGRAPHICS.map((demo) => {
                const active = localFilters.demographic.includes(demo.code);
                return (
                  <button
                    key={demo.code}
                    onClick={() => handleToggleDemographic(demo.code)}
                    className={`filter-chip ${active ? 'active' : ''}`}
                  >
                    {demo.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Ratings */}
          <div className="filter-group">
            <h4 className="filter-group-title">Content Rating</h4>
            <div className="chips-wrapper">
              {['safe', 'suggestive', 'erotica', 'pornographic'].map((rating) => {
                const active = localFilters.contentRating.includes(rating);
                return (
                  <button
                    key={rating}
                    onClick={() => handleToggleRating(rating)}
                    className={`filter-chip ${active ? 'active' : ''} rating-${rating}`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages Selection */}
          <div className="filter-group">
            <h4 className="filter-group-title">Languages</h4>
            <div className="chips-wrapper">
              {LANGUAGES.map((lang) => {
                const active = localFilters.languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleToggleLanguage(lang.code)}
                    className={`filter-chip ${active ? 'active' : ''}`}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genre/Theme Tags 3-State Chips */}
          <div className="filter-group">
            <h4 className="filter-group-title">Tags & Genres</h4>
            <div className="tags-hint">
              <span>Tap once to </span>
              <span className="text-include">Include</span>
              <span>, tap twice to </span>
              <span className="text-exclude">Exclude</span>
            </div>
            
            {tagsLoading ? (
              <div className="tags-loading animate-shimmer" />
            ) : (
              Object.entries(groupedTags).map(([group, tags]) => (
                <div key={group} className="tag-group-wrapper">
                  <h5 className="tag-group-subtitle">{group}</h5>
                  <div className="chips-wrapper">
                    {tags.map((tag) => {
                      const tagId = tag.id;
                      const name = tag.attributes?.name?.en || 'Unknown';
                      const isIncluded = localFilters.includedTags.includes(tagId);
                      const isExcluded = localFilters.excludedTags.includes(tagId);
                      
                      let chipClass = '';
                      if (isIncluded) chipClass = 'included';
                      if (isExcluded) chipClass = 'excluded';

                      return (
                        <button
                          key={tagId}
                          onClick={() => handleTagCycle(tagId)}
                          className={`filter-chip tag-chip tag-ripple ${chipClass}`}
                        >
                          {isIncluded && <Check size={10} className="tag-chip-icon" />}
                          {isExcluded && <span className="tag-chip-icon-x">×</span>}
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-drawer-actions">
          <button 
            className="filter-action-btn reset-btn"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            <span>Reset All</span>
          </button>
          
          <button 
            className="filter-action-btn apply-btn"
            onClick={handleApply}
          >
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
