import { useHistoryStore } from '../store/history';

export const useReadingHistory = () => {
  const { history, addHistory, clearHistory, removeMangaFromHistory } = useHistoryStore();

  const getProgressForManga = (mangaId) => {
    return history.find((h) => h.mangaId === mangaId) || null;
  };

  const isChapterRead = (mangaId, chapterId) => {
    return history.some((h) => h.mangaId === mangaId && h.chapterId === chapterId);
  };

  return {
    history,
    addHistory,
    clearHistory,
    removeMangaFromHistory,
    getProgressForManga,
    isChapterRead,
  };
};

export default useReadingHistory;
