import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash, BookOpen, AlertCircle } from 'lucide-react';
import { useHistoryStore } from '../store/history';

export const History = () => {
  const navigate = useNavigate();
  const { history, clearHistory, removeMangaFromHistory } = useHistoryStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Time delta helper (e.g. "2h ago", "3 days ago")
  const getTimeDelta = (timestamp) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleContinueReading = (item) => {
    navigate(`/manga/${item.mangaId}/chapter/${item.chapterId}`);
  };

  const handleConfirmClear = () => {
    clearHistory();
    setShowConfirmModal(false);
  };

  return (
    <div className="history-page-container">
      <div className="section-heading-wrapper">
        <h3 className="section-title">Reading History</h3>
        {history.length > 0 && (
          <button 
            className="clear-history-trigger-btn"
            onClick={() => setShowConfirmModal(true)}
          >
            <Trash size={16} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} />
          <h3>No reading history</h3>
          <p>Manga chapters you read will appear here. Continue reading where you left off!</p>
          <button onClick={() => navigate('/')}>Find Manga</button>
        </div>
      ) : (
        <div className="history-list-track animate-fade-in">
          {history.map((item) => (
            <div key={item.mangaId} className="history-row-item glass-panel">
              <div 
                className="history-row-cover" 
                onClick={() => navigate(`/manga/${item.mangaId}`)}
              >
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt={item.mangaTitle} />
                ) : (
                  <div className="history-row-cover-fallback">
                    <BookOpen size={20} />
                  </div>
                )}
              </div>

              <div className="history-row-info">
                <h4 
                  className="manga-title-link"
                  onClick={() => navigate(`/manga/${item.mangaId}`)}
                >
                  {item.mangaTitle}
                </h4>
                <div className="chapter-meta">
                  <span className="chapter-num">Ch. {item.chapterNumber}</span>
                  {item.chapterTitle && <span className="chapter-name"> - {item.chapterTitle}</span>}
                </div>
                <span className="timestamp">{getTimeDelta(item.timestamp)}</span>
              </div>

              <div className="history-row-actions">
                <button 
                  className="continue-reading-btn"
                  onClick={() => handleContinueReading(item)}
                >
                  Continue
                </button>
                
                <button 
                  className="history-delete-btn" 
                  onClick={() => removeMangaFromHistory(item.mangaId)}
                  title="Remove from history"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal glass-panel animate-heartbeat">
            <AlertCircle size={36} color="var(--error)" />
            <h3>Clear Reading History?</h3>
            <p>This action will permanently remove all reading progress logs. It cannot be undone.</p>
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={handleConfirmClear}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
