import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useHistoryStore = create(
  persist(
    (set, get) => ({
      history: [], // Array of { mangaId, mangaTitle, coverUrl, chapterId, chapterNumber, chapterTitle, scrollY, timestamp }
      
      addHistory: ({ mangaId, mangaTitle, coverUrl, chapterId, chapterNumber, chapterTitle, scrollY }) => {
        const currentHistory = get().history;
        
        // Remove existing entry for this manga if it exists
        const filtered = currentHistory.filter((item) => item.mangaId !== mangaId);
        
        // Add new entry to the front
        const newRecord = {
          mangaId,
          mangaTitle,
          coverUrl,
          chapterId,
          chapterNumber,
          chapterTitle: chapterTitle || '',
          scrollY: scrollY || 0,
          timestamp: Date.now(),
        };
        
        set({ history: [newRecord, ...filtered] });
      },
      
      updateScrollPosition: (mangaId, chapterId, scrollY) => {
        const currentHistory = get().history;
        const updated = currentHistory.map((item) => {
          if (item.mangaId === mangaId && item.chapterId === chapterId) {
            return { ...item, scrollY, timestamp: Date.now() };
          }
          return item;
        });
        set({ history: updated });
      },

      removeMangaFromHistory: (mangaId) => {
        set({ history: get().history.filter((item) => item.mangaId !== mangaId) });
      },
      
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'sparkdex_history',
    }
  )
);
