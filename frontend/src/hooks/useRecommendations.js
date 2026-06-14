import { useQuery } from '@tanstack/react-query';
import { fetchAiRecommendations } from '../api/gemini';
import { useHistoryStore } from '../store/history';

const CACHE_KEY = 'sparkdex_recommendations';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export const useRecommendations = () => {
  const history = useHistoryStore((state) => state.history);

  return useQuery({
    queryKey: ['aiRecommendations', history.map(h => h.mangaId).join(',')],
    queryFn: async () => {
      // 1. Check if history is empty (new user)
      if (history.length === 0) {
        return fetchAiRecommendations([]);
      }

      // 2. Check localStorage cache
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { mangas, generatedAt, historySignature } = JSON.parse(cached);
          const currentSignature = history.map(h => h.mangaId).join(',');
          
          const isExpired = Date.now() - generatedAt > CACHE_DURATION;
          const isHistoryChanged = historySignature !== currentSignature;

          if (!isExpired && !isHistoryChanged && mangas && mangas.length > 0) {
            return mangas;
          }
        }
      } catch (e) {
        console.error('Failed to parse cached recommendations', e);
      }

      // 3. Fetch fresh recommendations from Gemini
      const freshRecommendations = await fetchAiRecommendations(history);

      // 4. Save to cache
      try {
        const cacheData = {
          mangas: freshRecommendations,
          generatedAt: Date.now(),
          historySignature: history.map(h => h.mangaId).join(','),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Failed to save recommendations to cache', e);
      }

      return freshRecommendations;
    },
    staleTime: 1000 * 60 * 10, // 10 mins staletime
  });
};

export default useRecommendations;
