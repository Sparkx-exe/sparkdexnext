import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialFilters = {
  status: [], // 'ongoing', 'completed', 'hiatus', 'cancelled'
  contentRating: ['safe', 'suggestive'], // 'safe', 'suggestive', 'erotica'
  demographic: [], // 'shounen', 'shoujo', 'seinen', 'josei', 'none'
  sortBy: 'followedCount', // 'latestUploadedChapter' | 'createdAt' | 'followedCount' | 'rating' | 'relevance'
  sortOrder: 'desc',
  languages: ['en'],
  includedTags: [],
  excludedTags: [],
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // User settings
      titleLanguage: 'romaji', // 'romaji' | 'english' | 'original'
      theme: 'dark', // 'dark' | 'amoled' | 'dim'
      readingSpeed: 'off', // 'off' | 'slow' | 'medium' | 'fast'
      imageQuality: 'standard', // 'data-saver' | 'standard' | 'high'
      
      // UI State
      isSidePanelOpen: false,
      isFilterDrawerOpen: false,
      isSearchModalOpen: false,
      
      // Filters (persisted too, so user preferences are saved)
      filters: { ...initialFilters },
      
      setTitleLanguage: (lang) => set({ titleLanguage: lang }),
      setTheme: (theme) => set({ theme }),
      setReadingSpeed: (speed) => set({ readingSpeed: speed }),
      setImageQuality: (quality) => set({ imageQuality: quality }),
      
      // UI actions
      setSidePanelOpen: (isOpen) => set({ isSidePanelOpen: isOpen }),
      setFilterDrawerOpen: (isOpen) => set({ isFilterDrawerOpen: isOpen }),
      setSearchModalOpen: (isOpen) => set({ isSearchModalOpen: isOpen }),
      
      // Filter actions
      setFilters: (newFilters) => set({ filters: { ...get().filters, ...newFilters } }),
      resetFilters: () => set({ filters: { ...initialFilters } }),
      
      // Helper to count active filters
      getActiveFiltersCount: () => {
        const f = get().filters;
        let count = 0;
        if (f.status.length > 0) count += f.status.length;
        // count contentRating additions/removals from default
        if (JSON.stringify(f.contentRating.sort()) !== JSON.stringify(['safe', 'suggestive'].sort())) count += 1;
        if (f.demographic.length > 0) count += f.demographic.length;
        if (f.sortBy !== 'followedCount') count += 1;
        if (f.languages.length > 0 && JSON.stringify(f.languages) !== JSON.stringify(['en'])) count += f.languages.length;
        if (f.includedTags.length > 0) count += f.includedTags.length;
        if (f.excludedTags.length > 0) count += f.excludedTags.length;
        return count;
      }
    }),
    {
      name: 'sparkdex_settings',
      // Only persist user settings and filters, do not persist volatile UI open states
      partialize: (state) => ({
        titleLanguage: state.titleLanguage,
        theme: state.theme,
        readingSpeed: state.readingSpeed,
        imageQuality: state.imageQuality,
        filters: state.filters,
      }),
    }
  )
);
